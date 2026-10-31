from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, generics
from django.db.models import Q
from research.models import ResearchProject
from sources.models import Source
from analysis.models import Analysis
from reports.models import Report
from .models import Tag, ActivityLog
from .serializers import TagSerializer, ActivityLogSerializer


class DashboardStatsView(APIView):
    """Returns aggregated stats for the dashboard."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        projects = ResearchProject.objects.filter(
            Q(owner=user) | Q(collaborators=user)
        ).distinct()

        return Response({
            'projects': {
                'total': projects.count(),
                'active': projects.filter(status='active').count(),
                'draft': projects.filter(status='draft').count(),
                'completed': projects.filter(status='completed').count(),
            },
            'sources': Source.objects.filter(project__in=projects).count(),
            'analyses': Analysis.objects.filter(project__in=projects).count(),
            'reports': Report.objects.filter(project__in=projects).count(),
        })


class HealthCheckView(APIView):
    """Simple health check endpoint."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'status': 'ok',
            'service': 'GAPZERO API',
            'version': '1.0.0'
        })


class TagListCreateView(generics.ListCreateAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]


class ActivityLogListView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ActivityLog.objects.filter(user=self.request.user)[:50]
