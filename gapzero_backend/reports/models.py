"""
Reports app models
"""
from django.db import models
from django.conf import settings
from research.models import ResearchProject


class Report(models.Model):
    """Generated research intelligence report."""

    class ReportType(models.TextChoices):
        SUMMARY = 'summary', 'Executive Summary'
        FULL = 'full', 'Full Report'
        GAP_ANALYSIS = 'gap_analysis', 'Gap Analysis Report'
        TREND = 'trend', 'Trend Report'

    class Format(models.TextChoices):
        PDF = 'pdf', 'PDF'
        MARKDOWN = 'markdown', 'Markdown'
        JSON = 'json', 'JSON'

    project = models.ForeignKey(ResearchProject, on_delete=models.CASCADE, related_name='reports')
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=400)
    report_type = models.CharField(max_length=20, choices=ReportType.choices, default=ReportType.SUMMARY)
    format = models.CharField(max_length=10, choices=Format.choices, default=Format.MARKDOWN)
    content = models.TextField(blank=True)
    file = models.FileField(upload_to='reports/', null=True, blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'reports_report'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.report_type})"
