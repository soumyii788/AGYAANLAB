import io
import fitz  # PyMuPDF
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from research.models import ResearchProject
from .models import Source
from .url_ingestion import validate_and_resolve_url, SSRFProtectionError

User = get_user_model()


class SourceIngestionAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='researcher_test',
            email='researcher@agyaanlab.ai',
            password='TestPassword123!',
            first_name='Research',
            last_name='Tester'
        )
        self.client.force_authenticate(user=self.user)

        self.project = ResearchProject.objects.create(
            title='Autonomous Ingestion Study',
            description='Testing comprehensive source ingestion workflows.',
            domain='ai_ml',
            owner=self.user
        )

    # =========================================================================
    # 1. TEXT INGESTION TESTS
    # =========================================================================
    def test_text_ingestion_success(self):
        """Verify pasting research text creates a completed source with content_hash."""
        url = reverse('source-ingest-text')
        data = {
            'project_id': self.project.id,
            'title': 'Quantum Decoherence Findings',
            'content': 'Decoherence causes the loss of quantum coherence over time due to environmental interactions.'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Quantum Decoherence Findings')
        self.assertEqual(response.data['processing_status'], 'completed')
        self.assertEqual(response.data['source_type'], 'text')
        self.assertTrue(bool(response.data['content_hash']))
        self.assertIn('Decoherence causes', response.data['extracted_text'])

    def test_text_ingestion_duplicate_prevention(self):
        """Verify identical pasted text returns HTTP 409 Conflict."""
        url = reverse('source-ingest-text')
        data = {
            'project_id': self.project.id,
            'title': 'Original Notes',
            'content': 'Identical research observations recorded here.'
        }
        res1 = self.client.post(url, data, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Attempt to insert identical content
        res2 = self.client.post(url, data, format='json')
        self.assertEqual(res2.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('Duplicate source detected', res2.data['error'])

    # =========================================================================
    # 2. SSRF & URL VALIDATION TESTS
    # =========================================================================
    def test_ssrf_rejection_localhost_and_private_ips(self):
        """Verify SSRF protection rejects localhost, 127.0.0.1, AWS metadata, and private IP blocks."""
        dangerous_targets = [
            'http://127.0.0.1:8000/admin',
            'http://localhost:3000/secret',
            'http://169.254.169.254/latest/meta-data/',
            'http://192.168.1.100/router-config',
            'http://10.0.0.1/internal-api',
            'file:///etc/passwd',
            'ftp://ftp.server.internal/data',
        ]

        for target in dangerous_targets:
            with self.subTest(target=target):
                with self.assertRaises((SSRFProtectionError, Exception)):
                    validate_and_resolve_url(target)

    def test_url_ingestion_endpoint_ssrf_rejection(self):
        """Verify the URL ingestion API rejects SSRF targets and returns 422 with a visible error record."""
        url = reverse('source-ingest-url')
        data = {
            'project_id': self.project.id,
            'url': 'http://127.0.0.1:9999/internal'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn('error', response.data)
        # Verify failed source record is persisted to keep extraction error visible
        failed_sources = Source.objects.filter(
            project=self.project,
            processing_status=Source.ProcessingStatus.FAILED
        )
        self.assertTrue(failed_sources.exists())
        self.assertIn('SSRF prevention', failed_sources.first().error_message)

    @patch('sources.url_ingestion.check_robots_txt')
    @patch('sources.url_ingestion.socket.getaddrinfo')
    @patch('sources.url_ingestion.requests.get')
    def test_url_ingestion_success(self, mock_requests_get, mock_getaddrinfo, mock_robots):
        """Verify valid public URL fetches title, canonical URL, dates, readable text, and prevents duplicates."""
        # Mock DNS resolution to a public IP
        mock_getaddrinfo.return_value = [
            (None, None, None, None, ('93.184.216.34', 80))
        ]

        mock_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>CRISPR-Cas9 Gene Editing Innovations</title>
            <link rel="canonical" href="https://example.com/crispr-research" />
            <meta name="date" content="2025-06-15" />
            <meta property="article:modified_time" content="2025-06-16T10:00:00Z" />
        </head>
        <body>
            <nav><a href="/">Home</a></nav>
            <article>
                <h1>CRISPR-Cas9 Innovations</h1>
                <p>Recent advances in CRISPR technology enable high-fidelity genetic modifications with minimal off-target cleavage.</p>
                <p>This study demonstrates a 99.4% precision rate across mammalian somatic cells.</p>
            </article>
            <footer>Copyright 2025</footer>
        </body>
        </html>
        """

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {'Content-Type': 'text/html; charset=utf-8'}
        mock_response.url = 'https://example.com/crispr-research'
        mock_response.encoding = 'utf-8'
        mock_response.iter_content = MagicMock(return_value=[mock_html.encode('utf-8')])
        mock_response.raise_for_status = MagicMock()

        mock_requests_get.return_value = mock_response

        url = reverse('source-ingest-url')
        payload = {
            'project_id': self.project.id,
            'url': 'https://example.com/crispr-research'
        }

        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'CRISPR-Cas9 Gene Editing Innovations')
        self.assertEqual(response.data['canonical_url'], 'https://example.com/crispr-research')
        self.assertEqual(response.data['original_url'], 'https://example.com/crispr-research')
        self.assertEqual(response.data['processing_status'], 'completed')
        self.assertEqual(response.data['publication_date'], '2025-06-15')
        self.assertIn('Recent advances in CRISPR technology', response.data['extracted_text'])
        self.assertTrue(bool(response.data['content_hash']))

        # Duplicate check on same URL/content
        dup_response = self.client.post(url, payload, format='json')
        self.assertEqual(dup_response.status_code, status.HTTP_409_CONFLICT)

    # =========================================================================
    # 3. PDF INGESTION TESTS (PyMuPDF)
    # =========================================================================
    def _create_sample_pdf(self, pages_text):
        """Helper to create an in-memory PDF using PyMuPDF (fitz)."""
        doc = fitz.open()
        for text in pages_text:
            page = doc.new_page(width=595, height=842)
            if text:
                page.insert_text((50, 72), text, fontsize=12)
        pdf_bytes = doc.write()
        doc.close()
        return pdf_bytes

    def test_pdf_ingestion_text_extraction_with_page_preservation(self):
        """Verify PDF text extraction correctly preserves page numbers and text per page."""
        page1_content = "Page 1: Introduction to Deep Learning Architectures and Neural Attention."
        page2_content = "Page 2: Empirical Results and Hyperparameter Sensitivity Analysis across benchmarks."

        pdf_bytes = self._create_sample_pdf([page1_content, page2_content])
        uploaded_pdf = SimpleUploadedFile(
            "neural_attention.pdf",
            pdf_bytes,
            content_type="application/pdf"
        )

        url = reverse('source-ingest-pdf')
        data = {
            'project_id': self.project.id,
            'title': 'Neural Attention Paper',
            'pdf_file': uploaded_pdf
        }

        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Neural Attention Paper')
        self.assertEqual(response.data['processing_status'], 'completed')
        self.assertEqual(response.data['page_count'], 2)
        self.assertIsNotNone(response.data['content_hash'])

        # Verify page preservation
        extracted_pages = response.data['extracted_pages']
        self.assertEqual(len(extracted_pages), 2)
        self.assertEqual(extracted_pages[0]['page'], 1)
        self.assertIn("Page 1: Introduction", extracted_pages[0]['text'])
        self.assertEqual(extracted_pages[1]['page'], 2)
        self.assertIn("Page 2: Empirical Results", extracted_pages[1]['text'])

    def test_pdf_ingestion_scanned_pdf_ocr_needed(self):
        """Verify scanned/image PDF without digital text is marked as ocr_needed gracefully."""
        # Empty text on 2 pages (simulating scanned raster image PDF)
        pdf_bytes = self._create_sample_pdf(["", ""])
        uploaded_pdf = SimpleUploadedFile(
            "scanned_document.pdf",
            pdf_bytes,
            content_type="application/pdf"
        )

        url = reverse('source-ingest-pdf')
        data = {
            'project_id': self.project.id,
            'title': 'Scanned Archive Document',
            'pdf_file': uploaded_pdf
        }

        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['processing_status'], 'ocr_needed')
        self.assertIn('Scanned PDF detected', response.data['error_message'])
        self.assertIn('Optical Character Recognition', response.data['error_message'])

    def test_pdf_duplicate_prevention(self):
        """Verify identical PDF file upload returns HTTP 409 Conflict."""
        pdf_bytes = self._create_sample_pdf(["Research methodology and experimental protocol for trial A."])
        uploaded_1 = SimpleUploadedFile("trial_a.pdf", pdf_bytes, content_type="application/pdf")
        uploaded_2 = SimpleUploadedFile("trial_a_copy.pdf", pdf_bytes, content_type="application/pdf")

        url = reverse('source-ingest-pdf')
        data1 = {'project_id': self.project.id, 'title': 'Trial A', 'pdf_file': uploaded_1}
        data2 = {'project_id': self.project.id, 'title': 'Trial A Duplicate', 'pdf_file': uploaded_2}

        res1 = self.client.post(url, data1, format='multipart')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        res2 = self.client.post(url, data2, format='multipart')
        self.assertEqual(res2.status_code, status.HTTP_409_CONFLICT)
        self.assertIn('Duplicate source detected', res2.data['error'])

    # =========================================================================
    # 4. SOURCE MANAGEMENT (LIST, FILTER, DELETE)
    # =========================================================================
    def test_source_listing_and_filtering(self):
        """Verify sources list endpoint returns preview data and filters by project, type, and status."""
        Source.objects.create(
            project=self.project,
            added_by=self.user,
            title='Sample Alpha',
            source_type=Source.SourceType.TEXT,
            processing_status=Source.ProcessingStatus.COMPLETED,
            extracted_text='Alpha text content'
        )
        Source.objects.create(
            project=self.project,
            added_by=self.user,
            title='Sample Beta',
            source_type=Source.SourceType.PDF,
            processing_status=Source.ProcessingStatus.OCR_NEEDED,
            error_message='OCR required'
        )

        url = reverse('source-list-create')
        res = self.client.get(url, {'project': self.project.id})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Check pagination or results array
        results = res.data.get('results', res.data)
        self.assertGreaterEqual(len(results), 2)

        # Filter by source_type=text
        res_text = self.client.get(url, {'project': self.project.id, 'source_type': 'text'})
        results_text = res_text.data.get('results', res_text.data)
        self.assertEqual(len(results_text), 1)
        self.assertEqual(results_text[0]['title'], 'Sample Alpha')

        # Filter by processing_status=ocr_needed
        res_ocr = self.client.get(url, {'project': self.project.id, 'processing_status': 'ocr_needed'})
        results_ocr = res_ocr.data.get('results', res_ocr.data)
        self.assertEqual(len(results_ocr), 1)
        self.assertEqual(results_ocr[0]['title'], 'Sample Beta')

    def test_source_deletion(self):
        """Verify source deletion removes the record."""
        source = Source.objects.create(
            project=self.project,
            added_by=self.user,
            title='Source to Delete',
            source_type=Source.SourceType.TEXT,
            processing_status=Source.ProcessingStatus.COMPLETED
        )
        del_url = reverse('source-detail', kwargs={'pk': source.id})
        response = self.client.delete(del_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Source.objects.filter(id=source.id).exists())

    @patch('sources.url_ingestion.check_robots_txt')
    @patch('sources.url_ingestion.socket.getaddrinfo')
    @patch('sources.url_ingestion.requests.get')
    def test_reprocess_failed_url_source(self, mock_requests_get, mock_getaddrinfo, mock_robots):
        """Verify reprocessing a failed URL source successfully fetches and updates status."""
        mock_getaddrinfo.return_value = [
            (None, None, None, None, ('93.184.216.34', 80))
        ]

        mock_html = "<html><head><title>Reprocessed Article</title></head><body><p>Reprocessed content now available.</p></body></html>"
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {'Content-Type': 'text/html; charset=utf-8'}
        mock_response.url = 'https://example.com/reprocessed'
        mock_response.encoding = 'utf-8'
        mock_response.iter_content = MagicMock(return_value=[mock_html.encode('utf-8')])
        mock_response.raise_for_status = MagicMock()
        mock_requests_get.return_value = mock_response

        failed_source = Source.objects.create(
            project=self.project,
            added_by=self.user,
            title='Failed URL',
            source_type=Source.SourceType.URL,
            original_url='https://example.com/reprocessed',
            processing_status=Source.ProcessingStatus.FAILED,
            error_message='Connection timed out initially.'
        )

        reprocess_url = reverse('source-reprocess', kwargs={'pk': failed_source.id})
        response = self.client.post(reprocess_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        failed_source.refresh_from_db()
        self.assertEqual(failed_source.processing_status, Source.ProcessingStatus.COMPLETED)
        self.assertEqual(failed_source.title, 'Reprocessed Article')
        self.assertEqual(failed_source.error_message, '')
        self.assertIn('Reprocessed content now available', failed_source.extracted_text)

