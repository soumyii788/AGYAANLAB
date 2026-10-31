"""
Sources app models - Complete Research Source Ingestion System
Supports URL ingestion, PDF extraction (PyMuPDF), and pasted text with content hashing.
"""
from django.db import models
from django.conf import settings
from research.models import ResearchProject


class Source(models.Model):
    """Represents an ingested research source with extraction pipeline metadata."""

    class SourceType(models.TextChoices):
        URL = 'url', 'Web Page (URL)'
        PDF = 'pdf', 'PDF Document'
        TEXT = 'text', 'Pasted Text'
        PAPER = 'paper', 'Academic Paper'
        DATASET = 'dataset', 'Dataset'
        OTHER = 'other', 'Other'

    class ProcessingStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        OCR_NEEDED = 'ocr_needed', 'OCR Needed'

    # Project & User association
    project = models.ForeignKey(
        ResearchProject,
        on_delete=models.CASCADE,
        related_name='sources',
        null=True,
        blank=True
    )
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='added_sources'
    )

    # Core identification
    title = models.CharField(max_length=500)
    source_type = models.CharField(
        max_length=20,
        choices=SourceType.choices,
        default=SourceType.TEXT
    )
    processing_status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
        db_index=True
    )

    # Web & Origin Metadata
    original_url = models.URLField(max_length=2000, blank=True)
    canonical_url = models.URLField(max_length=2000, blank=True)
    publication_date = models.CharField(max_length=100, blank=True)
    modified_date = models.CharField(max_length=100, blank=True)
    authors = models.JSONField(default=list, blank=True)

    # File Ingestion
    pdf_file = models.FileField(upload_to='sources/pdfs/', null=True, blank=True)
    file_size = models.IntegerField(null=True, blank=True, help_text="File size in bytes")
    page_count = models.IntegerField(null=True, blank=True)

    # Extracted Content & Preservation
    extracted_text = models.TextField(blank=True, help_text="Full extracted text content")
    extracted_pages = models.JSONField(
        default=list,
        blank=True,
        help_text="Preserved per-page text: [{'page': 1, 'text': '...'}]"
    )

    # Duplicate Prevention & Integrity
    content_hash = models.CharField(
        max_length=64,
        blank=True,
        db_index=True,
        help_text="SHA-256 hash of extracted content to prevent duplicate sources"
    )
    error_message = models.TextField(
        blank=True,
        help_text="Detailed extraction or validation error message"
    )

    # Metadata & Extensibility
    metadata = models.JSONField(default=dict, blank=True)

    # Legacy fields (preserved for existing sources & OpenAlex papers)
    url = models.URLField(max_length=2000, blank=True)
    doi = models.CharField(max_length=200, blank=True)
    publication_year = models.IntegerField(null=True, blank=True)
    journal = models.CharField(max_length=300, blank=True)
    abstract = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='reviewed')
    relevance_score = models.FloatField(null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sources_source'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.source_type.upper()}] {self.title} ({self.processing_status})"

    def save(self, *args, **kwargs):
        # Sync url and original_url if one is set
        if self.original_url and not self.url:
            self.url = self.original_url
        elif self.url and not self.original_url:
            self.original_url = self.url
        super().save(*args, **kwargs)
