"""
Research app URL patterns
"""
from django.urls import path
from .views import (
    ResearchProjectListCreateView,
    ResearchProjectDetailView,
    ProjectStatsView,
    ResearchNoteListCreateView,
    ResearchNoteDetailView,
)

urlpatterns = [
    path('projects/', ResearchProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/stats/', ProjectStatsView.as_view(), name='project-stats'),
    path('projects/<int:pk>/', ResearchProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:project_pk>/notes/', ResearchNoteListCreateView.as_view(), name='note-list-create'),
    path('projects/<int:project_pk>/notes/<int:pk>/', ResearchNoteDetailView.as_view(), name='note-detail'),
]
