import json
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from research.models import ResearchProject
from sources.models import Source
from .models import Claim, Evidence
from .claim_extraction_service import (
    ClaimExtractionEngine,
    LLMConfigurationError,
    LLMRateLimitError,
    verify_evidence_in_source,
    chunk_source_content,
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
