"""
Sources app models - Research source tracking
"""
from django.db import models
from django.conf import settings
from research.models import ResearchProject


class Source(models.Model):
    """Represents a research source (paper, article, dataset, etc.)."""

    class SourceType(models.TextChoices):
        PAPER = 'paper', 'Academic Paper'
        ARTICLE = 'article', 'Article'
        DATASET = 'dataset', 'Dataset'
        BOOK = 'book', 'Book'
        WEBSITE = 'website', 'Website'
        REPORT = 'report', 'Report'
        OTHER = 'other', 'Other'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Review'
        REVIEWED = 'reviewed', 'Reviewed'
        CITED = 'cited', 'Cited'
        REJECTED = 'rejected', 'Rejected'

    project = models.ForeignKey(ResearchProject, on_delete=models.CASCADE, related_name='sources')
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='added_sources')

    title = models.CharField(max_length=500)
    authors = models.JSONField(default=list, blank=True)
    source_type = models.CharField(max_length=20, choices=SourceType.choices, default=SourceType.PAPER)
    url = models.URLField(blank=True)
    doi = models.CharField(max_length=200, blank=True)
    publication_year = models.IntegerField(null=True, blank=True)
    journal = models.CharField(max_length=300, blank=True)
    abstract = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    relevance_score = models.FloatField(null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sources_source'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.publication_year})"
