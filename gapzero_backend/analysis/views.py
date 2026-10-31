from rest_framework import generics, permissions, filters
from django.db.models import Q
from .models import Analysis
from .serializers import AnalysisSerializer


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
