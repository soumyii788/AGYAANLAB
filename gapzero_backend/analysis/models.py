"""
Analysis app models - Research gap analysis, Claims, Evidence, Questions, Findings, and Checklist.
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


# =============================================================================
# MODULE 1: INFORMATION GAP DETECTION MODELS
# =============================================================================

class ResearchQuestion(models.Model):
    """
    Structured research subquestion decomposed from the user's primary research objective.
    """
    class ImportanceLevel(models.TextChoices):
        CRITICAL = 'critical', 'Critical'
        HIGH = 'high', 'High'
        MEDIUM = 'medium', 'Medium'
        LOW = 'low', 'Low'

    project = models.ForeignKey(ResearchProject, on_delete=models.CASCADE, related_name='research_questions')
    question_text = models.TextField(help_text="Specific, testable subquestion required to fulfill the research goal.")
    importance = models.CharField(
        max_length=20,
        choices=ImportanceLevel.choices,
        default=ImportanceLevel.HIGH,
        help_text="Priority level of this question relative to the project objective."
    )
    domain_category = models.CharField(max_length=100, blank=True, help_text="Sub-discipline or thematic area.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'analysis_researchquestion'
        ordering = ['importance', '-created_at']

    def __str__(self):
        return f"[{self.importance.upper()}] {self.question_text[:80]}..."


class QuestionCoverage(models.Model):
    """
    Tracks empirical coverage status for a ResearchQuestion based on ingested Claims.
    Distinguishes absence of evidence from proof of absence.
    """
    class CoverageStatus(models.TextChoices):
        UNANSWERED = 'unanswered', 'Unanswered Gap'
        PARTIALLY_ANSWERED = 'partially_answered', 'Partially Answered'
        ANSWERED = 'answered', 'Answered'

    question = models.OneToOneField(ResearchQuestion, on_delete=models.CASCADE, related_name='coverage')
    status = models.CharField(
        max_length=30,
        choices=CoverageStatus.choices,
        default=CoverageStatus.UNANSWERED,
        help_text="Current resolution state of this research subquestion."
    )
    coverage_score = models.FloatField(
        default=0.0,
        help_text="Quantitative coverage score (0.0 = total void, 1.0 = fully substantiated)."
    )
    resolution_explanation = models.TextField(
        blank=True,
        help_text="Reasoning explaining why this question is considered unresolved or partially covered."
    )
    mapped_claims = models.ManyToManyField(
        Claim,
        blank=True,
        related_name='covered_questions',
        help_text="Claims directly relevant to answering this subquestion."
    )
    last_evaluated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'analysis_questioncoverage'

    def __str__(self):
        return f"Coverage for '{self.question.question_text[:50]}': {self.status} ({self.coverage_score:.0%})"


# =============================================================================
# MODULE 2 & 3: FINDINGS & EVIDENCE (CONTRADICTIONS, GAPS, FRESHNESS)
# =============================================================================

class Finding(models.Model):
    """
    Epistemic findings across the four intelligence modules:
    - Gaps (Module 1)
    - Contradictions & Tensions (Module 2)
    - Freshness Warnings (Module 3)
    - Consensus Findings (Synthesis)
    """
    class FindingType(models.TextChoices):
        GAP = 'gap', 'Information Gap'
        CONTRADICTION = 'contradiction', 'Contradiction / Tension'
        FRESHNESS = 'freshness', 'Freshness Warning'
        CONSENSUS = 'consensus', 'Consensus Finding'

    class SeverityLevel(models.TextChoices):
        CRITICAL = 'critical', 'Critical'
        HIGH = 'high', 'High'
        MEDIUM = 'medium', 'Medium'
        LOW = 'low', 'Low'

    project = models.ForeignKey(ResearchProject, on_delete=models.CASCADE, related_name='findings')
    finding_type = models.CharField(max_length=40, choices=FindingType.choices)
    severity = models.CharField(max_length=20, choices=SeverityLevel.choices, default=SeverityLevel.MEDIUM)
    title = models.CharField(max_length=300)
    description = models.TextField(help_text="Structured overview of the finding.")
    explanation = models.TextField(blank=True, help_text="Detailed epistemic explanation.")
    is_ai_suggestion = models.BooleanField(
        default=False,
        help_text="Explicitly flags AI-generated hypotheses vs findings backed by hard source evidence."
    )
    question = models.ForeignKey(
        ResearchQuestion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='findings',
        help_text="Linked research subquestion if applicable."
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Structured details (e.g. conflicting claim IDs, publication years, age in years)."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analysis_finding'
        ordering = ['severity', '-created_at']

    def __str__(self):
        return f"[{self.finding_type.upper()} | {self.severity.upper()}] {self.title}"


class FindingEvidence(models.Model):
    """
    Multi-source traceability link binding a Finding to concrete Evidence passages.
    Preserves competing claims neutrally without prematurely deciding which is correct.
    """
    finding = models.ForeignKey(Finding, on_delete=models.CASCADE, related_name='evidence_links')
    evidence = models.ForeignKey(Evidence, on_delete=models.SET_NULL, null=True, blank=True, related_name='finding_links')
    claim = models.ForeignKey(Claim, on_delete=models.SET_NULL, null=True, blank=True, related_name='finding_links')
    source = models.ForeignKey(Source, on_delete=models.CASCADE, null=True, blank=True, related_name='finding_links')

    passage = models.TextField(blank=True, help_text="Verbatim quote from the underlying source.")
    role = models.CharField(
        max_length=50,
        default='supporting',
        help_text="Role in finding: 'supporting', 'competing_claim_a', 'competing_claim_b', 'outdated_source'."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analysis_findingevidence'
        ordering = ['created_at']

    def __str__(self):
        return f"Evidence ({self.role}) for Finding #{self.finding_id}: {self.passage[:60]}..."


# =============================================================================
# MODULE 4: VERIFICATION CHECKLIST
# =============================================================================

class ChecklistItem(models.Model):
    """
    Actionable verification tasks generated from unresolved findings, gaps, and tensions.
    Can be marked complete by researchers as investigation progresses.
    """
    class PriorityLevel(models.TextChoices):
        CRITICAL = 'critical', 'Critical'
        HIGH = 'high', 'High'
        MEDIUM = 'medium', 'Medium'
        LOW = 'low', 'Low'

    project = models.ForeignKey(ResearchProject, on_delete=models.CASCADE, related_name='checklist_items')
    finding = models.ForeignKey(
        Finding,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='checklist_items',
        help_text="Finding that originated this verification task."
    )
    task_text = models.TextField(help_text="Clear, actionable task description.")
    rationale = models.TextField(blank=True, help_text="Why this check is vital to eliminate the negative space.")
    priority = models.CharField(
        max_length=20,
        choices=PriorityLevel.choices,
        default=PriorityLevel.MEDIUM
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analysis_checklistitem'
        ordering = ['is_completed', 'priority', '-created_at']

    def __str__(self):
        done = "[x]" if self.is_completed else "[ ]"
        return f"{done} [{self.priority.upper()}] {self.task_text[:70]}..."
