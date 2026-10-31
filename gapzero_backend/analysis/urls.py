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
    RunIntelligenceEngineView,
    RunModule1GapDetectionView,
    RunModule2ContradictionView,
    RunModule3FreshnessView,
    RunModule4ChecklistView,
    ResearchQuestionListView,
    FindingListView,
    FindingDetailView,
    ChecklistItemListView,
    ChecklistItemToggleView,
    AnalysisStatusView,
)

urlpatterns = [
    path('', AnalysisListCreateView.as_view(), name='analysis-list-create'),
    path('run-gap-analysis/', RunGapAnalysisView.as_view(), name='analysis-run-gap'),
    path('extract-claims/', ExtractClaimsView.as_view(), name='analysis-extract-claims'),
    path('claims/', ClaimListView.as_view(), name='analysis-claim-list'),
    path('claims/<int:pk>/', ClaimDetailView.as_view(), name='analysis-claim-detail'),
    path('evidence/', EvidenceListView.as_view(), name='analysis-evidence-list'),
    path('evidence-stats/', EvidenceExplorerStatsView.as_view(), name='analysis-evidence-stats'),

    # Core Intelligence Engine Execution
    path('run-intelligence-engine/', RunIntelligenceEngineView.as_view(), name='analysis-run-intelligence-engine'),
    path('modules/gap-detection/', RunModule1GapDetectionView.as_view(), name='analysis-module-gap-detection'),
    path('modules/contradiction-detection/', RunModule2ContradictionView.as_view(), name='analysis-module-contradiction-detection'),
    path('modules/freshness-analysis/', RunModule3FreshnessView.as_view(), name='analysis-module-freshness-analysis'),
    path('modules/verification-checklist/', RunModule4ChecklistView.as_view(), name='analysis-module-verification-checklist'),

    # Questions, Findings, Checklist & Status Queries
    path('questions/', ResearchQuestionListView.as_view(), name='analysis-question-list'),
    path('findings/', FindingListView.as_view(), name='analysis-finding-list'),
    path('findings/<int:pk>/', FindingDetailView.as_view(), name='analysis-finding-detail'),
    path('checklist/', ChecklistItemListView.as_view(), name='analysis-checklist-list'),
    path('checklist/<int:pk>/toggle/', ChecklistItemToggleView.as_view(), name='analysis-checklist-toggle'),
    path('status/', AnalysisStatusView.as_view(), name='analysis-engine-status'),

    path('<int:pk>/', AnalysisDetailView.as_view(), name='analysis-detail'),
]
