"""
Analysis app models - Research gap analysis, Claims, and Evidence
"""
from django.db import models
from django.conf import settings
from research.models import ResearchProject
from sources.models import Source


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


class Claim(models.Model):
    """
    Represents an atomic scientific, empirical, or methodological claim
    extracted directly from an ingested source document.
    """

    class ClaimType(models.TextChoices):
        EMPIRICAL = 'empirical', 'Empirical Finding'
        METHODOLOGICAL = 'methodological', 'Methodological'
        THEORETICAL = 'theoretical', 'Theoretical'
        STATISTICAL = 'statistical', 'Statistical'
        COMPARATIVE = 'comparative', 'Comparative'
        DEFINITIONAL = 'definitional', 'Definitional'

    project = models.ForeignKey(ResearchProject, on_delete=models.CASCADE, related_name='claims')
    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name='claims')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    claim_text = models.TextField(help_text="The atomic proposition or factual assertion.")
    subject = models.CharField(max_length=255, help_text="Entity or phenomenon being described.")
    attribute = models.CharField(max_length=255, help_text="Property, variable, or feature measured/described.")
    value = models.CharField(max_length=255, help_text="Measured value, outcome, or state of the attribute.")
    claim_type = models.CharField(
        max_length=50,
        choices=ClaimType.choices,
        default=ClaimType.EMPIRICAL,
        help_text="Epistemic category of the claim."
    )
    confidence = models.FloatField(
        default=0.9,
        help_text="Model extraction confidence score (0.0 to 1.0). Denotes extraction precision, not ground truth."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'analysis_claim'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.claim_type.upper()}] {self.subject} -> {self.attribute}: {self.value}"


class Evidence(models.Model):
    """
    Represents verifiable, verbatim source text proving an extracted Claim.
    Unsupported claims without matching source evidence are rejected.
    """

    claim = models.ForeignKey(Claim, on_delete=models.CASCADE, related_name='evidence_items')
    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name='evidence_items')

    passage = models.TextField(help_text="Exact, verbatim passage extracted from the source text.")
    page_number = models.IntegerField(null=True, blank=True, help_text="1-based page number where passage is found.")
    char_start = models.IntegerField(null=True, blank=True, help_text="Start character offset in source text/page.")
    char_end = models.IntegerField(null=True, blank=True, help_text="End character offset in source text/page.")
    similarity_score = models.FloatField(
        default=1.0,
        help_text="Verification match score ensuring passage exists in the actual source text."
    )
    is_verified = models.BooleanField(
        default=True,
        help_text="True if verbatim passage was positively matched against source text."
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analysis_evidence'
        ordering = ['-created_at']

    def __str__(self):
        page_info = f" (p. {self.page_number})" if self.page_number else ""
        return f"Evidence for Claim #{self.claim_id}{page_info}: {self.passage[:80]}..."
