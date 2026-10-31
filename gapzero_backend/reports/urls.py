from django.urls import path
from .views import (
    ReportListCreateView,
    ReportDetailView,
    GenerateReportView,
)

urlpatterns = [
    path('', ReportListCreateView.as_view(), name='report-list-create'),
    path('generate/', GenerateReportView.as_view(), name='report-generate'),
    path('<int:pk>/', ReportDetailView.as_view(), name='report-detail'),
]
