from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, generics
from django.db.models import Q
from research.models import ResearchProject
from sources.models import Source
from analysis.models import Analysis, Claim, Finding, ChecklistItem
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

        total_projects = projects.count()
        total_sources = Source.objects.filter(Q(project__in=projects) | Q(added_by=user)).count()
        total_claims = Claim.objects.filter(Q(project__in=projects) | Q(created_by=user)).count()

        findings_qs = Finding.objects.filter(project__in=projects)
        information_gaps = findings_qs.filter(finding_type='gap').count()
        contradictions = findings_qs.filter(finding_type='contradiction').count()
        freshness_warnings = findings_qs.filter(finding_type='freshness').count()

        checklist_qs = ChecklistItem.objects.filter(project__in=projects)
        total_tasks = checklist_qs.count()
        completed_tasks = checklist_qs.filter(is_completed=True).count()

        recent_projects = []
        for p in projects.order_by('-updated_at')[:6]:
            recent_projects.append({
                'id': p.id,
                'title': p.title,
                'domain': p.domain,
                'status': p.status,
                'gap_score': p.gap_score,
                'gap_summary': p.gap_summary,
                'sources_count': p.sources.count(),
                'claims_count': p.claims.count(),
                'created_at': p.created_at,
                'updated_at': p.updated_at,
            })

        return Response({
            'total_projects': total_projects,
            'total_sources': total_sources,
            'total_claims': total_claims,
            'information_gaps': information_gaps,
            'contradictions': contradictions,
            'freshness_warnings': freshness_warnings,
            'checklist': {
                'total': total_tasks,
                'completed': completed_tasks,
                'pending': total_tasks - completed_tasks,
            },
            'recent_projects': recent_projects,
            # Backward compatibility
            'projects': {
                'total': total_projects,
                'active': projects.filter(status='active').count(),
                'draft': projects.filter(status='draft').count(),
                'completed': projects.filter(status='completed').count(),
            },
            'sources': total_sources,
            'analyses': Analysis.objects.filter(project__in=projects).count(),
            'reports': Report.objects.filter(project__in=projects).count(),
        })


class HealthCheckView(APIView):
    """Simple health check endpoint."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'status': 'ok',
            'service': 'AGYAAN LAB API',
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
