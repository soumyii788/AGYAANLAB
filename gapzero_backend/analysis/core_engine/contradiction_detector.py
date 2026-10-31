"""
Module 2: Contradiction Detection Engine
Detects incompatible claims between different sources for the same subject and attribute.
Preserves both original passages and source references.
Epistemic rule: NEVER automatically decide which source is correct.
"""
import re
import logging
from typing import List, Dict, Any, Tuple, Optional
from django.db import transaction

from research.models import ResearchProject
from analysis.models import Claim, Finding, FindingEvidence
from analysis.claim_extraction_service import call_llm_with_retry, clean_and_parse_json

logger = logging.getLogger(__name__)

OPPOSING_TERMS = [
    ('stable', 'degraded'),
    ('stable', 'unstable'),
    ('suppressed', 'accelerated'),
    ('suppressed', 'promoted'),
    ('increased', 'decreased'),
    ('higher', 'lower'),
    ('positive', 'negative'),
    ('high', 'low'),
    ('negligible', 'significant'),
    ('biocompatible', 'cytotoxic'),
    ('non-toxic', 'toxic'),
    ('effective', 'ineffective'),
    ('resistant', 'susceptible'),
]


def token_overlap_score(str1: str, str2: str) -> float:
    """Computes word token Jaccard similarity between two strings."""
    if not str1 or not str2:
        return 0.0
    set1 = set(re.findall(r'\w+', str1.lower()))
    set2 = set(re.findall(r'\w+', str2.lower()))
    if not set1 or not set2:
        return 0.0
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union if union > 0 else 0.0


def extract_numbers(val: str) -> List[float]:
    """Extracts floating point numbers from a value string."""
    matches = re.findall(r'[-+]?\d*\.?\d+', val)
    nums = []
    for m in matches:
        try:
            nums.append(float(m))
        except ValueError:
            pass
    return nums


def heuristic_value_incompatibility(val_a: str, val_b: str) -> Tuple[bool, str]:
    """
    Checks if two values for the same attribute are clearly incompatible
    (e.g. widely divergent numerical values or antonym polarities).
    """
    v_a = val_a.lower().strip()
    v_b = val_b.lower().strip()

    if v_a == v_b:
        return False, ""

    # 1. Antonym keyword check
    for term1, term2 in OPPOSING_TERMS:
        if (term1 in v_a and term2 in v_b) or (term2 in v_a and term1 in v_b):
            return True, f"Directly opposing directional descriptors: '{term1}' vs '{term2}'"

    # 2. Significant numerical divergence check
    nums_a = extract_numbers(v_a)
    nums_b = extract_numbers(v_b)

    if nums_a and nums_b:
        num_a = nums_a[0]
        num_b = nums_b[0]
        # If relative difference > 25%
        denom = max(abs(num_a), abs(num_b), 1.0)
        rel_diff = abs(num_a - num_b) / denom
        if rel_diff >= 0.25:
            return True, f"Numerical divergence between values: {num_a} vs {num_b} (relative difference {rel_diff:.0%})"

    return False, ""


class ContradictionDetector:
    """
    Independent engine for detecting scientific and empirical contradictions
    across multiple distinct sources.
    """

    def __init__(self, project: ResearchProject, user=None):
        self.project = project
        self.user = user

    def find_candidate_pairs(self) -> List[Tuple[Claim, Claim]]:
        """
        Finds pairs of claims from DIFFERENT sources that share matched subject and attribute.
        Avoids flagging unrelated claims.
        """
        claims = list(
            Claim.objects.filter(project=self.project)
            .select_related('source')
            .prefetch_related('evidence_items')
        )

        candidate_pairs = []
        n = len(claims)

        for i in range(n):
            for j in range(i + 1, n):
                claim_a = claims[i]
                claim_b = claims[j]

                # Rule: Must originate from DIFFERENT sources
                if claim_a.source_id == claim_b.source_id:
                    continue

                # Subject match: token overlap >= 0.35 or substring containment
                s_a = claim_a.subject.lower()
                s_b = claim_b.subject.lower()
                subject_matched = (s_a in s_b) or (s_b in s_a) or (token_overlap_score(s_a, s_b) >= 0.35)

                if not subject_matched:
                    continue

                # Attribute match: token overlap >= 0.30 or substring containment
                a_a = claim_a.attribute.lower()
                a_b = claim_b.attribute.lower()
                attribute_matched = (a_a in a_b) or (a_b in a_a) or (token_overlap_score(a_a, a_b) >= 0.30)

                if attribute_matched:
                    candidate_pairs.append((claim_a, claim_b))

        return candidate_pairs

    def evaluate_contradiction(self, claim_a: Claim, claim_b: Claim) -> Optional[Dict[str, Any]]:
        """
        Evaluates whether candidate claims assert incompatible propositions.
        Uses heuristics first, with LLM adjudication fallback for nuanced text.
        """
        incompatible, reason = heuristic_value_incompatibility(claim_a.value, claim_b.value)

        if incompatible:
            return {
                'is_contradiction': True,
                'severity': 'high',
                'reason': reason,
                'explanation': (
                    f"Source '{claim_a.source.title}' reports {claim_a.attribute} as '{claim_a.value}', "
                    f"whereas Source '{claim_b.source.title}' reports it as '{claim_b.value}'. "
                    f"Both original passages are preserved below. AGYAAN LAB does not arbitrarily decide "
                    f"which source is correct."
                )
            }

        # If values differ and passages exist, check with LLM for scientific incompatibility
        ev_a = claim_a.evidence_items.first()
        ev_b = claim_b.evidence_items.first()
        passage_a = ev_a.passage if ev_a else claim_a.claim_text
        passage_b = ev_b.passage if ev_b else claim_b.claim_text

        system_prompt = (
            "You are the AGYAAN LAB Contradiction & Tension Detection Engine. "
            "Analyze two claims from different scientific papers concerning the same subject and attribute. "
            "Determine whether they express incompatible, contradictory, or divergent empirical results.\n"
            "STRICT RULES:\n"
            "1. NEVER decide which source is correct.\n"
            "2. Only flag genuine incompatibility; do not flag claims that simply study different parameters.\n"
            "Output must be a valid JSON object matching the schema below."
        )

        schema_prompt = (
            'Schema:\n'
            '{\n'
            '  "is_contradiction": true | false,\n'
            '  "severity": "critical" | "high" | "medium" | "low",\n'
            '  "reason": "<short 1-sentence description of the divergence>",\n'
            '  "explanation": "<detailed objective analysis presenting both sides without picking a winner>"\n'
            '}'
        )

        user_prompt = (
            f"SUBJECT: {claim_a.subject}\n"
            f"ATTRIBUTE: {claim_a.attribute}\n\n"
            f"SOURCE A: '{claim_a.source.title}'\n"
            f"Claim A: {claim_a.claim_text} (Value: {claim_a.value})\n"
            f"Passage A: \"{passage_a}\"\n\n"
            f"SOURCE B: '{claim_b.source.title}'\n"
            f"Claim B: {claim_b.claim_text} (Value: {claim_b.value})\n"
            f"Passage B: \"{passage_b}\"\n\n"
            f"{schema_prompt}\n\n"
            f"Determine if these claims represent a real contradiction or divergence."
        )

        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            raw = call_llm_with_retry(messages, max_tokens=1500, temperature=0.0)
            res = clean_and_parse_json(raw)
            if res.get('is_contradiction'):
                return res
        except Exception as e:
            logger.warning(f"LLM contradiction check skipped for pair ({claim_a.id}, {claim_b.id}): {e}")

        return None

    def run(self) -> Dict[str, Any]:
        """
        Executes Module 2 independently:
        Finds pairs -> evaluates incompatibility -> persists Finding & FindingEvidence.
        """
        # Clear existing contradiction findings for this project to refresh
        Finding.objects.filter(project=self.project, finding_type=Finding.FindingType.CONTRADICTION).delete()

        candidate_pairs = self.find_candidate_pairs()
        contradiction_findings = []

        with transaction.atomic():
            for claim_a, claim_b in candidate_pairs:
                eval_result = self.evaluate_contradiction(claim_a, claim_b)
                if not eval_result:
                    continue

                title = f"Contradiction: {claim_a.subject} ({claim_a.attribute})"
                description = (
                    f"Divergent findings detected between Source #{claim_a.source_id} ('{claim_a.source.title[:45]}...') "
                    f"and Source #{claim_b.source_id} ('{claim_b.source.title[:45]}...')."
                )

                finding = Finding.objects.create(
                    project=self.project,
                    finding_type=Finding.FindingType.CONTRADICTION,
                    severity=eval_result.get('severity', 'high'),
                    title=title,
                    description=description,
                    explanation=eval_result.get('explanation', ''),
                    is_ai_suggestion=False,
                    metadata={
                        'subject': claim_a.subject,
                        'attribute': claim_a.attribute,
                        'claim_a_id': claim_a.id,
                        'claim_b_id': claim_b.id,
                        'source_a_id': claim_a.source_id,
                        'source_b_id': claim_b.source_id,
                        'reason': eval_result.get('reason', ''),
                    }
                )

                # Link Evidence for Claim A
                ev_a = claim_a.evidence_items.first()
                FindingEvidence.objects.create(
                    finding=finding,
                    evidence=ev_a,
                    claim=claim_a,
                    source=claim_a.source,
                    passage=ev_a.passage if ev_a else claim_a.claim_text,
                    role='competing_claim_a'
                )

                # Link Evidence for Claim B
                ev_b = claim_b.evidence_items.first()
                FindingEvidence.objects.create(
                    finding=finding,
                    evidence=ev_b,
                    claim=claim_b,
                    source=claim_b.source,
                    passage=ev_b.passage if ev_b else claim_b.claim_text,
                    role='competing_claim_b'
                )

                contradiction_findings.append(finding)

        logger.info(f"Module 2 complete: identified {len(contradiction_findings)} contradictions across {len(candidate_pairs)} candidate pairs.")

        return {
            'module': 'contradiction_detection',
            'project_id': self.project.id,
            'candidate_pairs_checked': len(candidate_pairs),
            'contradictions_found': len(contradiction_findings),
            'findings': [
                {
                    'id': f.id,
                    'title': f.title,
                    'severity': f.severity,
                    'explanation': f.explanation,
                } for f in contradiction_findings
            ]
        }
