"""
Module 4: Verification Checklist Generator Engine
Converts unresolved empirical gaps, contradictions, and freshness notices
into prioritized, actionable research verification tasks.
"""
import logging
from typing import List, Dict, Any, Optional
from django.db import transaction
from django.utils import timezone

from research.models import ResearchProject
from analysis.models import Finding, ChecklistItem

logger = logging.getLogger(__name__)


class VerificationChecklistGenerator:
    """
    Independent engine for synthesizing findings into an actionable,
    prioritized verification roadmap.
    """

    def __init__(self, project: ResearchProject, user=None):
        self.project = project
        self.user = user

    def generate_checklist(self, refresh: bool = False) -> List[ChecklistItem]:
        """
        Derives actionable checklist tasks from all project findings.
        Preserves user completion status unless refresh is True.
        """
        findings = list(
            Finding.objects.filter(project=self.project)
            .select_related('question')
            .prefetch_related('evidence_links')
        )

        existing_items = {item.task_text: item for item in ChecklistItem.objects.filter(project=self.project)}
        created_items = []

        with transaction.atomic():
            if refresh:
                ChecklistItem.objects.filter(project=self.project, is_completed=False).delete()

            for finding in findings:
                task_text = ""
                rationale = ""
                priority = finding.severity

                if finding.finding_type == Finding.FindingType.GAP:
                    q_text = finding.question.question_text if finding.question else finding.title
                    task_text = f"Empirical Investigation: Conduct experiments to address gap: '{q_text}'"
                    rationale = f"Negative space identified: {finding.explanation}"

                elif finding.finding_type == Finding.FindingType.CONTRADICTION:
                    subject = finding.metadata.get('subject', 'parameter')
                    attr = finding.metadata.get('attribute', 'metric')
                    task_text = f"Replication Protocol: Re-test {subject} ({attr}) under standardized conditions to reconcile conflicting literature"
                    rationale = f"Epistemic tension: {finding.explanation}"

                elif finding.finding_type == Finding.FindingType.FRESHNESS:
                    src_title = finding.metadata.get('source_title', 'historical source')
                    pub_year = finding.metadata.get('publication_year', 'prior years')
                    task_text = f"Literature Recalibration: Search recent papers (post-{pub_year}) to confirm whether protocols in '{src_title[:60]}' are superseded"
                    rationale = f"Freshness policy check: {finding.description}"

                if not task_text:
                    continue

                # Deduplicate with existing
                if task_text in existing_items:
                    created_items.append(existing_items[task_text])
                    continue

                item = ChecklistItem.objects.create(
                    project=self.project,
                    finding=finding,
                    task_text=task_text,
                    rationale=rationale,
                    priority=priority,
                    is_completed=False
                )
                created_items.append(item)

        logger.info(f"Module 4 complete: generated {len(created_items)} checklist items for project #{self.project.id}.")
        return created_items

    def toggle_task(self, item_id: int, completed: Optional[bool] = None, user=None) -> ChecklistItem:
        """Marks a checklist item as completed or incomplete."""
        item = ChecklistItem.objects.get(pk=item_id, project=self.project)
        new_status = not item.is_completed if completed is None else completed

        item.is_completed = new_status
        item.completed_at = timezone.now() if new_status else None
        item.completed_by = user if new_status else None
        item.save()

        return item

    def run(self, refresh: bool = False) -> Dict[str, Any]:
        """Executes Module 4 independently."""
        items = self.generate_checklist(refresh=refresh)
        completed_count = sum(1 for i in items if i.is_completed)

        return {
            'module': 'verification_checklist',
            'project_id': self.project.id,
            'total_tasks': len(items),
            'completed_tasks': completed_count,
            'pending_tasks': len(items) - completed_count,
            'items': [
                {
                    'id': i.id,
                    'task_text': i.task_text,
                    'priority': i.priority,
                    'is_completed': i.is_completed,
                    'finding_id': i.finding_id,
                } for i in items
            ]
        }
