from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from research.models import ResearchProject
from .models import Report
from .serializers import ReportSerializer
from common.ai_service import synthesize_intelligence_report


class ReportListCreateView(generics.ListCreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'report_type']
    ordering_fields = ['created_at', 'title', 'report_type']

    def get_queryset(self):
        user = self.request.user
        queryset = Report.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user) | Q(is_published=True)
        ).distinct()

        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        report_type = self.request.query_params.get('type')
        if report_type:
            queryset = queryset.filter(report_type=report_type)

        return queryset


class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Report.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user)
        ).distinct()


class GenerateReportView(APIView):
    """Generates a publication-grade research brief using Groq LLM."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_id = request.data.get('project_id')
        report_type = request.data.get('report_type', 'full')

        if not project_id:
            return Response(
                {'error': 'project_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        project = get_object_or_404(ResearchProject, pk=project_id)

        # Permissions
        if project.owner != request.user and not project.collaborators.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You do not have access to this project.'},
                status=status.HTTP_403_FORBIDDEN
            )

        sources = list(project.sources.all())
        analyses = list(project.analyses.filter(status='completed'))

        try:
            markdown_content = synthesize_intelligence_report(
                project, sources, analyses, report_type=report_type
            )

            report = Report.objects.create(
                project=project,
                generated_by=request.user,
                title=f"Research Intelligence Brief: {project.title[:80]}",
                report_type=report_type,
                format=Report.Format.MARKDOWN,
                content=markdown_content,
                is_published=True
            )

            serializer = ReportSerializer(report)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f"Failed to synthesize report: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
