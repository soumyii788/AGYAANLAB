from django.urls import path
from .views import (
    SourceListCreateView,
    SourceDetailView,
    LiveLiteratureSearchView,
    ImportPaperView,
)

urlpatterns = [
    path('', SourceListCreateView.as_view(), name='source-list-create'),
    path('search-online/', LiveLiteratureSearchView.as_view(), name='source-live-search'),
    path('import-paper/', ImportPaperView.as_view(), name='source-import-paper'),
    path('<int:pk>/', SourceDetailView.as_view(), name='source-detail'),
]
