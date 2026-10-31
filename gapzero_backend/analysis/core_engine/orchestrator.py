"""
Unified Intelligence Engine Orchestrator
Coordinates the execution of the four core analysis modules:
1. Information Gap Detection
2. Contradiction Detection
3. Freshness Analysis
4. Verification Checklist
"""
import logging
from typing import Dict, Any, Optional
from django.utils import timezone

from research.models import ResearchProject
from analysis.models import Analysis, Finding, ResearchQuestion, ChecklistItem
from .gap_detector import InformationGapDetector
from .contradiction_detector import ContradictionDetector
from .freshness_analyzer import FreshnessAnalyzer
from .verification_checklist import VerificationChecklistGenerator

logger = logging.getLogger(__name__)


class UnifiedIntelligenceOrchestrator:
    """
    Coordinates and executes the full four-module intelligence pipeline
    for a research project.
    """

    def __init__(self, project: ResearchProject, user=None, policy: Optional[Dict[str, Any]] = None):
        self.project = project
        self.user = user
        self.policy = policy or {}

    def run_full_pipeline(self, force_regenerate_questions: bool = False) -> Dict[str, Any]:
        """
        Executes Modules 1 through 4 in sequence and records an Analysis event.
        """
        started_at = timezone.now()
        logger.info(f"Starting unified intelligence pipeline for project #{self.project.id} ('{self.project.title}')...")

        # 1. Module 1: Information Gap Detection
        gap_engine = InformationGapDetector(self.project, user=self.user)
        gap_results = gap_engine.run(force_regenerate=force_regenerate_questions)

        # 2. Module 2: Contradiction Detection
        contradiction_engine = ContradictionDetector(self.project, user=self.user)
        contradiction_results = contradiction_engine.run()

        # 3. Module 3: Freshness Analysis
        freshness_engine = FreshnessAnalyzer(self.project, policy=self.policy, user=self.user)
        freshness_results = freshness_engine.run()

        # 4. Module 4: Verification Checklist Generation
        checklist_engine = VerificationChecklistGenerator(self.project, user=self.user)
        checklist_results = checklist_engine.run()

        # Calculate overall empirical gap score
        # Gap score = percentage of subquestions that are unanswered or partially answered
        total_q = gap_results.get('total_questions', 1) or 1
        unanswered_q = gap_results.get('unanswered_questions', 0)
        partial_q = gap_results.get('partially_answered_questions', 0)
        gap_score = round(((unanswered_q * 1.0 + partial_q * 0.5) / total_q) * 100, 1)

        # Update Project
        self.project.gap_score = gap_score
        summary_parts = [
            f"{unanswered_q} of {total_q} research subquestions remain completely unresolved.",
            f"{contradiction_results.get('contradictions_found', 0)} cross-source tensions detected.",
            f"{freshness_results.get('outdated_sources', 0)} sources exceed domain freshness thresholds."
        ]
        self.project.gap_summary = " ".join(summary_parts)
        self.project.save()

        # Record Analysis object in database
        analysis_record = Analysis.objects.create(
            project=self.project,
            created_by=self.user,
            analysis_type=Analysis.AnalysisType.GAP_DETECTION,
            status=Analysis.Status.COMPLETED,
            title=f"Core Intelligence Engine Scan — {self.project.title[:60]}",
            parameters={
                'policy': self.policy,
                'force_regenerate_questions': force_regenerate_questions,
            },
            results={
                'gap_score': gap_score,
                'module_1_gaps': gap_results,
                'module_2_contradictions': contradiction_results,
                'module_3_freshness': freshness_results,
                'module_4_checklist': checklist_results,
            },
            started_at=started_at,
            completed_at=timezone.now(),
        )

        logger.info(f"Unified intelligence pipeline complete for project #{self.project.id}. Gap score: {gap_score}%")

        return {
            'project_id': self.project.id,
            'analysis_id': analysis_record.id,
            'gap_score': gap_score,
            'gap_summary': self.project.gap_summary,
            'module_1_gaps': gap_results,
            'module_2_contradictions': contradiction_results,
            'module_3_freshness': freshness_results,
            'module_4_checklist': checklist_results,
        }
