from rest_framework import generics, permissions, filters
from django.db.models import Q
from .models import Report
from .serializers import ReportSerializer


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
