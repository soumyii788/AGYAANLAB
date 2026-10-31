from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from research.models import ResearchProject
from .models import Source
from .serializers import SourceSerializer
from .literature_search import search_openalex_papers


class SourceListCreateView(generics.ListCreateAPIView):
    serializer_class = SourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'authors', 'journal', 'doi', 'abstract']
    ordering_fields = ['created_at', 'publication_year', 'relevance_score', 'title']

    def get_queryset(self):
        user = self.request.user
        queryset = Source.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user) | Q(project__is_public=True)
        ).distinct()

        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        source_type = self.request.query_params.get('type')
        if source_type:
            queryset = queryset.filter(source_type=source_type)

        return queryset


class SourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Source.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user)
        ).distinct()


class LiveLiteratureSearchView(APIView):
    """Searches live open academic papers via OpenAlex/arXiv."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('query', '').strip()
        if not query:
            return Response({'results': []})
        results = search_openalex_papers(query, limit=12)
        return Response({'results': results, 'count': len(results)})


class ImportPaperView(APIView):
    """Imports an open academic paper directly into a research project."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_id = request.data.get('project_id')
        paper_data = request.data.get('paper')

        if not project_id or not paper_data:
            return Response(
                {'error': 'Both project_id and paper payload are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        project = get_object_or_404(ResearchProject, pk=project_id)

        # Check permissions
        if project.owner != request.user and not project.collaborators.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You do not have permission to add sources to this project.'},
                status=status.HTTP_403_FORBIDDEN
            )

        source = Source.objects.create(
            project=project,
            added_by=request.user,
            title=paper_data.get('title', 'Untitled Paper'),
            authors=paper_data.get('authors', []),
            source_type='paper',
            url=paper_data.get('url', ''),
            doi=paper_data.get('doi', ''),
            publication_year=paper_data.get('publication_year'),
            journal=paper_data.get('journal', ''),
            abstract=paper_data.get('abstract', ''),
            status='reviewed',
            relevance_score=90.0,
            tags=['imported', 'openalex']
        )

        serializer = SourceSerializer(source)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
