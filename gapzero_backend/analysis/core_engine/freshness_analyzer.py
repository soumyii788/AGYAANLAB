"""
Module 3: Freshness Analysis Engine
Evaluates source publication and modification dates against a configurable relevance policy.
Flags potentially outdated or undated information.
Epistemic rule: NEVER label old information as false.
"""
import re
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from django.db import transaction

from research.models import ResearchProject
from sources.models import Source
from analysis.models import Finding, FindingEvidence

logger = logging.getLogger(__name__)

CURRENT_YEAR = datetime.now().year  # 2026

# Configurable domain freshness thresholds (max age in years before freshness notice)
DEFAULT_DOMAIN_POLICIES = {
    'ai_ml': 3,
    'biotechnology': 3,
    'medicine_health': 4,
    'quantum_computing': 3,
    'materials_science': 5,
    'renewable_energy': 4,
    'physics': 7,
    'general': 5,
}


def extract_year_from_text_or_date(source: Source) -> Optional[int]:
    """
    Extracts the earliest or declared publication year from metadata or body text.
    """
    # 1. Direct publication_year field
    if source.publication_year and 1900 <= source.publication_year <= CURRENT_YEAR + 1:
        return source.publication_year

    # 2. publication_date field (e.g. "2024-05-12" or "2019")
    if source.publication_date:
        match = re.search(r'\b(19\d\d|20\d\d)\b', str(source.publication_date))
        if match:
            y = int(match.group(1))
            if 1900 <= y <= CURRENT_YEAR + 1:
                return y

    # 3. modified_date field
    if source.modified_date:
        match = re.search(r'\b(19\d\d|20\d\d)\b', str(source.modified_date))
        if match:
            y = int(match.group(1))
            if 1900 <= y <= CURRENT_YEAR + 1:
                return y

    # 4. Body text explicit reporting years (e.g. "conducted in 2018", "dataset from 2017")
    content = source.extracted_text or source.abstract or ""
    explicit_matches = re.findall(
        r'(?:conducted in|published in|dataset from|experiments in|recorded in|trial of|survey in)\s*(\b(?:19|20)\d\d\b)',
        content,
        re.IGNORECASE
    )
    if explicit_matches:
        try:
            return int(explicit_matches[0])
        except ValueError:
            pass

    return None


class FreshnessAnalyzer:
    """
    Independent engine for analyzing the chronological currency of ingested sources
    against configurable domain relevance policies.
    """

    def __init__(self, project: ResearchProject, policy: Optional[Dict[str, Any]] = None, user=None):
        self.project = project
        self.user = user

        # Determine threshold
        domain_key = (project.domain or 'general').lower()
        default_max_age = DEFAULT_DOMAIN_POLICIES.get(domain_key, DEFAULT_DOMAIN_POLICIES['general'])

        if policy and 'max_age_years' in policy:
            self.max_age_years = int(policy['max_age_years'])
        else:
            self.max_age_years = default_max_age

    def analyze_source(self, source: Source) -> Optional[Dict[str, Any]]:
        """
        Assesses a single source's age against the freshness policy.
        """
        pub_year = extract_year_from_text_or_date(source)

        if pub_year is None:
            # Undated source
            return {
                'status': 'undated',
                'severity': 'medium',
                'title': f"Undated Source: '{source.title[:80]}'",
                'description': f"Source #{source.id} has no verified publication, modification, or reporting date.",
                'explanation': (
                    "Epistemic Note: Undated information cannot be accurately calibrated along the temporal "
                    "frontier of research. AGYAAN LAB does not label undated information as false, but highlights "
                    "that its chronological relevance is indeterminate until dated citations are verified."
                ),
                'year': None,
                'age_years': None,
                'threshold_years': self.max_age_years,
            }

        age = CURRENT_YEAR - pub_year

        if age > self.max_age_years:
            severity = 'critical' if age >= (self.max_age_years * 2) else ('high' if age >= (self.max_age_years + 2) else 'medium')
            return {
                'status': 'outdated',
                'severity': severity,
                'title': f"Freshness Notice: {source.title[:70]} ({pub_year})",
                'description': (
                    f"Source was published in {pub_year} ({age} years ago). "
                    f"The research domain freshness policy for '{self.project.domain}' flags items older than {self.max_age_years} years."
                ),
                'explanation': (
                    f"Epistemic Non-Falsification Policy: Older scientific literature is NOT considered false. "
                    f"Historical findings often establish foundational principles or baseline benchmarks; "
                    f"however, rapid advancements in {self.project.domain} may have superseded specific experimental "
                    f"yields, sensitivity thresholds, or reagent standards."
                ),
                'year': pub_year,
                'age_years': age,
                'threshold_years': self.max_age_years,
            }

        # Source is within freshness window
        return None

    def run(self) -> Dict[str, Any]:
        """
        Executes Module 3 independently:
        Evaluates all project sources -> records Freshness Findings & Evidence.
        """
        # Clear existing freshness findings for this project
        Finding.objects.filter(project=self.project, finding_type=Finding.FindingType.FRESHNESS).delete()

        sources = list(self.project.sources.all())
        freshness_findings = []
        fresh_count = 0
        outdated_count = 0
        undated_count = 0

        with transaction.atomic():
            for source in sources:
                res = self.analyze_source(source)
                if res is None:
                    fresh_count += 1
                    continue

                if res['status'] == 'outdated':
                    outdated_count += 1
                elif res['status'] == 'undated':
                    undated_count += 1

                finding = Finding.objects.create(
                    project=self.project,
                    finding_type=Finding.FindingType.FRESHNESS,
                    severity=res['severity'],
                    title=res['title'],
                    description=res['description'],
                    explanation=res['explanation'],
                    is_ai_suggestion=False,
                    metadata={
                        'source_id': source.id,
                        'source_title': source.title,
                        'status': res['status'],
                        'publication_year': res['year'],
                        'age_years': res['age_years'],
                        'threshold_years': res['threshold_years'],
                    }
                )

                # Link FindingEvidence
                FindingEvidence.objects.create(
                    finding=finding,
                    source=source,
                    passage=f"Publication Year: {res['year'] or 'Unknown'} • Source: {source.title}",
                    role='source_reference'
                )

                freshness_findings.append(finding)

        logger.info(
            f"Module 3 complete for project #{self.project.id}: "
            f"{fresh_count} fresh, {outdated_count} outdated, {undated_count} undated sources."
        )

        return {
            'module': 'freshness_analysis',
            'project_id': self.project.id,
            'max_age_policy_years': self.max_age_years,
            'sources_evaluated': len(sources),
            'fresh_sources': fresh_count,
            'outdated_sources': outdated_count,
            'undated_sources': undated_count,
            'findings_created': len(freshness_findings),
            'findings': [
                {
                    'id': f.id,
                    'title': f.title,
                    'severity': f.severity,
                    'status': f.metadata.get('status'),
                    'explanation': f.explanation,
                } for f in freshness_findings
            ]
        }
