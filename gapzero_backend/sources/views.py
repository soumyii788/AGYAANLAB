import logging
from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from django.shortcuts import get_object_or_404
from research.models import ResearchProject

from .models import Source
from .serializers import SourceSerializer, SourceListSerializer
from .literature_search import search_openalex_papers
from .url_ingestion import (
    ingest_url,
    IngestionError,
    SSRFProtectionError,
    RobotsDisallowedError,
    SizeLimitExceededError,
)
from .pdf_ingestion import (
    extract_pdf_content,
    PDFValidationError,
    ScannedPDFError,
)
from .text_ingestion import ingest_text_content

logger = logging.getLogger(__name__)


def check_duplicate_source(content_hash: str, project=None, user=None):
    """
    Checks if a source with identical content_hash already exists.
    Returns existing Source or None.
    """
    if not content_hash:
        return None

    query = Source.objects.filter(content_hash=content_hash)
    if project:
        query = query.filter(project=project)
    elif user:
        query = query.filter(added_by=user)

    return query.first()


class SourceListCreateView(generics.ListCreateAPIView):
    """List all sources with status/type filtering, or create a source manually."""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'authors', 'journal', 'doi', 'abstract', 'extracted_text', 'original_url']
    ordering_fields = ['created_at', 'publication_year', 'relevance_score', 'title', 'processing_status']

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return SourceListSerializer
        return SourceSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Source.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user) | Q(project__is_public=True) | Q(added_by=user)
        ).distinct()

        project_id = self.request.query_params.get('project')
        if project_id and project_id not in ('all', 'undefined', 'null', 'None') and str(project_id).isdigit():
            queryset = queryset.filter(project_id=int(project_id))

        source_type = self.request.query_params.get('type') or self.request.query_params.get('source_type')
        if source_type:
            queryset = queryset.filter(source_type=source_type)

        processing_status = self.request.query_params.get('processing_status') or self.request.query_params.get('status')
        if processing_status:
            queryset = queryset.filter(processing_status=processing_status)

        return queryset


class SourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve full source details with extracted pages, update, or delete."""
    serializer_class = SourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Source.objects.filter(
            Q(project__owner=user) | Q(project__collaborators=user) | Q(added_by=user)
        ).distinct()


class IngestURLView(APIView):
    """
    Validates URL, prevents SSRF, checks robots.txt, fetches with 5MB limit,
    extracts metadata and readable text, and prevents duplicate sources.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        url = request.data.get('url', '').strip()
        project_id = request.data.get('project_id')

        if not url:
            return Response({'error': 'URL is required.'}, status=status.HTTP_400_BAD_REQUEST)

        project = None
        if project_id:
            project = get_object_or_404(ResearchProject, pk=project_id)

        try:
            # Run ingestion pipeline
            extracted_data = ingest_url(url)
            content_hash = extracted_data['content_hash']

            # Check duplicate content hash
            existing = check_duplicate_source(content_hash, project=project, user=request.user)
            if existing:
                return Response({
                    'error': 'Duplicate source detected. A source with identical content already exists.',
                    'existing_source': {
                        'id': existing.id,
                        'title': existing.title,
                        'created_at': existing.created_at,
                    },
                    'content_hash': content_hash,
                }, status=status.HTTP_409_CONFLICT)

            # Create successful source record
            source = Source.objects.create(
                project=project,
                added_by=request.user,
                source_type=Source.SourceType.URL,
                processing_status=Source.ProcessingStatus.COMPLETED,
                title=extracted_data['title'],
                original_url=url,
                canonical_url=extracted_data['canonical_url'],
                publication_date=extracted_data['publication_date'],
                modified_date=extracted_data['modified_date'],
                extracted_text=extracted_data['readable_text'],
                extracted_pages=[{
                    'page': 1,
                    'text': extracted_data['readable_text'],
                    'char_count': len(extracted_data['readable_text'])
                }],
                page_count=1,
                content_hash=content_hash,
                relevance_score=85.0,
            )

            serializer = SourceSerializer(source)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except (SSRFProtectionError, RobotsDisallowedError, SizeLimitExceededError, IngestionError) as e:
            # Record the ingestion failure so it is visible in Source Manager
            error_msg = str(e)
            failed_source = Source.objects.create(
                project=project,
                added_by=request.user,
                source_type=Source.SourceType.URL,
                processing_status=Source.ProcessingStatus.FAILED,
                title=f"Failed Ingestion: {url[:80]}",
                original_url=url,
                error_message=error_msg,
            )
            serializer = SourceSerializer(failed_source)
            return Response({
                'source': serializer.data,
                'error': error_msg,
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except Exception as e:
            logger.exception("Unexpected error in IngestURLView")
            return Response({'error': f"Unexpected ingestion error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IngestPDFView(APIView):
    """
    Accepts PDF file uploads, validates size and MIME type, extracts text using PyMuPDF,
    preserves page numbers, reports scanned PDFs gracefully for OCR, and prevents duplicates.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        pdf_file = request.FILES.get('pdf_file')
        if not pdf_file:
            return Response({'error': 'No PDF file was provided in the request.'}, status=status.HTTP_400_BAD_REQUEST)

        project_id = request.data.get('project_id')
        user_title = request.data.get('title', '').strip()

        project = None
        if project_id:
            project = get_object_or_404(ResearchProject, pk=project_id)

        try:
            # Extract content via PyMuPDF
            extracted = extract_pdf_content(pdf_file, filename=pdf_file.name)
            content_hash = extracted['content_hash']

            # Check duplicate content
            existing = check_duplicate_source(content_hash, project=project, user=request.user)
            if existing:
                return Response({
                    'error': 'Duplicate source detected. A PDF with identical content already exists.',
                    'existing_source': {
                        'id': existing.id,
                        'title': existing.title,
                        'created_at': existing.created_at,
                    },
                    'content_hash': content_hash,
                }, status=status.HTTP_409_CONFLICT)

            # Determine status: OCR_NEEDED or COMPLETED
            if extracted['ocr_needed']:
                proc_status = Source.ProcessingStatus.OCR_NEEDED
            else:
                proc_status = Source.ProcessingStatus.COMPLETED

            title = user_title if user_title else extracted['title']

            # Save source with file
            source = Source.objects.create(
                project=project,
                added_by=request.user,
                source_type=Source.SourceType.PDF,
                processing_status=proc_status,
                title=title,
                pdf_file=pdf_file,
                file_size=extracted['file_size'],
                page_count=extracted['page_count'],
                extracted_pages=extracted['extracted_pages'],
                extracted_text=extracted['extracted_text'],
                content_hash=content_hash,
                authors=extracted['authors'],
                error_message=extracted['error_message'],
                relevance_score=90.0 if proc_status == Source.ProcessingStatus.COMPLETED else None,
            )

            serializer = SourceSerializer(source)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except PDFValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("Unexpected error in IngestPDFView")
            return Response({'error': f"Failed to process PDF: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IngestTextView(APIView):
    """
    Accepts pasted research material, stores title and content,
    and prevents duplicate sources using content hashing.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        title = request.data.get('title', '').strip()
        content = request.data.get('content', '').strip()
        project_id = request.data.get('project_id')

        if not content:
            return Response({'error': 'Research content is required.'}, status=status.HTTP_400_BAD_REQUEST)

        project = None
        if project_id:
            project = get_object_or_404(ResearchProject, pk=project_id)

        try:
            extracted = ingest_text_content(title, content)
            content_hash = extracted['content_hash']

            # Check duplicate content
            existing = check_duplicate_source(content_hash, project=project, user=request.user)
            if existing:
                return Response({
                    'error': 'Duplicate source detected. Identical research text already exists.',
                    'existing_source': {
                        'id': existing.id,
                        'title': existing.title,
                        'created_at': existing.created_at,
                    },
                    'content_hash': content_hash,
                }, status=status.HTTP_409_CONFLICT)

            source = Source.objects.create(
                project=project,
                added_by=request.user,
                source_type=Source.SourceType.TEXT,
                processing_status=Source.ProcessingStatus.COMPLETED,
                title=extracted['title'],
                extracted_text=extracted['extracted_text'],
                extracted_pages=extracted['extracted_pages'],
                page_count=extracted['page_count'],
                content_hash=content_hash,
                file_size=len(extracted['extracted_text'].encode('utf-8')),
                relevance_score=80.0,
            )

            serializer = SourceSerializer(source)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except IngestionError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception("Unexpected error in IngestTextView")
            return Response({'error': f"Failed to ingest text: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReprocessSourceView(APIView):
    """
    Reprocesses an extraction for a failed or pending source.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        source = get_object_or_404(Source, pk=pk)

        # Check permissions
        if source.added_by != request.user and (source.project and source.project.owner != request.user):
            return Response({'error': 'You do not have permission to reprocess this source.'}, status=status.HTTP_403_FORBIDDEN)

        if source.source_type == Source.SourceType.URL and source.original_url:
            try:
                extracted = ingest_url(source.original_url)
                source.title = extracted['title']
                source.canonical_url = extracted['canonical_url']
                source.publication_date = extracted['publication_date']
                source.modified_date = extracted['modified_date']
                source.extracted_text = extracted['readable_text']
                source.extracted_pages = [{'page': 1, 'text': extracted['readable_text'], 'char_count': len(extracted['readable_text'])}]
                source.page_count = 1
                source.content_hash = extracted['content_hash']
                source.processing_status = Source.ProcessingStatus.COMPLETED
                source.error_message = ""
                source.save()
                return Response(SourceSerializer(source).data)
            except Exception as e:
                source.processing_status = Source.ProcessingStatus.FAILED
                source.error_message = str(e)
                source.save()
                return Response({'error': str(e)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        elif source.source_type == Source.SourceType.PDF and source.pdf_file:
            try:
                extracted = extract_pdf_content(source.pdf_file, filename=source.pdf_file.name)
                source.title = extracted['title'] if not source.title else source.title
                source.file_size = extracted['file_size']
                source.page_count = extracted['page_count']
                source.extracted_pages = extracted['extracted_pages']
                source.extracted_text = extracted['extracted_text']
                source.content_hash = extracted['content_hash']
                source.error_message = extracted['error_message']
                if extracted['ocr_needed']:
                    source.processing_status = Source.ProcessingStatus.OCR_NEEDED
                else:
                    source.processing_status = Source.ProcessingStatus.COMPLETED
                source.save()
                return Response(SourceSerializer(source).data)
            except Exception as e:
                source.processing_status = Source.ProcessingStatus.FAILED
                source.error_message = str(e)
                source.save()
                return Response({'error': str(e)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        return Response({'message': 'Source reprocessed', 'source': SourceSerializer(source).data})


class LiveLiteratureSearchView(APIView):
    """Searches live open academic papers via OpenAlex/arXiv."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('query', '').strip()
        if not query:
            return Response({'results': []})
        results = search_openalex_papers(query, limit=12)
        return Response({'results': results, 'count': len(results)})


class ImportPaperView(APIView):
    """Imports an open academic paper directly into a research project."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_id = request.data.get('project_id')
        paper_data = request.data.get('paper')

        if not project_id or not paper_data:
            return Response(
                {'error': 'Both project_id and paper payload are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        project = get_object_or_404(ResearchProject, pk=project_id)

        # Check permissions
        if project.owner != request.user and not project.collaborators.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You do not have permission to add sources to this project.'},
                status=status.HTTP_403_FORBIDDEN
            )

        title = paper_data.get('title', 'Untitled Paper')
        abstract = paper_data.get('abstract', '')
        # Compute content hash
        import hashlib
        hash_text = f"{title}\n{abstract}"
        content_hash = hashlib.sha256(hash_text.encode('utf-8')).hexdigest()

        existing = check_duplicate_source(content_hash, project=project)
        if existing:
            return Response({
                'error': 'Duplicate paper. This paper is already imported into the project.',
                'existing_source': {'id': existing.id, 'title': existing.title},
                'content_hash': content_hash
            }, status=status.HTTP_409_CONFLICT)

        source = Source.objects.create(
            project=project,
            added_by=request.user,
            title=title,
            authors=paper_data.get('authors', []),
            source_type=Source.SourceType.PAPER,
            processing_status=Source.ProcessingStatus.COMPLETED,
            url=paper_data.get('url', ''),
            original_url=paper_data.get('url', ''),
            canonical_url=paper_data.get('url', ''),
            doi=paper_data.get('doi', ''),
            publication_year=paper_data.get('publication_year'),
            publication_date=str(paper_data.get('publication_year') or ''),
            journal=paper_data.get('journal', ''),
            abstract=abstract,
            extracted_text=f"Title: {title}\nAuthors: {', '.join(paper_data.get('authors', []))}\nJournal: {paper_data.get('journal', '')}\n\nAbstract:\n{abstract}",
            page_count=1,
            content_hash=content_hash,
            status='reviewed',
            relevance_score=90.0,
            tags=['imported', 'openalex']
        )

        serializer = SourceSerializer(source)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
