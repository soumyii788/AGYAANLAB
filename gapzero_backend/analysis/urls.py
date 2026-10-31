from django.urls import path
from .views import (
    AnalysisListCreateView,
    AnalysisDetailView,
    RunGapAnalysisView,
    ExtractClaimsView,
    ClaimListView,
    ClaimDetailView,
    EvidenceListView,
    EvidenceExplorerStatsView,
)

urlpatterns = [
    path('', AnalysisListCreateView.as_view(), name='analysis-list-create'),
    path('run-gap-analysis/', RunGapAnalysisView.as_view(), name='analysis-run-gap'),
    path('extract-claims/', ExtractClaimsView.as_view(), name='analysis-extract-claims'),
    path('claims/', ClaimListView.as_view(), name='analysis-claim-list'),
    path('claims/<int:pk>/', ClaimDetailView.as_view(), name='analysis-claim-detail'),
    path('evidence/', EvidenceListView.as_view(), name='analysis-evidence-list'),
    path('evidence-stats/', EvidenceExplorerStatsView.as_view(), name='analysis-evidence-stats'),
    path('<int:pk>/', AnalysisDetailView.as_view(), name='analysis-detail'),
]
