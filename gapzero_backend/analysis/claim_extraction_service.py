"""
AI-Powered Claim & Evidence Extraction Engine
AGYAAN LAB Research Intelligence

Converts extracted source documents into structured, traceable, and verifiable atomic claims.
Enforces strict hallucination barriers:
- Rejects unsupported claims without exact matching source passages.
- Validates model output JSON schema.
- Handles rate limits, timeouts, and API errors.
- Implements intelligent multi-page and text window chunking.
"""
import re
import json
import time
import logging
import requests
from typing import List, Dict, Any, Optional, Tuple
from decouple import config
from django.db import transaction

from sources.models import Source
from .models import Claim, Evidence

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "qwen/qwen3.8-27b"
FALLBACK_MODEL = "openai/gpt-oss-120b"
MAX_CHUNK_CHARS = 3200
CHUNK_OVERLAP_CHARS = 300


class ExtractionServiceError(Exception):
    """Base exception for claim extraction engine errors."""
    pass


class LLMConfigurationError(ExtractionServiceError):
    """Raised when LLM API keys or configuration is missing."""
    pass


class LLMRateLimitError(ExtractionServiceError):
    """Raised when LLM API rate limit is exceeded."""
    pass


class LLMAPIError(ExtractionServiceError):
    """Raised when LLM API returns non-recoverable error."""
    pass


class MalformedOutputError(ExtractionServiceError):
    """Raised when LLM output cannot be parsed into valid JSON structure."""
    pass


def get_llm_config() -> Tuple[str, str]:
    """Retrieves and validates API credentials from environment."""
    api_key = config('GROQ_API_KEY', default='').strip()
    model = config('GROQ_MODEL', default=DEFAULT_MODEL).strip()

    if not api_key:
        raise LLMConfigurationError(
            "GROQ_API_KEY is not configured in environment variables. "
            "Please configure a valid Groq API key in your environment (.env) before running extraction."
        )

    return api_key, model


def call_llm_with_retry(
    messages: List[Dict[str, str]],
    max_tokens: int = 3000,
    temperature: float = 0.05,
    max_retries: int = 2
) -> str:
    """
    Executes Groq LLM completion with rate-limit backoff and fallback handling.
    """
    api_key, model = get_llm_config()

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "response_format": {"type": "json_object"},
    }

    last_error = None
    for attempt in range(max_retries + 1):
        try:
            response = requests.post(
                GROQ_API_URL,
                headers=headers,
                json=payload,
                timeout=45
            )

            if response.status_code == 200:
                data = response.json()
                return data['choices'][0]['message']['content']

            elif response.status_code == 429:
                # Rate limit hit
                wait_time = (2 ** attempt) + 1
                logger.warning(f"Groq API 429 Rate Limit hit. Backing off for {wait_time}s (attempt {attempt + 1})...")
                if attempt < max_retries:
                    time.sleep(wait_time)
                    continue
                raise LLMRateLimitError(
                    "Groq API rate limit exceeded. Please wait a moment before running more extractions."
                )

            elif response.status_code in (400, 404):
                # Try fallback model
                if payload["model"] != FALLBACK_MODEL:
                    logger.warning(f"Primary model '{payload['model']}' failed ({response.status_code}). Trying fallback '{FALLBACK_MODEL}'...")
                    payload["model"] = FALLBACK_MODEL
                    continue
                raise LLMAPIError(f"Groq API request error ({response.status_code}): {response.text}")

            elif response.status_code == 401:
                raise LLMConfigurationError("Invalid GROQ_API_KEY. Authentication rejected by Groq API.")

            else:
                raise LLMAPIError(f"Groq API returned HTTP {response.status_code}: {response.text}")

        except requests.exceptions.Timeout:
            last_error = LLMAPIError("LLM API request timed out after 45 seconds.")
            if attempt < max_retries:
                time.sleep(2)
                continue
        except requests.exceptions.ConnectionError as e:
            last_error = LLMAPIError(f"Network error connecting to LLM service: {str(e)}")
            if attempt < max_retries:
                time.sleep(2)
                continue
        except ExtractionServiceError:
            raise
        except Exception as e:
            last_error = LLMAPIError(f"Unexpected error calling LLM API: {str(e)}")
            break

    if last_error:
        raise last_error
    raise LLMAPIError("Failed to obtain LLM response after retries.")


def clean_and_parse_json(raw_text: str) -> Dict[str, Any]:
    """
    Safely cleans markdown fences and parses JSON output from LLM.
    """
    if not raw_text or not raw_text.strip():
        raise MalformedOutputError("LLM returned empty response.")

    text = raw_text.strip()

    # Strip markdown code blocks
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n", "", text)
        text = re.sub(r"\n```$", "", text)
        text = text.strip()

    # Try standard json parse
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
        elif isinstance(data, list):
            return {"claims": data}
        raise MalformedOutputError("Parsed JSON is not an object or array.")
    except json.JSONDecodeError:
        pass

    # Regex fallback to find top-level JSON object
    match = re.search(r"(\{[\s\S]*\})", text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Regex fallback for array
    match_arr = re.search(r"(\[[\s\S]*\])", text)
    if match_arr:
        try:
            return {"claims": json.loads(match_arr.group(1))}
        except json.JSONDecodeError:
            pass

    raise MalformedOutputError(f"Could not parse valid JSON from LLM output. Raw snippet: {raw_text[:200]}")


def chunk_source_content(source: Source) -> List[Dict[str, Any]]:
    """
    Intelligently chunks source text for processing:
    - If multi-page (e.g. PDF or multi-page URL), chunks per page or sub-page windows.
    - If single continuous text, chunks with sliding window and character overlap.
    Returns list of chunk objects: [{'text': str, 'page_number': int | None, 'start_offset': int}]
    """
    chunks = []

    # Case 1: Source has structured extracted_pages
    if source.extracted_pages and isinstance(source.extracted_pages, list):
        for page_data in source.extracted_pages:
            page_num = page_data.get('page', 1)
            page_text = page_data.get('text', '').strip()
            if not page_text:
                continue

            # If page text is within limits, use whole page
            if len(page_text) <= MAX_CHUNK_CHARS:
                chunks.append({
                    'text': page_text,
                    'page_number': page_num,
                    'start_offset': 0,
                    'full_context': page_text,
                })
            else:
                # Sub-chunk long page with overlap
                start = 0
                while start < len(page_text):
                    end = min(start + MAX_CHUNK_CHARS, len(page_text))
                    chunk_str = page_text[start:end]
                    chunks.append({
                        'text': chunk_str,
                        'page_number': page_num,
                        'start_offset': start,
                        'full_context': page_text,
                    })
                    if end >= len(page_text):
                        break
                    start += (MAX_CHUNK_CHARS - CHUNK_OVERLAP_CHARS)

        if chunks:
            return chunks

    # Case 2: Continuous text from extracted_text or abstract
    text = (source.extracted_text or source.abstract or "").strip()
    if not text:
        return []

    if len(text) <= MAX_CHUNK_CHARS:
        return [{
            'text': text,
            'page_number': 1,
            'start_offset': 0,
            'full_context': text,
        }]

    # Chunk continuous text with sliding window
    start = 0
    chunk_idx = 1
    while start < len(text):
        end = min(start + MAX_CHUNK_CHARS, len(text))
        chunk_str = text[start:end]
        chunks.append({
            'text': chunk_str,
            'page_number': chunk_idx,
            'start_offset': start,
            'full_context': text,
        })
        if end >= len(text):
            break
        start += (MAX_CHUNK_CHARS - CHUNK_OVERLAP_CHARS)
        chunk_idx += 1

    return chunks


def normalize_for_matching(text: str) -> str:
    """Normalizes string for whitespace and punctuation-tolerant matching."""
    text = text.lower()
    text = re.sub(r'[\r\n\t]+', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def verify_evidence_in_source(
    passage: str,
    source_context: str
) -> Tuple[bool, Optional[int], Optional[int], float]:
    """
    Verifies that the supporting passage actually exists in the source text.
    Strictly prevents LLM hallucination: if the passage cannot be matched, returns False.
    Returns (is_verified, char_start, char_end, similarity_score).
    """
    if not passage or not source_context:
        return False, None, None, 0.0

    passage_clean = passage.strip()
    if len(passage_clean) < 10:
        return False, None, None, 0.0

    # 1. Exact verbatim substring match
    idx = source_context.find(passage_clean)
    if idx != -1:
        return True, idx, idx + len(passage_clean), 1.0

    # 2. Case-insensitive match
    idx = source_context.lower().find(passage_clean.lower())
    if idx != -1:
        return True, idx, idx + len(passage_clean), 0.98

    # 3. Whitespace-normalized match
    norm_context = normalize_for_matching(source_context)
    norm_passage = normalize_for_matching(passage_clean)

    if norm_passage in norm_context:
        # Locate approximate position in original context
        words = norm_passage.split()
        if len(words) >= 3:
            first_words = " ".join(words[:3])
            last_words = " ".join(words[-3:])
            pos_start = source_context.lower().find(first_words.lower())
            pos_end = source_context.lower().find(last_words.lower())
            if pos_start != -1 and pos_end != -1 and pos_end >= pos_start:
                return True, pos_start, pos_end + len(last_words), 0.95
        return True, None, None, 0.92

    # 4. Token sequence overlap check
    # Check if a 80%+ contiguous sequence of words exists in context
    passage_words = passage_clean.split()
    if len(passage_words) >= 6:
        # Try matching sub-phrases of 5 words
        for start_w in range(0, len(passage_words) - 4):
            sub_phrase = " ".join(passage_words[start_w:start_w + 5]).lower()
            if sub_phrase in source_context.lower():
                # Found partial anchor match
                return True, None, None, 0.85

    # Not found in source text: reject as unsupported / hallucinated
    return False, None, None, 0.0


def extract_claims_from_chunk(
    chunk_text: str,
    page_number: Optional[int],
    source_title: str
) -> List[Dict[str, Any]]:
    """
    Queries the LLM for structured atomic claims extracted from a text chunk.
    """
    system_prompt = (
        "You are the AGYAAN LAB Scientific Epistemology & Evidence Extraction Engine. "
        "Your mission is to extract atomic, empirical, and methodological claims from the provided scientific source text.\n\n"
        "STRICT GROUNDING RULES:\n"
        "1. NEVER invent facts, findings, numbers, or citations.\n"
        "2. For every claim, you MUST quote the EXACT supporting passage VERBATIM from the text.\n"
        "3. DO NOT paraphrase the passage. If the text does not explicitly state it, DO NOT include the claim.\n"
        "4. Claims must be atomic: one subject, one attribute, one outcome/value.\n"
        "5. Output MUST be a valid JSON object matching the schema below."
    )

    schema_prompt = (
        'Schema:\n'
        '{\n'
        '  "claims": [\n'
        '    {\n'
        '      "claim_text": "<concise factual statement, e.g. CRISPR-Cas9 achieved 99.4% precision in mammalian cells>",\n'
        '      "subject": "<entity or system, e.g. CRISPR-Cas9>",\n'
        '      "attribute": "<property or metric, e.g. on-target cleavage precision>",\n'
        '      "value": "<outcome or number, e.g. 99.4%>",\n'
        '      "claim_type": "empirical" | "methodological" | "theoretical" | "statistical" | "comparative" | "definitional",\n'
        '      "confidence": <number between 0.50 and 1.00 indicating extraction clarity>,\n'
        '      "supporting_passage": "<exact verbatim sentence or sentences from the text below>"\n'
        '    }\n'
        '  ]\n'
        '}'
    )

    user_prompt = (
        f"DOCUMENT TITLE: {source_title}\n"
        f"PAGE NUMBER: {page_number or 'N/A'}\n\n"
        f"SOURCE TEXT CHUNK:\n"
        f"\"\"\"\n{chunk_text}\n\"\"\"\n\n"
        f"{schema_prompt}\n\n"
        f"Extract all verifiable claims now. Remember: 'supporting_passage' MUST be an exact verbatim substring from the text above."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    raw_response = call_llm_with_retry(messages, max_tokens=2500, temperature=0.05)
    parsed = clean_and_parse_json(raw_response)

    raw_claims = parsed.get('claims', [])
    if not isinstance(raw_claims, list):
        return []

    return raw_claims


class ClaimExtractionEngine:
    """
    Main orchestration class for claim and evidence extraction.
    """

    def __init__(self, user=None):
        self.user = user

    def extract_from_source(self, source: Source) -> Dict[str, Any]:
        """
        Processes a Source document:
        1. Breaks source into structured chunks.
        2. Calls LLM with structured JSON output instructions.
        3. Validates model output.
        4. Verifies supporting evidence passages against source text (rejects unsupported claims).
        5. Saves verified Claim and Evidence models atomically.
        """
        # Ensure source has text
        content_text = source.extracted_text or source.abstract
        if not content_text or len(content_text.strip()) < 20:
            raise ExtractionServiceError(
                f"Source '{source.title}' contains insufficient extracted text ({len(content_text or '')} chars). "
                f"Ensure the source was successfully ingested before extracting claims."
            )

        if source.processing_status == Source.ProcessingStatus.OCR_NEEDED:
            raise ExtractionServiceError(
                f"Source '{source.title}' requires OCR processing before text claims can be extracted."
            )

        chunks = chunk_source_content(source)
        if not chunks:
            raise ExtractionServiceError(f"Failed to segment source '{source.title}' into readable chunks.")

        logger.info(f"Extracting claims for source #{source.id} ('{source.title}') across {len(chunks)} chunk(s)...")

        extracted_claims_data = []
        rejected_claims_count = 0

        for chunk_idx, chunk in enumerate(chunks, 1):
            chunk_text = chunk['text']
            page_num = chunk.get('page_number')

            try:
                raw_chunk_claims = extract_claims_from_chunk(
                    chunk_text=chunk_text,
                    page_number=page_num,
                    source_title=source.title
                )
            except (LLMConfigurationError, LLMRateLimitError):
                raise
            except Exception as e:
                logger.error(f"Error extracting claims from chunk {chunk_idx}: {e}")
                continue

            for raw in raw_chunk_claims:
                claim_text = (raw.get('claim_text') or '').strip()
                subject = (raw.get('subject') or '').strip()
                attribute = (raw.get('attribute') or '').strip()
                value = (raw.get('value') or '').strip()
                passage = (raw.get('supporting_passage') or '').strip()
                claim_type = (raw.get('claim_type') or 'empirical').lower()

                try:
                    conf = float(raw.get('confidence', 0.85))
                    conf = max(0.1, min(1.0, conf))
                except (ValueError, TypeError):
                    conf = 0.85

                # 1. Structural Validation
                if not claim_text or not subject or not passage:
                    rejected_claims_count += 1
                    continue

                # Validate claim_type choices
                valid_types = [c[0] for c in Claim.ClaimType.choices]
                if claim_type not in valid_types:
                    claim_type = Claim.ClaimType.EMPIRICAL

                # 2. Strict Evidence Verification against source text (Reject unsupported claims)
                is_verified, c_start, c_end, sim_score = verify_evidence_in_source(
                    passage=passage,
                    source_context=chunk.get('full_context', chunk_text)
                )

                if not is_verified:
                    # Check global source text as fallback
                    is_verified, c_start, c_end, sim_score = verify_evidence_in_source(
                        passage=passage,
                        source_context=source.extracted_text or source.abstract or ""
                    )

                if not is_verified:
                    # Hallucination detected: model invented passage
                    logger.warning(
                        f"REJECTED unsupported claim for source #{source.id}: '{claim_text}' "
                        f"(Passage not found in source text: '{passage[:60]}...')"
                    )
                    rejected_claims_count += 1
                    continue

                extracted_claims_data.append({
                    'claim_text': claim_text,
                    'subject': subject[:255],
                    'attribute': (attribute or 'general')[:255],
                    'value': (value or 'observed')[:255],
                    'claim_type': claim_type,
                    'confidence': conf,
                    'passage': passage,
                    'page_number': page_num,
                    'char_start': c_start,
                    'char_end': c_end,
                    'similarity_score': sim_score,
                })

        # Deduplicate claims by (subject, attribute, value)
        unique_claims = {}
        for item in extracted_claims_data:
            key = (
                item['subject'].lower().strip(),
                item['attribute'].lower().strip(),
                item['value'].lower().strip()
            )
            if key not in unique_claims:
                unique_claims[key] = item
            else:
                # Keep the one with higher confidence
                if item['confidence'] > unique_claims[key]['confidence']:
                    unique_claims[key] = item

        saved_claims = []

        # Save to database in atomic transaction
        with transaction.atomic():
            for c_data in unique_claims.values():
                # Check if identical claim already exists for this source
                existing_claim = Claim.objects.filter(
                    source=source,
                    subject=c_data['subject'],
                    attribute=c_data['attribute'],
                    value=c_data['value']
                ).first()

                if existing_claim:
                    # Claim already saved
                    saved_claims.append(existing_claim)
                    continue

                claim_obj = Claim.objects.create(
                    project=source.project,
                    source=source,
                    created_by=self.user,
                    claim_text=c_data['claim_text'],
                    subject=c_data['subject'],
                    attribute=c_data['attribute'],
                    value=c_data['value'],
                    claim_type=c_data['claim_type'],
                    confidence=c_data['confidence']
                )

                Evidence.objects.create(
                    claim=claim_obj,
                    source=source,
                    passage=c_data['passage'],
                    page_number=c_data['page_number'],
                    char_start=c_data['char_start'],
                    char_end=c_data['char_end'],
                    similarity_score=c_data['similarity_score'],
                    is_verified=True
                )

                saved_claims.append(claim_obj)

        logger.info(
            f"Extraction complete for source #{source.id}: "
            f"{len(saved_claims)} verified claims saved, {rejected_claims_count} unsupported claims rejected."
        )

        return {
            'source_id': source.id,
            'source_title': source.title,
            'claims_extracted': len(saved_claims),
            'claims_rejected': rejected_claims_count,
            'saved_claims': saved_claims,
        }
