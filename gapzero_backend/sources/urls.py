from django.urls import path
from .views import SourceListCreateView, SourceDetailView

urlpatterns = [
    path('', SourceListCreateView.as_view(), name='source-list-create'),
    path('<int:pk>/', SourceDetailView.as_view(), name='source-detail'),
]
