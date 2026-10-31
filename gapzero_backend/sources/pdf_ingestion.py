"""
PDF Ingestion Service using PyMuPDF (fitz)
Features:
- Validates PDF magic bytes (%PDF-) and file size limit (max 15 MB)
- Preserves page numbers and per-page text layout
- Gracefully detects scanned PDFs (image-only, missing text layer) and reports OCR needed
- Extracts document metadata (title, author, creation date)
- Computes SHA-256 content hash
- Never fabricates content
"""
import hashlib
import io
import logging
import fitz  # PyMuPDF
from .url_ingestion import IngestionError

logger = logging.getLogger(__name__)

MAX_PDF_SIZE = 15 * 1024 * 1024  # 15 MB


class PDFValidationError(IngestionError):
    """Raised when uploaded file is invalid or exceeds limits."""
    pass


class ScannedPDFError(IngestionError):
    """Raised when a PDF contains no extractable text layer (scanned document requiring OCR)."""
    pass


def validate_pdf_file(file_obj, filename="document.pdf"):
    """
    Validates file size and magic bytes (%PDF-).
    """
    if hasattr(file_obj, 'seek'):
        file_obj.seek(0, 2)
        size = file_obj.tell()
        file_obj.seek(0)
    elif isinstance(file_obj, bytes):
        size = len(file_obj)
    else:
        raise PDFValidationError("Invalid file object provided.")

    if size == 0:
        raise PDFValidationError("The uploaded PDF file is empty (0 bytes).")

    if size > MAX_PDF_SIZE:
        raise PDFValidationError(
            f"PDF file size ({size / (1024 * 1024):.1f} MB) exceeds maximum allowed limit of {MAX_PDF_SIZE / (1024 * 1024):.0f} MB."
        )

    # Read first 1024 bytes to check magic header
    if hasattr(file_obj, 'read'):
        header = file_obj.read(1024)
        file_obj.seek(0)
    else:
        header = file_obj[:1024]

    if b"%PDF-" not in header:
        raise PDFValidationError("Invalid file format. The file does not have a valid PDF header (%PDF-).")

    return size


def extract_pdf_content(file_obj, filename="document.pdf"):
    """
    Extracts text, per-page breakdown, and metadata using PyMuPDF.
    Returns:
        dict: {
            'title': str,
            'authors': list,
            'page_count': int,
            'extracted_pages': list of dicts [{'page': 1, 'text': '...', 'char_count': int}],
            'extracted_text': str,
            'content_hash': str,
            'file_size': int,
            'is_scanned': bool,
            'ocr_needed': bool,
            'error_message': str,
        }
    """
    file_size = validate_pdf_file(file_obj, filename)

    if hasattr(file_obj, 'read'):
        file_bytes = file_obj.read()
        file_obj.seek(0)
    else:
        file_bytes = file_obj

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        raise PDFValidationError(f"Could not open or parse PDF document: {str(e)}")

    page_count = len(doc)
    if page_count == 0:
        raise PDFValidationError("PDF document contains 0 pages.")

    # Extract metadata
    meta = doc.metadata or {}
    meta_title = (meta.get('title') or '').strip()
    meta_author = (meta.get('author') or '').strip()

    title = meta_title if meta_title else filename.replace('.pdf', '').replace('_', ' ').replace('-', ' ').title()
    authors = [meta_author] if meta_author else []

    extracted_pages = []
    formatted_page_blocks = []
    total_characters = 0

    for page_index in range(page_count):
        page_num = page_index + 1
        page = doc[page_index]
        page_text = page.get_text("text").strip()
        char_count = len(page_text)
        total_characters += char_count

        extracted_pages.append({
            'page': page_num,
            'text': page_text,
            'char_count': char_count,
        })

        if page_text:
            formatted_page_blocks.append(f"--- [Page {page_num}] ---\n{page_text}")

    full_text = "\n\n".join(formatted_page_blocks)

    # Scanned PDF Detection:
    # If the document has pages but total extracted characters across all pages is fewer than 40
    # (or average < 8 characters per page), it's a scanned/rasterized document.
    is_scanned = False
    ocr_needed = False
    error_message = ""

    if total_characters < 40 or (page_count > 1 and total_characters / page_count < 8):
        is_scanned = True
        ocr_needed = True
        error_message = (
            f"Scanned PDF detected. This document ({page_count} pages) contains image scans without an embedded "
            f"text layer ({total_characters} characters found). Optical Character Recognition (OCR) is required."
        )

    # Compute content hash:
    # If text is present, hash the extracted text; otherwise hash the file bytes
    if full_text:
        content_hash = hashlib.sha256(full_text.encode('utf-8')).hexdigest()
    else:
        content_hash = hashlib.sha256(file_bytes).hexdigest()

    return {
        'title': title[:500],
        'authors': authors,
        'page_count': page_count,
        'extracted_pages': extracted_pages,
        'extracted_text': full_text,
        'content_hash': content_hash,
        'file_size': file_size,
        'is_scanned': is_scanned,
        'ocr_needed': ocr_needed,
        'error_message': error_message,
    }
