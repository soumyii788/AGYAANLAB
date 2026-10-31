from django.urls import path
from .views import (
    SourceListCreateView,
    SourceDetailView,
    IngestURLView,
    IngestPDFView,
    IngestTextView,
    ReprocessSourceView,
    LiveLiteratureSearchView,
    ImportPaperView,
)

urlpatterns = [
    path('', SourceListCreateView.as_view(), name='source-list-create'),
    path('ingest-url/', IngestURLView.as_view(), name='source-ingest-url'),
    path('ingest-pdf/', IngestPDFView.as_view(), name='source-ingest-pdf'),
    path('ingest-text/', IngestTextView.as_view(), name='source-ingest-text'),
    path('search-online/', LiveLiteratureSearchView.as_view(), name='source-live-search'),
    path('import-paper/', ImportPaperView.as_view(), name='source-import-paper'),
    path('<int:pk>/', SourceDetailView.as_view(), name='source-detail'),
    path('<int:pk>/reprocess/', ReprocessSourceView.as_view(), name='source-reprocess'),
]
