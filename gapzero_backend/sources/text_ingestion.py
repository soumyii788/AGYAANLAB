"""
Text Ingestion Service
Handles user-pasted research notes, raw text, and excerpts.
Features content hashing, title normalization, and validation.
"""
import hashlib
from .url_ingestion import IngestionError


def ingest_text_content(title: str, content: str):
    """
    Validates and processes raw pasted text.
    """
    if not content or not content.strip():
        raise IngestionError("Pasted text content cannot be empty.")

    cleaned_content = content.strip()
    cleaned_title = title.strip() if (title and title.strip()) else cleaned_content[:80].split('\n')[0]

    # SHA-256 hash
    content_hash = hashlib.sha256(cleaned_content.encode('utf-8')).hexdigest()

    return {
        'title': cleaned_title[:500],
        'extracted_text': cleaned_content,
        'content_hash': content_hash,
        'page_count': 1,
        'extracted_pages': [{
            'page': 1,
            'text': cleaned_content,
            'char_count': len(cleaned_content)
        }],
    }
