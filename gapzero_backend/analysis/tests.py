import json
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from research.models import ResearchProject
from sources.models import Source
from .models import (
    Claim,
    Evidence,
    ResearchQuestion,
    QuestionCoverage,
    Finding,
    FindingEvidence,
    ChecklistItem,
)
from .claim_extraction_service import (
    ClaimExtractionEngine,
    LLMConfigurationError,
    LLMRateLimitError,
    verify_evidence_in_source,
    chunk_source_content,
)
from .core_engine import (
    InformationGapDetector,
    ContradictionDetector,
    FreshnessAnalyzer,
    VerificationChecklistGenerator,
    UnifiedIntelligenceOrchestrator,
)

User = get_user_model()


class ClaimAndEvidenceExtractionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='scientist_alpha',
            email='scientist@agyaanlab.ai',
            password='Password123!',
            first_name='Marie',
            last_name='Curie'
        )
        self.client.force_authenticate(user=self.user)

        self.project = ResearchProject.objects.create(
            title='Perovskite Solar Stability Research',
            description='Empirical benchmarking of halide perovskite cell degradation under continuous illumination.',
            domain='materials_science',
            owner=self.user
        )

        self.sample_text = (
            "Halide perovskite solar cells have achieved a certified power conversion efficiency of 25.8%. "
            "Under continuous 1-sun illumination at 65°C, encapsulated cells retained 95% of their initial efficiency after 1000 hours. "
            "The incorporation of formamidinium cesium cations substantially suppressed phase segregation."
        )

        self.source = Source.objects.create(
            project=self.project,
            added_by=self.user,
            title='Phase-Stable Halide Perovskites for Durable Photovoltaics',
            source_type=Source.SourceType.PAPER,
            processing_status=Source.ProcessingStatus.COMPLETED,
            extracted_text=self.sample_text,
            original_url='https://doi.org/10.1038/s41560-024-00123-x',
            canonical_url='https://doi.org/10.1038/s41560-024-00123-x',
            publication_year=2024,
            authors=['Chen, L.', 'Smith, J.', 'Rodriguez, M.']
        )

    # =========================================================================
    # 1. EVIDENCE VERIFICATION LOGIC TESTS (HALLUCINATION BARRIER)
    # =========================================================================
    def test_verify_evidence_positive_match(self):
        """Verifies exact verbatim passages in source text pass verification."""
        passage = "Halide perovskite solar cells have achieved a certified power conversion efficiency of 25.8%."
        is_verified, start, end, sim_score = verify_evidence_in_source(passage, self.sample_text)
        self.assertTrue(is_verified)
        self.assertEqual(start, 0)
        self.assertEqual(end, len(passage))
        self.assertGreaterEqual(sim_score, 0.95)

    def test_verify_evidence_rejects_hallucination(self):
        """Verifies fabricated passages not in source text are rejected."""
        fake_passage = "The silicon tandem device demonstrated an unprecedented quantum yield of 42.1% under ambient conditions."
        is_verified, start, end, sim_score = verify_evidence_in_source(fake_passage, self.sample_text)
        self.assertFalse(is_verified)
        self.assertIsNone(start)

    # =========================================================================
    # 2. EXTRACTION ENGINE & UNSUPPORTED CLAIM REJECTION
    # =========================================================================
    @patch('analysis.claim_extraction_service.call_llm_with_retry')
    def test_claim_extraction_saves_verified_and_rejects_unsupported(self, mock_llm_call):
        """
        Verify the engine saves supported claims with evidence and strictly rejects
        unsupported claims whose passage does not exist in the source document.
        """
        mock_response = json.dumps({
            "claims": [
                {
                    "claim_text": "Perovskite solar cells achieved 25.8% power conversion efficiency.",
                    "subject": "Halide perovskite solar cells",
                    "attribute": "certified power conversion efficiency",
                    "value": "25.8%",
                    "claim_type": "empirical",
                    "confidence": 0.96,
                    "supporting_passage": "Halide perovskite solar cells have achieved a certified power conversion efficiency of 25.8%."
                },
                {
                    "claim_text": "Cells retained 95% efficiency after 1000 hours under continuous 1-sun illumination at 65°C.",
                    "subject": "Encapsulated cells",
                    "attribute": "efficiency retention after 1000 hours",
                    "value": "95%",
                    "claim_type": "empirical",
                    "confidence": 0.94,
                    "supporting_passage": "Under continuous 1-sun illumination at 65°C, encapsulated cells retained 95% of their initial efficiency after 1000 hours."
                },
                {
                    "claim_text": "FABRICATED CLAIM: The battery stored 500 Wh/kg in cryogenic testing.",
                    "subject": "Lithium battery",
                    "attribute": "gravimetric energy density",
                    "value": "500 Wh/kg",
                    "claim_type": "empirical",
                    "confidence": 0.99,
                    # This passage is completely absent from the source document!
                    "supporting_passage": "The solid-state lithium battery maintained 500 Wh/kg at liquid nitrogen temperatures."
                }
            ]
        })
        mock_llm_call.return_value = mock_response

        engine = ClaimExtractionEngine(user=self.user)
        result = engine.extract_from_source(self.source)

        # 2 verified claims should be saved, 1 unsupported claim should be rejected
        self.assertEqual(result['claims_extracted'], 2)
        self.assertEqual(result['claims_rejected'], 1)

        saved_claims = Claim.objects.filter(source=self.source)
        self.assertEqual(saved_claims.count(), 2)

        # Verify evidence attached
        for claim in saved_claims:
            self.assertTrue(claim.evidence_items.exists())
            evidence = claim.evidence_items.first()
            self.assertTrue(evidence.is_verified)
            self.assertIn(evidence.passage, self.sample_text)

        # Ensure the fabricated battery claim was rejected
        self.assertFalse(Claim.objects.filter(subject="Lithium battery").exists())

    # =========================================================================
    # 3. CHUNKING & MULTI-PAGE EXTRACTION
    # =========================================================================
    def test_chunking_with_extracted_pages(self):
        """Verify chunking segments multi-page PDFs cleanly while preserving page numbers."""
        multi_page_source = Source.objects.create(
            project=self.project,
            added_by=self.user,
            title='Multi-Page Report',
            source_type=Source.SourceType.PDF,
            processing_status=Source.ProcessingStatus.COMPLETED,
            page_count=2,
            extracted_pages=[
                {'page': 1, 'text': 'Page 1 methodology notes on electrochemical impedance.', 'char_count': 55},
                {'page': 2, 'text': 'Page 2 spectroscopy measurements and photoluminescence yields.', 'char_count': 61}
            ]
        )

        chunks = chunk_source_content(multi_page_source)
        self.assertEqual(len(chunks), 2)
        self.assertEqual(chunks[0]['page_number'], 1)
        self.assertIn('Page 1 methodology', chunks[0]['text'])
        self.assertEqual(chunks[1]['page_number'], 2)
        self.assertIn('Page 2 spectroscopy', chunks[1]['text'])

    # =========================================================================
    # 4. CONFIGURATION & ERROR HANDLING TESTS
    # =========================================================================
    @patch('analysis.claim_extraction_service.config')
    def test_missing_api_key_raises_configuration_error(self, mock_config):
        """Verify missing GROQ_API_KEY raises LLMConfigurationError without fabricating analysis."""
        mock_config.side_effect = lambda key, default='': '' if key == 'GROQ_API_KEY' else default

        url = reverse('analysis-extract-claims')
        response = self.client.post(url, {'source_id': self.source.id}, format='json')

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['code'], 'LLM_CONFIG_MISSING')
        self.assertIn('GROQ_API_KEY is not configured', response.data['detail'])

    # =========================================================================
    # 5. API ENDPOINTS (EXTRACT, LIST, FILTER, EVIDENCE STATS)
    # =========================================================================
    @patch('analysis.claim_extraction_service.call_llm_with_retry')
    def test_api_extract_claims_endpoint(self, mock_llm_call):
        """Verify POST /api/v1/analysis/extract-claims/ triggers extraction and returns serialized claims."""
        mock_response = json.dumps({
            "claims": [
                {
                    "claim_text": "Formamidinium cesium cations suppressed phase segregation.",
                    "subject": "Formamidinium cesium cations",
                    "attribute": "phase stability",
                    "value": "segregation suppressed",
                    "claim_type": "methodological",
                    "confidence": 0.92,
                    "supporting_passage": "The incorporation of formamidinium cesium cations substantially suppressed phase segregation."
                }
            ]
        })
        mock_llm_call.return_value = mock_response

        url = reverse('analysis-extract-claims')
        res = self.client.post(url, {'source_id': self.source.id}, format='json')

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['claims_extracted'], 1)
        self.assertEqual(len(res.data['claims']), 1)
        self.assertEqual(res.data['claims'][0]['subject'], 'Formamidinium cesium cations')
        self.assertEqual(len(res.data['claims'][0]['evidence_items']), 1)
        self.assertEqual(res.data['claims'][0]['source_title'], self.source.title)

    def test_claims_and_evidence_listing_and_filtering(self):
        """Verify claims and evidence listing endpoints with filters."""
        claim1 = Claim.objects.create(
            project=self.project,
            source=self.source,
            created_by=self.user,
            claim_text='Efficiency was 25.8%',
            subject='Perovskite',
            attribute='efficiency',
            value='25.8%',
            claim_type=Claim.ClaimType.EMPIRICAL,
            confidence=0.95
        )
        Evidence.objects.create(
            claim=claim1,
            source=self.source,
            passage='Certified power conversion efficiency of 25.8%.',
            page_number=1,
            is_verified=True
        )

        claim2 = Claim.objects.create(
            project=self.project,
            source=self.source,
            created_by=self.user,
            claim_text='Fabrication protocol used spin-coating',
            subject='Deposition technique',
            attribute='protocol',
            value='spin-coating',
            claim_type=Claim.ClaimType.METHODOLOGICAL,
            confidence=0.88
        )
        Evidence.objects.create(
            claim=claim2,
            source=self.source,
            passage='Thin films were deposited via two-step spin-coating.',
            page_number=2,
            is_verified=True
        )

        # 1. List claims
        claims_url = reverse('analysis-claim-list')
        res = self.client.get(claims_url, {'project': self.project.id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data.get('results', res.data)
        self.assertEqual(len(results), 2)

        # 2. Filter by claim_type=empirical
        res_type = self.client.get(claims_url, {'project': self.project.id, 'claim_type': 'empirical'})
        results_type = res_type.data.get('results', res_type.data)
        self.assertEqual(len(results_type), 1)
        self.assertEqual(results_type[0]['subject'], 'Perovskite')

        # 3. List evidence
        evidence_url = reverse('analysis-evidence-list')
        res_ev = self.client.get(evidence_url, {'project': self.project.id})
        self.assertEqual(res_ev.status_code, status.HTTP_200_OK)
        results_ev = res_ev.data.get('results', res_ev.data)
        self.assertEqual(len(results_ev), 2)

        # 4. Evidence stats
        stats_url = reverse('analysis-evidence-stats')
        res_stats = self.client.get(stats_url, {'project': self.project.id})
        self.assertEqual(res_stats.status_code, status.HTTP_200_OK)
        self.assertEqual(res_stats.data['total_claims'], 2)
        self.assertEqual(res_stats.data['total_evidence'], 2)

    def test_claim_deletion(self):
        """Verify deleting a claim cascades to its evidence items."""
        claim = Claim.objects.create(
            project=self.project,
            source=self.source,
            created_by=self.user,
            claim_text='Temporary claim to delete',
            subject='Temp',
            attribute='lifecycle',
            value='delete',
            claim_type=Claim.ClaimType.EMPIRICAL
        )
        ev = Evidence.objects.create(
            claim=claim,
            source=self.source,
            passage='This is a temporary passage to be deleted.',
            is_verified=True
        )

        del_url = reverse('analysis-claim-detail', kwargs={'pk': claim.id})
        res = self.client.delete(del_url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Claim.objects.filter(id=claim.id).exists())
        self.assertFalse(Evidence.objects.filter(id=ev.id).exists())


class CoreIntelligenceEngineModuleTests(APITestCase):
    """
    Tests each of the four independent intelligence modules:
    Module 1: Information Gap Detection
    Module 2: Contradiction Detection
    Module 3: Freshness Analysis
    Module 4: Verification Checklist
    And the Complete End-to-End Intelligence Pipeline.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username='lead_investigator',
            email='investigator@agyaanlab.ai',
            password='TestPassword123!',
            first_name='Rosalind',
            last_name='Franklin'
        )
        self.client.force_authenticate(user=self.user)

        self.project = ResearchProject.objects.create(
            title='Next-Generation Solid-State Battery Cathodes',
            description='Investigating high-nickel NMC cathodes for solid-state batteries, interface resistance, and cycle life.',
            domain='renewable_energy',
            owner=self.user
        )

        # Source A (Recent, 2024)
        self.source_a = Source.objects.create(
            project=self.project,
            added_by=self.user,
            title='High-Nickel Cathodes with Sulfide Solid Electrolytes',
            source_type=Source.SourceType.PAPER,
            publication_year=2024,
            publication_date='2024-03-15',
            extracted_text='Single-crystal NMC811 cathode showed stable cycling with 91.5% capacity retention over 500 cycles.'
        )

        # Source B (Older, 2017 - Outdated per 4-year policy)
        self.source_b = Source.objects.create(
            project=self.project,
            added_by=self.user,
            title='Preliminary Investigation of Polycrystalline Cathode Degradation',
            source_type=Source.SourceType.PAPER,
            publication_year=2017,
            publication_date='2017-06-20',
            extracted_text='Polycrystalline NMC811 cathode suffered severe degradation, retaining only 48.0% capacity after 500 cycles.'
        )

        # Source C (Undated)
        self.source_c = Source.objects.create(
            project=self.project,
            added_by=self.user,
            title='Undated Laboratory Protocol for Electrolyte Pressing',
            source_type=Source.SourceType.TEXT,
            extracted_text='Cold isostatic pressing at 350 MPa was applied to sulfide pellets.'
        )

        # Claims from Source A
        self.claim_a = Claim.objects.create(
            project=self.project,
            source=self.source_a,
            created_by=self.user,
            claim_text='NMC811 cathode retained 91.5% capacity over 500 cycles.',
            subject='NMC811 cathode',
            attribute='capacity retention after 500 cycles',
            value='91.5%',
            claim_type=Claim.ClaimType.EMPIRICAL,
            confidence=0.95
        )
        self.evidence_a = Evidence.objects.create(
            claim=self.claim_a,
            source=self.source_a,
            passage='Single-crystal NMC811 cathode showed stable cycling with 91.5% capacity retention over 500 cycles.',
            is_verified=True
        )

        # Claims from Source B (Contradictory to Claim A)
        self.claim_b = Claim.objects.create(
            project=self.project,
            source=self.source_b,
            created_by=self.user,
            claim_text='NMC811 cathode suffered degradation, retaining only 48.0% capacity.',
            subject='NMC811 cathode',
            attribute='capacity retention after 500 cycles',
            value='48.0%',
            claim_type=Claim.ClaimType.EMPIRICAL,
            confidence=0.90
        )
        self.evidence_b = Evidence.objects.create(
            claim=self.claim_b,
            source=self.source_b,
            passage='Polycrystalline NMC811 cathode suffered severe degradation, retaining only 48.0% capacity after 500 cycles.',
            is_verified=True
        )

    # =========================================================================
    # MODULE 1: INFORMATION GAP DETECTION TESTS
    # =========================================================================
    @patch('analysis.core_engine.gap_detector.call_llm_with_retry')
    def test_module_1_information_gap_detection(self, mock_llm_call):
        """
        Tests Module 1:
        1. Decomposes objective into subquestions with importance levels.
        2. Maps extracted claims to subquestions.
        3. Identifies unanswered and partially answered questions.
        4. Verifies resolution explanation explicitly states absence of evidence != proof of absence.
        5. Verifies unanswered gap findings are flagged as is_ai_suggestion=True.
        """
        mock_response = json.dumps({
            "questions": [
                {
                    "question_text": "What is the capacity retention of NMC811 cathodes after 500 cycles?",
                    "importance": "critical",
                    "domain_category": "cycle_life"
                },
                {
                    "question_text": "How does interface impedance evolve at -20°C low temperature operation?",
                    "importance": "high",
                    "domain_category": "low_temperature_kinetics"
                }
            ]
        })
        mock_llm_call.return_value = mock_response

        detector = InformationGapDetector(self.project, user=self.user)
        results = detector.run(force_regenerate=True)

        self.assertEqual(results['total_questions'], 2)
        # Question 1 has matching claims (NMC811 capacity retention) -> answered or partially answered
        # Question 2 has zero claims in corpus -> unanswered gap
        self.assertEqual(results['unanswered_questions'], 1)
        self.assertGreaterEqual(results['gap_findings_created'], 1)

        # Verify QuestionCoverage in DB
        unanswered_q = ResearchQuestion.objects.get(domain_category='low_temperature_kinetics')
        self.assertEqual(unanswered_q.coverage.status, QuestionCoverage.CoverageStatus.UNANSWERED)
        self.assertEqual(unanswered_q.coverage.coverage_score, 0.0)

        # Epistemic Rule check: Absence of evidence must never be represented as proof of absence
        self.assertIn("absence of evidence", unanswered_q.coverage.resolution_explanation.lower())
        self.assertIn("not be construed as proof of absence", unanswered_q.coverage.resolution_explanation.lower())

        # Finding check: Unanswered gap finding must have is_ai_suggestion=True
        gap_finding = Finding.objects.filter(project=self.project, finding_type=Finding.FindingType.GAP, question=unanswered_q).first()
        self.assertIsNotNone(gap_finding)
        self.assertTrue(gap_finding.is_ai_suggestion)

    # =========================================================================
    # MODULE 2: CONTRADICTION DETECTION TESTS
    # =========================================================================
    def test_module_2_contradiction_detection(self):
        """
        Tests Module 2:
        1. Compares claims from different sources (Source A vs Source B).
        2. Matches claims by subject ('NMC811 cathode') and attribute ('capacity retention after 500 cycles').
        3. Detects incompatible values ('91.5%' vs '48.0%').
        4. Preserves both original passages and source references.
        5. Does not automatically decide which source is correct.
        """
        detector = ContradictionDetector(self.project, user=self.user)
        results = detector.run()

        self.assertEqual(results['candidate_pairs_checked'], 1)
        self.assertEqual(results['contradictions_found'], 1)

        # Check Finding in database
        contradiction = Finding.objects.filter(
            project=self.project,
            finding_type=Finding.FindingType.CONTRADICTION
        ).first()
        self.assertIsNotNone(contradiction)
        self.assertIn("NMC811 cathode", contradiction.title)

        # Rule check: Never automatically decide which source is correct
        self.assertIn("does not arbitrarily decide which source is correct", contradiction.explanation)

        # Evidence preservation: Both competing claims and passages must be linked
        evidence_links = contradiction.evidence_links.all()
        self.assertEqual(evidence_links.count(), 2)

        roles = {el.role for el in evidence_links}
        self.assertIn('competing_claim_a', roles)
        self.assertIn('competing_claim_b', roles)

        passages = [el.passage for el in evidence_links]
        self.assertTrue(any('91.5%' in p for p in passages))
        self.assertTrue(any('48.0%' in p for p in passages))

    # =========================================================================
    # MODULE 3: FRESHNESS ANALYSIS TESTS
    # =========================================================================
    def test_module_3_freshness_analysis(self):
        """
        Tests Module 3:
        1. Extracts available publication dates (2024, 2017, Undated).
        2. Compares against relevance policy (4 years for renewable energy).
        3. Source A (2024) is fresh (age 2 <= 4).
        4. Source B (2017) is flagged as outdated (age 9 > 4).
        5. Source C is flagged as undated.
        6. Rule check: Does NOT label old information as false.
        """
        policy = {'max_age_years': 4}
        analyzer = FreshnessAnalyzer(self.project, policy=policy, user=self.user)
        results = analyzer.run()

        self.assertEqual(results['sources_evaluated'], 3)
        self.assertEqual(results['fresh_sources'], 1)       # Source A
        self.assertEqual(results['outdated_sources'], 1)    # Source B
        self.assertEqual(results['undated_sources'], 1)     # Source C

        findings = Finding.objects.filter(project=self.project, finding_type=Finding.FindingType.FRESHNESS)
        self.assertEqual(findings.count(), 2)

        # Epistemic Rule check: Do not label old information as false
        outdated_finding = findings.filter(metadata__status='outdated').first()
        self.assertIsNotNone(outdated_finding)
        self.assertIn("NOT considered false", outdated_finding.explanation)

    # =========================================================================
    # MODULE 4: VERIFICATION CHECKLIST TESTS
    # =========================================================================
    def test_module_4_verification_checklist_generation_and_toggle(self):
        """
        Tests Module 4:
        1. Generates actionable verification tasks from unresolved findings.
        2. Assigns priorities matching finding severity.
        3. Allows users to mark tasks completed.
        """
        # Create a sample gap finding and contradiction finding
        gap_finding = Finding.objects.create(
            project=self.project,
            finding_type=Finding.FindingType.GAP,
            severity=Finding.SeverityLevel.CRITICAL,
            title='Information Gap: Solid electrolyte conductivity at sub-zero temperatures',
            description='Unanswered question on sub-zero conductivity',
            explanation='No literature in corpus reports impedance below 0C'
        )

        contradiction_finding = Finding.objects.create(
            project=self.project,
            finding_type=Finding.FindingType.CONTRADICTION,
            severity=Finding.SeverityLevel.HIGH,
            title='Contradiction: NMC811 capacity retention',
            description='Divergent results: 91.5% vs 48.0%',
            explanation='Source A reports 91.5% while Source B reports 48.0%',
            metadata={'subject': 'NMC811', 'attribute': 'retention'}
        )

        generator = VerificationChecklistGenerator(self.project, user=self.user)
        results = generator.run()

        self.assertEqual(results['total_tasks'], 2)
        self.assertEqual(results['completed_tasks'], 0)

        # Check priorities match finding severity
        items = ChecklistItem.objects.filter(project=self.project)
        self.assertTrue(items.filter(priority='critical').exists())
        self.assertTrue(items.filter(priority='high').exists())

        # Toggle task completion via API
        target_item = items.first()
        self.assertFalse(target_item.is_completed)

        toggle_url = reverse('analysis-checklist-toggle', kwargs={'pk': target_item.id})
        res = self.client.patch(toggle_url, {'is_completed': True}, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        target_item.refresh_from_db()
        self.assertTrue(target_item.is_completed)
        self.assertIsNotNone(target_item.completed_at)
        self.assertEqual(target_item.completed_by, self.user)

    # =========================================================================
    # UNIFIED END-TO-END WORKFLOW PIPELINE TEST
    # =========================================================================
    @patch('analysis.core_engine.gap_detector.call_llm_with_retry')
    def test_complete_unified_intelligence_pipeline_workflow(self, mock_llm_call):
        """
        Tests the complete unified intelligence pipeline:
        Executes Modules 1 -> 2 -> 3 -> 4, updates project gap_score,
        creates Analysis record, and tests all API query endpoints.
        """
        mock_response = json.dumps({
            "questions": [
                {
                    "question_text": "What is the baseline capacity retention of NMC811 cathodes?",
                    "importance": "critical",
                    "domain_category": "cycle_stability"
                },
                {
                    "question_text": "What are the mechanical strain thresholds under high charging rates?",
                    "importance": "high",
                    "domain_category": "mechanics"
                }
            ]
        })
        mock_llm_call.return_value = mock_response

        orchestrator = UnifiedIntelligenceOrchestrator(
            self.project,
            user=self.user,
            policy={'max_age_years': 4}
        )
        res = orchestrator.run_full_pipeline(force_regenerate_questions=True)

        self.assertEqual(res['project_id'], self.project.id)
        self.assertIn('analysis_id', res)
        self.assertGreater(res['gap_score'], 0)

        # Verify Project model was updated
        self.project.refresh_from_db()
        self.assertGreater(self.project.gap_score, 0)
        self.assertTrue(bool(self.project.gap_summary))

        # 1. Test Questions API Endpoint
        q_url = reverse('analysis-question-list')
        q_res = self.client.get(q_url, {'project': self.project.id})
        self.assertEqual(q_res.status_code, status.HTTP_200_OK)
        q_results = q_res.data.get('results', q_res.data)
        self.assertEqual(len(q_results), 2)

        # 2. Test Findings API Endpoint with filter
        f_url = reverse('analysis-finding-list')
        f_res = self.client.get(f_url, {'project': self.project.id, 'type': 'contradiction'})
        self.assertEqual(f_res.status_code, status.HTTP_200_OK)
        f_results = f_res.data.get('results', f_res.data)
        self.assertGreaterEqual(len(f_results), 1)

        # 3. Test Checklist API Endpoint
        c_url = reverse('analysis-checklist-list')
        c_res = self.client.get(c_url, {'project': self.project.id})
        self.assertEqual(c_res.status_code, status.HTTP_200_OK)
        c_results = c_res.data.get('results', c_res.data)
        self.assertGreaterEqual(len(c_results), 1)

        # 4. Test Intelligence Engine Status Endpoint
        status_url = reverse('analysis-engine-status')
        s_res = self.client.get(status_url, {'project': self.project.id})
        self.assertEqual(s_res.status_code, status.HTTP_200_OK)
        self.assertIn('gap_score', s_res.data)
        self.assertIn('questions', s_res.data)
        self.assertIn('findings', s_res.data)
        self.assertIn('checklist', s_res.data)

