from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from research.models import ResearchProject
from .models import Analysis
from .serializers import AnalysisSerializer
from common.ai_service import analyze_research_gaps


class AnalysisListCreateView(generics.ListCreateAPIView):
    serializer_class = AnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'analysis_type', 'status']
    ordering_fields = ['created_at', 'status', 'title']

    def get_queryset(self):
        user = self.request.user
        queryset = Analysis.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user) | Q(project__is_public=True)
        ).distinct()

        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        analysis_type = self.request.query_params.get('type')
        if analysis_type:
            queryset = queryset.filter(analysis_type=analysis_type)

        return queryset


class AnalysisDetailView(generics.RetrieveAPIView):
    serializer_class = AnalysisSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Analysis.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user)
        ).distinct()


class RunGapAnalysisView(APIView):
    """
    Executes real negative-space gap detection using Groq LLM
    across all ingested literature sources and project notes.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_id = request.data.get('project_id')
        if not project_id:
            return Response(
                {'error': 'project_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        project = get_object_or_404(ResearchProject, pk=project_id)

        # Check permissions
        if project.owner != request.user and not project.collaborators.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You do not have access to this project.'},
                status=status.HTTP_403_FORBIDDEN
            )

        sources = list(project.sources.all())
        notes = list(project.notes.all())

        started_at = timezone.now()

        try:
            # Real LLM call via Groq
            ai_result = analyze_research_gaps(project, sources, notes)

            # Update project gap score and summary
            if 'gap_score' in ai_result:
                project.gap_score = float(ai_result['gap_score'])
            if 'gap_summary' in ai_result and ai_result['gap_summary']:
                project.gap_summary = ai_result['gap_summary']
            project.save()

            # Record analysis in database
            analysis = Analysis.objects.create(
                project=project,
                created_by=request.user,
                analysis_type=Analysis.AnalysisType.GAP_DETECTION,
                status=Analysis.Status.COMPLETED,
                title=f"Empirical Gap Detection — {project.title[:60]}",
                parameters={
                    'sources_analyzed': len(sources),
                    'notes_analyzed': len(notes),
                },
                results=ai_result,
                started_at=started_at,
                completed_at=timezone.now(),
            )

            serializer = AnalysisSerializer(analysis)
            return Response({
                'analysis': serializer.data,
                'project': {
                    'id': project.id,
                    'gap_score': project.gap_score,
                    'gap_summary': project.gap_summary,
                },
                'message': 'Negative space analysis completed successfully.'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Record failed analysis
            Analysis.objects.create(
                project=project,
                created_by=request.user,
                analysis_type=Analysis.AnalysisType.GAP_DETECTION,
                status=Analysis.Status.FAILED,
                title=f"Failed Gap Detection — {project.title[:60]}",
                error_message=str(e),
                started_at=started_at,
                completed_at=timezone.now(),
            )
            return Response(
                {'error': f"AI Gap detection failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
