from rest_framework import generics, permissions, filters
from django.db.models import Q
from .models import Source
from .serializers import SourceSerializer


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

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset


class SourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Source.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user)
        ).distinct()
