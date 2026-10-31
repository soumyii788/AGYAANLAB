from django.urls import path
from .views import DashboardStatsView, HealthCheckView, TagListCreateView, ActivityLogListView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('tags/', TagListCreateView.as_view(), name='tag-list-create'),
    path('activity/', ActivityLogListView.as_view(), name='activity-list'),
]
