"""
Research app views
"""
from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import ResearchProject, ResearchNote
from .serializers import (
    ResearchProjectSerializer,
    ResearchProjectListSerializer,
    ResearchNoteSerializer,
)


class ResearchProjectListCreateView(generics.ListCreateAPIView):
    """List all projects accessible to user, or create a new project."""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'keywords']
    ordering_fields = ['created_at', 'updated_at', 'title', 'gap_score']
    ordering = ['-updated_at']

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ResearchProjectListSerializer
        return ResearchProjectSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = ResearchProject.objects.filter(
            Q(owner=user) | Q(collaborators=user) | Q(is_public=True)
        ).distinct()

        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by domain if provided
        domain_filter = self.request.query_params.get('domain')
        if domain_filter:
            queryset = queryset.filter(domain=domain_filter)

        return queryset


class ResearchProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific research project."""
    serializer_class = ResearchProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ResearchProject.objects.filter(
            Q(owner=user) | Q(collaborators=user) | Q(is_public=True)
        ).distinct()

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        if project.owner != request.user:
            return Response(
                {'error': 'Only the project owner can delete this project.'},
                status=status.HTTP_403_FORBIDDEN
            )
        project.delete()
        return Response({'message': 'Project deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


class ProjectStatsView(APIView):
    """Returns statistics about the user's projects."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        projects = ResearchProject.objects.filter(
            Q(owner=user) | Q(collaborators=user)
        ).distinct()

        stats = {
            'total_projects': projects.count(),
            'by_status': {},
            'by_domain': {},
        }

        for choice_val, _ in ResearchProject.Status.choices:
            stats['by_status'][choice_val] = projects.filter(status=choice_val).count()

        for choice_val, _ in ResearchProject.Domain.choices:
            stats['by_domain'][choice_val] = projects.filter(domain=choice_val).count()

        return Response(stats)


class ResearchNoteListCreateView(generics.ListCreateAPIView):
    """List and create research notes for a project."""
    serializer_class = ResearchNoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs['project_pk']
        return ResearchNote.objects.filter(project_id=project_id)

    def perform_create(self, serializer):
        project_id = self.kwargs['project_pk']
        project = get_object_or_404(ResearchProject, pk=project_id)
        serializer.save(author=self.request.user, project=project)


class ResearchNoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a research note."""
    serializer_class = ResearchNoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs['project_pk']
        return ResearchNote.objects.filter(project_id=project_id)
