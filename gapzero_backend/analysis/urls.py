from django.urls import path
from .views import (
    AnalysisListCreateView,
    AnalysisDetailView,
    RunGapAnalysisView,
)

urlpatterns = [
    path('', AnalysisListCreateView.as_view(), name='analysis-list-create'),
    path('run-gap-analysis/', RunGapAnalysisView.as_view(), name='analysis-run-gap'),
    path('<int:pk>/', AnalysisDetailView.as_view(), name='analysis-detail'),
]
