"""
URL Ingestion Service
Features:
- Strict SSRF protection (private IP / localhost / link-local rejection)
- robots.txt compliance
- Size limit enforcement (max 5MB)
- Timeout & HTTP error handling
- Extraction of title, readable text, canonical URL, publication date & modified date
- Content hashing (SHA-256)
"""
import hashlib
import ipaddress
import logging
import socket
from urllib.parse import urlparse, urljoin
import urllib.robotparser
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

USER_AGENT = "AGYAAN-LAB-Research-Intelligence/1.0 (mailto:dev@agyaanlab.ai)"
MAX_RESPONSE_SIZE = 5 * 1024 * 1024  # 5 MB
DEFAULT_TIMEOUT = 10  # seconds


class IngestionError(Exception):
    """Base class for source ingestion exceptions."""
    pass


class SSRFProtectionError(IngestionError):
    """Raised when a URL attempts to resolve to an internal/private/loopback address."""
    pass


class RobotsDisallowedError(IngestionError):
    """Raised when robots.txt disallows crawling the URL."""
    pass


class SizeLimitExceededError(IngestionError):
    """Raised when page content exceeds maximum allowed size."""
    pass


BLOCKED_HOSTNAMES = {
    'localhost',
    'localhost.localdomain',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    'internal',
    'metadata.google.internal',
    '169.254.169.254',  # AWS/GCP metadata service
}

PRIVATE_NETWORKS = [
    ipaddress.ip_network('127.0.0.0/8'),
    ipaddress.ip_network('10.0.0.0/8'),
    ipaddress.ip_network('172.16.0.0/12'),
    ipaddress.ip_network('192.168.0.0/16'),
    ipaddress.ip_network('169.254.0.0/16'),
    ipaddress.ip_network('0.0.0.0/8'),
    ipaddress.ip_network('100.64.0.0/10'),
    ipaddress.ip_network('192.0.0.0/24'),
    ipaddress.ip_network('192.0.2.0/24'),
    ipaddress.ip_network('198.18.0.0/15'),
    ipaddress.ip_network('198.51.100.0/24'),
    ipaddress.ip_network('203.0.113.0/24'),
    ipaddress.ip_network('224.0.0.0/4'),
    ipaddress.ip_network('240.0.0.0/4'),
    ipaddress.ip_network('::1/128'),
    ipaddress.ip_network('fc00::/7'),
    ipaddress.ip_network('fe80::/10'),
    ipaddress.ip_network('ff00::/8'),
]


def validate_and_resolve_url(url: str):
    """
    Validates URL scheme and resolves hostname to ensure no private/loopback/SSRF targets.
    Returns parsed URL.
    """
    if not url or not isinstance(url, str):
        raise IngestionError("A valid URL string is required.")

    parsed = urlparse(url.strip())
    scheme = parsed.scheme.lower()

    if scheme not in ('http', 'https'):
        raise SSRFProtectionError(f"Unsafe URL scheme '{scheme}'. Only HTTP and HTTPS are permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise IngestionError("URL is missing a valid hostname.")

    hostname_lower = hostname.lower()
    if hostname_lower in BLOCKED_HOSTNAMES or hostname_lower.endswith(('.local', '.internal', '.lan', '.localdomain')):
        raise SSRFProtectionError(f"Access to host '{hostname}' is blocked for security reasons (SSRF prevention).")

    # Resolve IP addresses for hostname
    try:
        addr_info = socket.getaddrinfo(hostname, parsed.port or (443 if scheme == 'https' else 80))
    except socket.gaierror as e:
        raise IngestionError(f"Could not resolve hostname '{hostname}': {str(e)}")

    for item in addr_info:
        sockaddr = item[4]
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
            for net in PRIVATE_NETWORKS:
                if ip_obj in net:
                    raise SSRFProtectionError(
                        f"Resolved address '{ip_str}' for host '{hostname}' falls within prohibited private/internal network {net}."
                    )
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_multicast or ip_obj.is_reserved:
                raise SSRFProtectionError(
                    f"Resolved address '{ip_str}' for host '{hostname}' is not a public routable address."
                )
        except ValueError:
            raise SSRFProtectionError(f"Invalid IP address format: {ip_str}")

    return parsed


def check_robots_txt(url: str, parsed_url=None):
    """
    Checks robots.txt for the domain to respect website crawling rules.
    Fails safely if robots.txt is unavailable (404/timeout).
    """
    if not parsed_url:
        parsed_url = urlparse(url)

    scheme = parsed_url.scheme
    netloc = parsed_url.netloc
    robots_url = f"{scheme}://{netloc}/robots.txt"

    rp = urllib.robotparser.RobotFileParser()
    try:
        resp = requests.get(
            robots_url,
            headers={"User-Agent": USER_AGENT},
            timeout=5,
            stream=True
        )
        if resp.status_code == 200:
            content = resp.raw.read(100 * 1024).decode('utf-8', errors='ignore')
            rp.parse(content.splitlines())
            if not rp.can_fetch(USER_AGENT, url):
                raise RobotsDisallowedError(f"Website restrictions (robots.txt) disallow crawling '{url}'.")
    except RobotsDisallowedError:
        raise
    except Exception as e:
        # If robots.txt cannot be fetched (e.g. 404 or connection issue), standard protocol is to proceed
        logger.debug(f"robots.txt check skipped or failed for {robots_url}: {e}")


def fetch_url_content(url: str):
    """
    Performs streaming fetch of public web page with strict size limit and headers.
    """
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=DEFAULT_TIMEOUT,
            stream=True,
            allow_redirects=True
        )

        # Re-validate final redirected URL for SSRF protection
        if response.url != url:
            validate_and_resolve_url(response.url)

        response.raise_for_status()

        # Check declared content-length
        content_length = response.headers.get('Content-Length')
        if content_length and int(content_length) > MAX_RESPONSE_SIZE:
            raise SizeLimitExceededError(
                f"Page content length ({int(content_length)} bytes) exceeds maximum limit of {MAX_RESPONSE_SIZE} bytes (5 MB)."
            )

        # Stream body with chunk size limit enforcement
        chunks = []
        bytes_read = 0
        for chunk in response.iter_content(chunk_size=32 * 1024):
            bytes_read += len(chunk)
            if bytes_read > MAX_RESPONSE_SIZE:
                raise SizeLimitExceededError(
                    f"Downloaded content exceeded {MAX_RESPONSE_SIZE} bytes limit."
                )
            chunks.append(chunk)

        content_bytes = b"".join(chunks)

        # Detect encoding
        encoding = response.encoding or 'utf-8'
        try:
            html_text = content_bytes.decode(encoding)
        except (UnicodeDecodeError, LookupError):
            html_text = content_bytes.decode('utf-8', errors='replace')

        return html_text, response.url

    except requests.exceptions.Timeout:
        raise IngestionError(f"Connection timed out after {DEFAULT_TIMEOUT} seconds while fetching URL.")
    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code if e.response is not None else 'Unknown'
        if status_code == 403:
            raise IngestionError("HTTP 403 Forbidden: The website blocked access or requires authorization.")
        elif status_code == 404:
            raise IngestionError("HTTP 404 Not Found: The requested web page does not exist.")
        elif status_code == 429:
            raise IngestionError("HTTP 429 Too Many Requests: Rate limit reached on target website.")
        else:
            raise IngestionError(f"HTTP Error {status_code} occurred while requesting page: {str(e)}")
    except requests.exceptions.SSLError as e:
        raise IngestionError(f"SSL certificate verification failed for target server: {str(e)}")
    except requests.exceptions.ConnectionError as e:
        raise IngestionError(f"Failed to connect to host: {str(e)}")
    except IngestionError:
        raise
    except Exception as e:
        raise IngestionError(f"Unexpected error while fetching URL: {str(e)}")


def extract_metadata_and_text(html_content: str, source_url: str):
    """
    Extracts title, readable text, canonical URL, publication date, and modified date.
    Calculates SHA-256 content hash.
    """
    soup = BeautifulSoup(html_content, 'html.parser')

    # 1. Title Extraction
    title = ""
    # Try og:title
    og_title = soup.find('meta', property='og:title')
    if og_title and og_title.get('content'):
        title = og_title['content'].strip()

    if not title:
        # Try <title>
        title_tag = soup.find('title')
        if title_tag and title_tag.string:
            title = title_tag.string.strip()

    if not title:
        # Try h1
        h1 = soup.find('h1')
        if h1:
            title = h1.get_text().strip()

    if not title:
        title = urlparse(source_url).path.split('/')[-1] or source_url

    # 2. Canonical URL Extraction
    canonical_url = ""
    canonical_link = soup.find('link', rel='canonical')
    if canonical_link and canonical_link.get('href'):
        canonical_url = urljoin(source_url, canonical_link['href'].strip())
    else:
        og_url = soup.find('meta', property='og:url')
        if og_url and og_url.get('content'):
            canonical_url = urljoin(source_url, og_url['content'].strip())
        else:
            canonical_url = source_url

    # 3. Publication Date & Modified Date Extraction
    pub_date = ""
    pub_meta_names = [
        ('property', 'article:published_time'),
        ('name', 'citation_publication_date'),
        ('name', 'publication_date'),
        ('name', 'pubdate'),
        ('name', 'date'),
        ('property', 'og:published_time'),
        ('itemprop', 'datePublished'),
    ]
    for attr, val in pub_meta_names:
        meta = soup.find('meta', {attr: val})
        if meta and meta.get('content'):
            pub_date = meta['content'].strip()
            break

    mod_date = ""
    mod_meta_names = [
        ('property', 'article:modified_time'),
        ('property', 'og:updated_time'),
        ('name', 'lastmod'),
        ('name', 'revised'),
        ('itemprop', 'dateModified'),
    ]
    for attr, val in mod_meta_names:
        meta = soup.find('meta', {attr: val})
        if meta and meta.get('content'):
            mod_date = meta['content'].strip()
            break

    # 4. Readable Text Extraction
    # Remove clutter elements
    for tag in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'form', 'noscript', 'svg', 'iframe']):
        tag.decompose()

    # Prioritize main article containers
    container = (
        soup.find('article') or
        soup.find('main') or
        soup.find(role='main') or
        soup.find('div', class_='content') or
        soup.find('div', id='content') or
        soup.body or
        soup
    )

    # Extract clean text with newline separation
    text = container.get_text(separator='\n', strip=True)

    # Collapse multiple blank lines
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    readable_text = "\n\n".join(lines)

    if not readable_text:
        readable_text = "No readable text content could be extracted from the target web page."

    # 5. Content Hashing (SHA-256)
    content_hash = hashlib.sha256(readable_text.encode('utf-8')).hexdigest()

    return {
        'title': title[:500],
        'canonical_url': canonical_url,
        'publication_date': pub_date,
        'modified_date': mod_date,
        'readable_text': readable_text,
        'content_hash': content_hash,
    }


def ingest_url(url: str):
    """
    Main entry point for URL ingestion:
    1. Validates URL and prevents SSRF
    2. Respects robots.txt
    3. Fetches content with size limit
    4. Extracts metadata and readable text
    """
    parsed = validate_and_resolve_url(url)
    check_robots_txt(url, parsed)
    html_content, final_url = fetch_url_content(url)
    data = extract_metadata_and_text(html_content, final_url)
    data['original_url'] = url
    return data
