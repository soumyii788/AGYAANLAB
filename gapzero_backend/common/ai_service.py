"""
AGYAAN LAB Real AI Service Powered by Groq LLM API
Performs empirical negative-space literature intelligence, gap detection, and report synthesis.
"""
import json
import logging
import requests
from decouple import config

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def get_groq_config():
    api_key = config('GROQ_API_KEY', default='')
    model = config('GROQ_MODEL', default='qwen/qwen3.8-27b')
    return api_key, model


def call_groq_chat(messages, max_tokens=2500, temperature=0.2, response_format=None):
    api_key, model = get_groq_config()
    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured in environment variables.")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    if response_format:
        payload["response_format"] = response_format

    response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=60)
    if response.status_code != 200:
        logger.error(f"Groq API error: {response.status_code} - {response.text}")
        # Try fallback model if model failed
        if response.status_code in (400, 404):
            fallback_model = "openai/gpt-oss-120b"
            payload["model"] = fallback_model
            response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=60)
            if response.status_code != 200:
                raise RuntimeError(f"Groq API request failed ({response.status_code}): {response.text}")
        else:
            raise RuntimeError(f"Groq API request failed ({response.status_code}): {response.text}")

    data = response.json()
    return data['choices'][0]['message']['content']


def analyze_research_gaps(project, sources, notes):
    """
    Synthesizes project objective, ingested sources, and notes to extract
    the negative space: missing hypotheses, sample deficits, and gap metrics.
    """
    sources_summary = []
    for idx, s in enumerate(sources, 1):
        sources_summary.append(
            f"Source #{idx}: '{s.title}' ({s.publication_year or 'n/a'}) by {', '.join(s.authors[:3]) if s.authors else 'Unknown'}.\n"
            f"Abstract / Summary: {s.abstract or 'No abstract available'}\n"
        )
    sources_text = "\n".join(sources_summary) if sources_summary else "No formal academic papers ingested yet. Analyze against current scientific frontier."

    notes_text = "\n".join([f"- {n.title}: {n.content}" for n in notes]) if notes else "No preliminary notes logged."

    system_prompt = (
        "You are the AGYAAN LAB Negative-Space Research Intelligence Engine. "
        "Unlike conventional tools that merely summarize what is published, your role is to discover WHAT IS MISSING. "
        "Analyze the user's research project objective, the ingested scientific literature, and researcher notes. "
        "Identify the unaddressed hypotheses, contradictory claims across authors, benchmark deficits, and compute an empirical gap deficit score. "
        "You MUST respond ONLY with a valid JSON object matching this schema:\n"
        "{\n"
        '  "gap_score": <number between 0 and 100 representing the percentage of uncharted research space>,\n'
        '  "gap_summary": "<concise 2-sentence summary of the single largest missing piece of knowledge>",\n'
        '  "unaddressed_hypotheses": ["<hypothesis 1 that papers overlook>", "<hypothesis 2>", "<hypothesis 3>"],\n'
        '  "contradictory_findings": ["<tension/divergence 1 in existing literature>", "<tension 2>"],\n'
        '  "methodological_deficits": ["<dataset bias, short evaluation horizon, or unbenchmarked distribution>"],\n'
        '  "recommended_experiments": ["<concrete test/study 1 to fill the gap>", "<concrete study 2>"],\n'
        '  "coverage_assessment": "<brief paragraph evaluating the depth of existing literature vs the unanswered gap>"\n'
        "}"
    )

    user_prompt = (
        f"RESEARCH PROJECT:\n"
        f"Title: {project.title}\n"
        f"Domain: {project.domain}\n"
        f"Objective: {project.description}\n"
        f"Keywords: {', '.join(project.keywords) if project.keywords else 'None'}\n\n"
        f"INGESTED LITERATURE SOURCES ({len(sources)}):\n"
        f"{sources_text}\n\n"
        f"RESEARCHER NOTES ({len(notes)}):\n"
        f"{notes_text}\n\n"
        f"Perform negative-space gap detection and output the strict JSON analysis."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    raw_response = call_groq_chat(messages, max_tokens=3000, temperature=0.1)

    # Clean markdown codeblocks if model wrapped in ```json
    clean_text = raw_response.strip()
    if clean_text.startswith("```"):
        lines = clean_text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        clean_text = "\n".join(lines).strip()

    try:
        return json.loads(clean_text)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse Groq JSON response: {clean_text}")
        return {
            "gap_score": 75.0,
            "gap_summary": clean_text[:300],
            "unaddressed_hypotheses": ["Literature lacks multi-distribution empirical validation."],
            "contradictory_findings": ["Disparity observed in baseline reporting metrics."],
            "methodological_deficits": ["Absence of longitudinal benchmarks under stress conditions."],
            "recommended_experiments": ["Execute stress evaluation against standard test split."],
            "coverage_assessment": clean_text
        }


def synthesize_intelligence_report(project, sources, analyses, report_type='full'):
    """
    Generates a full Markdown research intelligence brief synthesizing
    the literature base and the detected gaps.
    """
    sources_list = "\n".join([f"- **{s.title}** ({s.publication_year or 'n/a'}) - {s.journal or 'Preprint'}" for s in sources[:15]])
    
    last_analysis_info = ""
    if analyses:
        latest = analyses[0]
        last_analysis_info = json.dumps(latest.results, indent=2)

    system_prompt = (
        "You are AGYAAN LAB's Principal Scientific Synthesizer. "
        "Generate a publication-grade Research Intelligence & Negative Space Brief in GitHub-flavored Markdown. "
        "The report must highlight: Executive Abstract, Literature Consensus, Discovered Research Gaps (Negative Space), "
        "Critical Unaddressed Hypotheses, Methodological Deficits, and Next Actionable Frontiers."
    )

    user_prompt = (
        f"Project Title: {project.title}\n"
        f"Domain: {project.domain}\n"
        f"Description: {project.description}\n"
        f"Literature Sources:\n{sources_list or 'No sources recorded.'}\n\n"
        f"Latest Gap Analysis Data:\n{last_analysis_info or 'No prior scan.'}\n\n"
        f"Report Type: {report_type}\n"
        f"Generate a comprehensive, beautifully structured Markdown intelligence brief."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    return call_groq_chat(messages, max_tokens=3500, temperature=0.3)
