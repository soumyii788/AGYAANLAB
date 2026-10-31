"""
Module 1: Information Gap Detection Engine
Analyzes research objectives, derives subquestions, maps extracted claims,
evaluates question coverage, and highlights empirical gaps (negative space).

Epistemic rule: Absence of evidence in the project's source corpus
is NEVER represented as proof of absence in wider science.
"""
import logging
from typing import List, Dict, Any, Optional
from django.db import transaction

from research.models import ResearchProject
from analysis.models import Claim, ResearchQuestion, QuestionCoverage, Finding, FindingEvidence
from analysis.claim_extraction_service import call_llm_with_retry, clean_and_parse_json

logger = logging.getLogger(__name__)


class InformationGapDetector:
    """
    Independent engine for decomposing research objectives into testable subquestions,
    mapping empirical claims, and discovering information voids.
    """

    def __init__(self, project: ResearchProject, user=None):
        self.project = project
        self.user = user

    def generate_subquestions(self, force_regenerate: bool = False) -> List[ResearchQuestion]:
        """
        Decomposes the project's overarching objective into 4-6 testable subquestions
        with assigned importance levels.
        """
        existing = list(ResearchQuestion.objects.filter(project=self.project))
        if existing and not force_regenerate:
            return existing

        system_prompt = (
            "You are the AGYAAN LAB Research Epistemology Engine. "
            "Your task is to analyze a scientific research project objective and decompose it "
            "into 4 to 6 critical, testable research subquestions that must be empirically answered "
            "to fulfill the project goal.\n"
            "Assign importance: 'critical', 'high', 'medium', or 'low'.\n"
            "Output must be a valid JSON object matching the schema below."
        )

        schema_prompt = (
            'Schema:\n'
            '{\n'
            '  "questions": [\n'
            '    {\n'
            '      "question_text": "<clear, focused scientific subquestion>",\n'
            '      "importance": "critical" | "high" | "medium" | "low",\n'
            '      "domain_category": "<thematic area, e.g. synthesis, durability, kinetics, toxicology>"\n'
            '    }\n'
            '  ]\n'
            '}'
        )

        user_prompt = (
            f"PROJECT TITLE: {self.project.title}\n"
            f"DOMAIN: {self.project.domain}\n"
            f"DESCRIPTION / OBJECTIVE: {self.project.description}\n"
            f"KEYWORDS: {', '.join(self.project.keywords) if self.project.keywords else 'None'}\n\n"
            f"{schema_prompt}\n\n"
            f"Decompose the objective into rigorous subquestions now."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        raw_response = call_llm_with_retry(messages, max_tokens=2000, temperature=0.1)
        parsed = clean_and_parse_json(raw_response)
        raw_questions = parsed.get('questions', [])

        valid_importance = ['critical', 'high', 'medium', 'low']
        saved_questions = []

        with transaction.atomic():
            if force_regenerate:
                ResearchQuestion.objects.filter(project=self.project).delete()

            for q_data in raw_questions:
                q_text = (q_data.get('question_text') or '').strip()
                if not q_text or len(q_text) < 10:
                    continue

                imp = (q_data.get('importance') or 'high').lower()
                if imp not in valid_importance:
                    imp = 'high'

                cat = (q_data.get('domain_category') or self.project.domain)[:100]

                rq = ResearchQuestion.objects.create(
                    project=self.project,
                    question_text=q_text,
                    importance=imp,
                    domain_category=cat
                )
                saved_questions.append(rq)

        # Fallback if LLM generated no valid items
        if not saved_questions and not existing:
            default_q = ResearchQuestion.objects.create(
                project=self.project,
                question_text=f"What are the primary baseline performance metrics and degradation mechanisms for {self.project.title}?",
                importance=ResearchQuestion.ImportanceLevel.CRITICAL,
                domain_category=self.project.domain
            )
            saved_questions.append(default_q)

        return saved_questions or existing

    def map_claims_and_evaluate_coverage(self, questions: List[ResearchQuestion]) -> List[Dict[str, Any]]:
        """
        Maps all project claims to subquestions, computes coverage status,
        and generates resolution explanations.
        """
        project_claims = list(Claim.objects.filter(project=self.project).select_related('source'))

        coverage_results = []

        for question in questions:
            # Step 1: Filter relevant claims based on keyword/subject overlap
            q_tokens = set(question.question_text.lower().split())
            relevant_claims = []

            for claim in project_claims:
                c_text = f"{claim.subject} {claim.attribute} {claim.value} {claim.claim_text}".lower()
                c_tokens = set(c_text.split())
                overlap = len(q_tokens.intersection(c_tokens))
                if overlap >= 2 or (claim.subject.lower() in question.question_text.lower()):
                    relevant_claims.append(claim)

            # Step 2: Determine Coverage Status & Score
            claims_count = len(relevant_claims)

            if claims_count == 0:
                status = QuestionCoverage.CoverageStatus.UNANSWERED
                score = 0.0
                explanation = (
                    f"No empirical claims in the ingested corpus directly address this question. "
                    f"Note: This reflects an absence of evidence within current project sources, "
                    f"which must not be construed as proof of absence in the wider scientific field."
                )
            elif claims_count == 1:
                status = QuestionCoverage.CoverageStatus.PARTIALLY_ANSWERED
                score = 0.45
                c = relevant_claims[0]
                explanation = (
                    f"Partially substantiated by 1 claim ({c.subject}: {c.value}). "
                    f"However, comprehensive resolution requires replication across independent datasets and operational bounds."
                )
            elif claims_count >= 2:
                # Check diversity of sources
                source_ids = {c.source_id for c in relevant_claims}
                if len(source_ids) >= 2:
                    status = QuestionCoverage.CoverageStatus.ANSWERED
                    score = min(0.95, 0.70 + (0.05 * len(relevant_claims)))
                    explanation = (
                        f"Substantiated by {claims_count} claims across {len(source_ids)} distinct sources, "
                        f"covering relevant attributes."
                    )
                else:
                    status = QuestionCoverage.CoverageStatus.PARTIALLY_ANSWERED
                    score = 0.60
                    explanation = (
                        f"Multiple claims ({claims_count}) exist, but they originate from a single source. "
                        f"Cross-study independent replication is missing."
                    )

            # Save or update QuestionCoverage in database
            with transaction.atomic():
                coverage, _ = QuestionCoverage.objects.get_or_create(question=question)
                coverage.status = status
                coverage.coverage_score = score
                coverage.resolution_explanation = explanation
                coverage.save()
                coverage.mapped_claims.set(relevant_claims)

            coverage_results.append({
                'question_id': question.id,
                'question_text': question.question_text,
                'importance': question.importance,
                'status': status,
                'coverage_score': score,
                'explanation': explanation,
                'mapped_claims_count': claims_count,
            })

        return coverage_results

    def generate_gap_findings(self, coverage_results: List[Dict[str, Any]]) -> List[Finding]:
        """
        Creates formal Finding records for all unanswered or partially answered questions.
        """
        gap_findings = []

        # Remove previous gap findings for this project to maintain freshness
        Finding.objects.filter(project=self.project, finding_type=Finding.FindingType.GAP).delete()

        for item in coverage_results:
            if item['status'] in (QuestionCoverage.CoverageStatus.UNANSWERED, QuestionCoverage.CoverageStatus.PARTIALLY_ANSWERED):
                q = ResearchQuestion.objects.get(pk=item['question_id'])
                is_unanswered = (item['status'] == QuestionCoverage.CoverageStatus.UNANSWERED)

                severity = q.importance
                title = f"Information Gap: {q.question_text[:120]}"
                description = (
                    f"{'Unanswered Research Question' if is_unanswered else 'Partially Addressed Question'}: "
                    f"{q.question_text}"
                )

                finding = Finding.objects.create(
                    project=self.project,
                    finding_type=Finding.FindingType.GAP,
                    severity=severity,
                    title=title,
                    description=description,
                    explanation=item['explanation'],
                    is_ai_suggestion=True if is_unanswered else False,
                    question=q,
                    metadata={
                        'coverage_score': item['coverage_score'],
                        'status': item['status'],
                        'mapped_claims_count': item['mapped_claims_count'],
                    }
                )

                # Link evidence from mapped claims if partially answered
                mapped_claims = q.coverage.mapped_claims.all()
                for c in mapped_claims:
                    ev = c.evidence_items.first()
                    FindingEvidence.objects.create(
                        finding=finding,
                        evidence=ev,
                        claim=c,
                        source=c.source,
                        passage=ev.passage if ev else c.claim_text,
                        role='partial_evidence'
                    )

                gap_findings.append(finding)

        return gap_findings

    def run(self, force_regenerate: bool = False) -> Dict[str, Any]:
        """
        Executes Module 1 independently:
        Generates questions -> evaluates coverage -> creates gap findings.
        """
        questions = self.generate_subquestions(force_regenerate=force_regenerate)
        coverage_results = self.map_claims_and_evaluate_coverage(questions)
        gap_findings = self.generate_gap_findings(coverage_results)

        unanswered_count = sum(1 for c in coverage_results if c['status'] == QuestionCoverage.CoverageStatus.UNANSWERED)
        partial_count = sum(1 for c in coverage_results if c['status'] == QuestionCoverage.CoverageStatus.PARTIALLY_ANSWERED)
        answered_count = sum(1 for c in coverage_results if c['status'] == QuestionCoverage.CoverageStatus.ANSWERED)

        return {
            'module': 'information_gap_detection',
            'project_id': self.project.id,
            'total_questions': len(questions),
            'unanswered_questions': unanswered_count,
            'partially_answered_questions': partial_count,
            'answered_questions': answered_count,
            'gap_findings_created': len(gap_findings),
            'questions': coverage_results,
        }
