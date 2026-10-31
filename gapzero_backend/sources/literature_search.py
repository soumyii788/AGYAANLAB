"""
Literature Search Service - Integrates OpenAlex open API.
Zero API key required; 100% free open scholarly metadata search.
"""
import logging
import requests

logger = logging.getLogger(__name__)

OPENALEX_API_URL = "https://api.openalex.org/works"


def search_openalex_papers(query, limit=10):
    """
    Search OpenAlex API for academic papers matching the query.
    Extracts title, authors, publication year, journal/venue, DOI, citation count, and abstract.
    """
    if not query:
        return []

    params = {
        'search': query.strip(),
        'per_page': min(limit, 25),
    }
    headers = {
        'User-Agent': 'GAPZERO-Research-Intelligence/1.0 (mailto:dev@gapzero.ai)'
    }

    try:
        response = requests.get(OPENALEX_API_URL, params=params, headers=headers, timeout=15)
        if response.status_code != 200:
            logger.warning(f"OpenAlex returned {response.status_code}: {response.text}")
            return []

        data = response.json()
        results = []

        for work in data.get('results', []):
            # Reconstruct abstract from inverted index if present
            abstract = ""
            inverted = work.get('abstract_inverted_index')
            if inverted:
                word_positions = []
                for word, positions in inverted.items():
                    for pos in positions:
                        word_positions.append((pos, word))
                word_positions.sort(key=lambda x: x[0])
                abstract = " ".join([w[1] for w in word_positions])

            # Authors
            authors = []
            for authorship in work.get('authorships', []):
                author_name = authorship.get('author', {}).get('display_name')
                if author_name:
                    authors.append(author_name)

            # Venue / Journal
            primary_loc = work.get('primary_location') or {}
            source = primary_loc.get('source') or {}
            venue_name = source.get('display_name') or work.get('type') or 'Scholarly Publication'

            # Clean DOI
            doi = work.get('doi') or ''
            if doi.startswith('https://doi.org/'):
                doi = doi.replace('https://doi.org/', '')

            title = work.get('display_name') or work.get('title')
            if not title:
                continue

            results.append({
                'title': title,
                'authors': authors[:6],
                'publication_year': work.get('publication_year'),
                'journal': venue_name,
                'doi': doi,
                'url': primary_loc.get('landing_page_url') or (f"https://doi.org/{doi}" if doi else ""),
                'abstract': abstract[:1500] if abstract else "Abstract available via publication source link.",
                'cited_by_count': work.get('cited_by_count', 0),
                'open_access': work.get('open_access', {}).get('is_oa', False),
            })

        return results
    except Exception as e:
        logger.error(f"Error querying OpenAlex: {e}")
        return []
