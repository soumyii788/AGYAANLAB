"""
Analysis app models - Research gap analysis
"""
from django.db import models
from django.conf import settings
from research.models import ResearchProject


class Analysis(models.Model):
    """Represents a research gap analysis run on a project."""

    class AnalysisType(models.TextChoices):
        GAP_DETECTION = 'gap_detection', 'Gap Detection'
        TREND_ANALYSIS = 'trend_analysis', 'Trend Analysis'
        CITATION_MAP = 'citation_map', 'Citation Map'
        KEYWORD_CLUSTER = 'keyword_cluster', 'Keyword Clustering'
        COMPARATIVE = 'comparative', 'Comparative Analysis'

    class Status(models.TextChoices):
        QUEUED = 'queued', 'Queued'
        RUNNING = 'running', 'Running'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    project = models.ForeignKey(ResearchProject, on_delete=models.CASCADE, related_name='analyses')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    analysis_type = models.CharField(max_length=30, choices=AnalysisType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED)
    title = models.CharField(max_length=300)
    parameters = models.JSONField(default=dict, blank=True)
    results = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analysis_analysis'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.analysis_type}) — {self.status}"
