"""
Research app models - Core ResearchProject and related entities
"""
from django.db import models
from django.conf import settings


class ResearchProject(models.Model):
    """Core model representing a research intelligence project."""

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        ACTIVE = 'active', 'Active'
        PAUSED = 'paused', 'Paused'
        COMPLETED = 'completed', 'Completed'
        ARCHIVED = 'archived', 'Archived'

    class Domain(models.TextChoices):
        # General domains
        TECHNOLOGY = 'technology', 'Technology'
        HEALTHCARE = 'healthcare', 'Healthcare'
        FINANCE = 'finance', 'Finance'
        ENVIRONMENT = 'environment', 'Environment'
        SOCIAL = 'social', 'Social Sciences'
        SCIENCE = 'science', 'Natural Sciences'
        OTHER = 'other', 'Other'
        # Science-specific domains (aligned with freshness analyser policies)
        AI_ML = 'ai_ml', 'AI / Machine Learning'
        BIOTECHNOLOGY = 'biotechnology', 'Biotechnology'
        MEDICINE_HEALTH = 'medicine_health', 'Medicine & Health'
        QUANTUM_COMPUTING = 'quantum_computing', 'Quantum Computing'
        MATERIALS_SCIENCE = 'materials_science', 'Materials Science'
        RENEWABLE_ENERGY = 'renewable_energy', 'Renewable Energy'
        PHYSICS = 'physics', 'Physics'
        POLICY = 'policy', 'Public Policy'
        ECONOMICS = 'economics', 'Economics'
        COMPUTER_SCIENCE = 'computer_science', 'Computer Science'

    # Core fields
    title = models.CharField(max_length=500)
    description = models.TextField()
    domain = models.CharField(max_length=50, choices=Domain.choices, default=Domain.OTHER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    keywords = models.JSONField(default=list, blank=True)

    # Ownership & collaboration
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_projects'
    )
    collaborators = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='collaborated_projects',
        blank=True
    )

    # Research gap tracking
    gap_summary = models.TextField(blank=True)
    gap_score = models.FloatField(null=True, blank=True, help_text='AI-computed research gap score 0-100')

    # Metadata
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'research_project'
        ordering = ['-updated_at']
        verbose_name = 'Research Project'
        verbose_name_plural = 'Research Projects'

    def __str__(self):
        return f"{self.title} [{self.status}]"

    @property
    def sources_count(self):
        return self.sources.count()

    @property
    def analyses_count(self):
        return self.analyses.count()


class ResearchNote(models.Model):
    """Notes and observations attached to a research project."""

    project = models.ForeignKey(
        ResearchProject,
        on_delete=models.CASCADE,
        related_name='notes'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='research_notes'
    )
    title = models.CharField(max_length=300)
    content = models.TextField()
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'research_note'
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"{self.title} — {self.project.title}"
