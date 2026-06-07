import re
import logging
from typing import List, Dict, Any, Optional
from .llm_client import call_llm
from .truthfulness import evaluate_truthfulness

logger = logging.getLogger(__name__)

# --- PROMPT DEFINITIONS ---

JD_EXTRACTION_SYSTEM_PROMPT = """You are a job description parser. Extract structured data from the following job description. Return valid JSON matching the schema below. Do not infer information not present in the text.

Schema:
{
  "jobTitle": string (the exact job title),
  "company": string | null (company name if present),
  "requiredSkills": string[] (skills explicitly listed as required),
  "preferredSkills": string[] (skills listed as preferred, nice-to-have, or plus),
  "responsibilities": string[] (job responsibilities/duties),
  "qualifications": string[] (requirements/qualifications listed),
  "tools": string[] (tools, technologies, platforms mentioned),
  "keywords": string[] (important keywords, domain terms, buzzwords),
  "seniorityLevel": string | null (e.g., "Senior", "Lead", "Junior", "Entry Level"),
  "domainSignals": string[] (industry domain signals like "SaaS", "Enterprise", "Healthcare")
}

Rules:
- Extract exact job title as written
- Distinguish required vs preferred skills based on context clues ("must have" vs "nice to have")
- Do not invent or infer skills not explicitly mentioned
- Return empty arrays for any field with no matches
- If seniority is not clear, return null"""

def build_jd_extraction_user_prompt(jd_text: str) -> str:
    return f"""Extract structured data from this job description:

---JOB DESCRIPTION---
{jd_text}
---END JOB DESCRIPTION---

Return the data as a valid JSON object matching the specified schema."""


RESUME_PARSER_SYSTEM_PROMPT = """You are a resume parser. Convert the following resume text into structured JSON. Preserve exact bullet content. Identify logical sections (experience, education, skills, etc.). Handle non-standard section headers flexibly. Do not modify or rewrite content—parse only.

Schema:
{
  "contact": {
    "name": string | null,
    "email": string | null,
    "phone": string | null,
    "linkedin": string | null,
    "website": string | null,
    "location": string | null
  },
  "summary": string | null (professional summary if present),
  "skills": string[] (list of skills mentioned),
  "experience": [
    {
      "company": string,
      "title": string (job title),
      "startDate": string | null,
      "endDate": string | null,
      "bullets": string[] (exact bullet points)
    }
  ],
  "projects": [
    {
      "name": string,
      "description": string | null,
      "technologies": string[] | null,
      "bullets": string[] | null
    }
  ],
  "education": [
    {
      "institution": string,
      "degree": string | null,
      "field": string | null,
      "graduationDate": string | null
    }
  ],
  "certifications": [
    {
      "name": string,
      "issuer": string | null,
      "date": string | null
    }
  ]
}

Rules:
- Preserve the exact wording of every bullet point
- Map non-standard section headers to the closest standard section
- If a section doesn't exist in the resume, return an empty array
- Do not rewrite, improve, or modify any content"""

def build_resume_parser_user_prompt(resume_text: str) -> str:
    return f"""Parse this resume text into structured JSON:

---RESUME---
{resume_text}
---END RESUME---

Return the data as valid JSON matching the specified schema. Preserve all original wording exactly."""


MATCH_SCORING_SYSTEM_PROMPT = """You are a resume-job match scorer. Compare the resume against the job description and generate a match score (0-100) for each category. Be conservative—do not inflate scores. Base all scoring on evidence from both documents.

Schema:
{
  "responsibilityAlignmentScore": number (0-100),
  "criticalMissingRequirements": string[],
  "explanation": string
}

Rules:
- responsibilityAlignmentScore: how many JD responsibilities are addressed in resume bullets (0-100)
- List specific missing requirements with evidence from the JD
- Keep explanation concise (2-4 sentences)
- Be conservative—prefer lower scores when uncertain"""

def build_match_scoring_user_prompt(resume: str, jd: str) -> str:
    return f"""Compare this resume against the job description and generate match scores.

---RESUME (JSON)---
{resume}
---END RESUME---

---JOB DESCRIPTION (JSON)---
{jd}
---END JOB DESCRIPTION---

Return a valid JSON object with scores and explanation."""


GAP_ANALYSIS_SYSTEM_PROMPT = """You are a gap analysis engine. Identify skills, tools, and requirements from the job description that are missing or weakly represented in the resume. Assign importance based on JD emphasis. Provide actionable suggestions.

Return a JSON object with this schema:
{
  "gaps": [
    {
      "name": string (name of the gap),
      "importance": "high" | "medium" | "low",
      "jdEvidence": string (what the JD says about this requirement),
      "resumeEvidence": string (what the resume shows or doesn't show),
      "suggestedAction": string (actionable suggestion),
      "canSafelyAdd": boolean (can the user add this without fabrication)
    }
  ]
}

Rules:
- High importance: required skills or qualifications that are completely missing
- Medium importance: preferred skills, tools, or responsibilities that are weakly addressed
- Low importance: nice-to-haves or minor gaps
- canSafelyAdd = true only if the resume already hints at related experience
- canSafelyAdd = false for hard skills with zero evidence in the resume
- Suggest honest actions like "Prepare to address this in interview" for things that can't be fabricated"""

def build_gap_analysis_user_prompt(resume_json: str, jd_json: str) -> str:
    return f"""Analyze gaps between this resume and job description.

---RESUME (JSON)---
{resume_json}
---END RESUME---

---JOB DESCRIPTION (JSON)---
{jd_json}
---END JOB DESCRIPTION---

Identify missing or weakly represented skills, tools, and requirements. Return a JSON object matching the specified schema."""


BULLET_REWRITER_SYSTEM_PROMPT = """You are a resume bullet rewriter. Rewrite each resume bullet to better align with the job description while preserving the user's actual meaning and experience. Do not add unsupported claims. For each rewrite: explain the change, list keywords addressed, assign confidence (high/medium/low), and flag if the rewrite risks overstating experience.

Return a JSON array of objects with this schema:
[
  {
    "original": string (exact original bullet text),
    "tailored": string (rewritten bullet),
    "changeReason": string (brief explanation of what changed and why),
    "keywordsAddressed": string[] (JD keywords this rewrite targets),
    "confidence": "high" | "medium" | "low",
    "riskFlag": string | null (if confidence is low, explain why)
  }
]

Rules (CRITICAL):
- NEVER invent experience the user doesn't have
- NEVER add employers, degrees, or certifications not in the original
- NEVER add specific metrics or numbers not present in the original
- Preserve the user's actual meaning and experience
- Use stronger action verbs where appropriate (e.g., "Built" -> "Developed" or "Architected")
- Include JD-relevant terminology ONLY if it truthfully reflects the original experience
- Preserve any measurable impact present in the original
- If a bullet is already well-aligned, return it unchanged with confidence "high"
- If uncertain about a rewrite, set confidence to "low" with a riskFlag explaining why"""

def build_bullet_rewriter_user_prompt(original_bullets: List[str], resume_json: str, jd_json: str) -> str:
    bullets_formatted = "\n".join([f"{i + 1}. {b}" for i, b in enumerate(original_bullets)])
    return f"""Rewrite these resume bullets to better align with the job description.

---ORIGINAL BULLETS---
{bullets_formatted}
---END ORIGINAL BULLETS---

---RESUME (JSON)---
{resume_json}
---END RESUME---

---JOB DESCRIPTION (JSON)---
{jd_json}
---END JOB DESCRIPTION---

Return a JSON array of rewritten bullets following the specified schema."""


# --- ALGORITHMIC SCORING HELPERS ---

def jaccard_similarity(a: List[str], b: List[str]) -> float:
    if len(a) == 0 and len(b) == 0:
        return 1.0
    if len(a) == 0 or len(b) == 0:
        return 0.0
    set_a = set(s.lower().strip() for s in a)
    set_b = set(s.lower().strip() for s in b)
    intersection = set_a.intersection(set_b)
    union = set_a.union(set_b)
    return len(intersection) / len(union)

def compute_skill_coverage(resume: Dict[str, Any], jd: Dict[str, Any]) -> int:
    resume_skills = resume.get("skills", [])
    required_skills = jd.get("requiredSkills", [])
    preferred_skills = jd.get("preferredSkills", [])
    
    required_score = jaccard_similarity(resume_skills, required_skills) * 100
    preferred_score = jaccard_similarity(resume_skills, preferred_skills) * 100
    return int(round(required_score * 0.7 + preferred_score * 0.3))

def compute_keyword_score(resume: Dict[str, Any], jd: Dict[str, Any]) -> int:
    keywords = jd.get("keywords", [])
    if len(keywords) == 0:
        return 0

    flat_bullets = []
    for exp in resume.get("experience", []):
        flat_bullets.append(exp.get("title", ""))
        flat_bullets.extend(exp.get("bullets", []))

    resume_text = " ".join([
        resume.get("summary", "") or "",
        " ".join(resume.get("skills", [])),
        " ".join(flat_bullets)
    ]).lower()

    matched = 0
    for kw in keywords:
        if kw.lower() in resume_text:
            matched += 1

    return int(round((matched / len(keywords)) * 100))

def compute_seniority_score(resume: Dict[str, Any], jd: Dict[str, Any]) -> int:
    jd_level = jd.get("seniorityLevel")
    if not jd_level:
        return 50 # neutral default

    jd_level = jd_level.lower()
    resume_titles = " ".join([exp.get("title", "").lower() for exp in resume.get("experience", [])])
    
    seniority_signals = ["senior", "lead", "principal", "staff", "head", "architect"]
    has_seniority = any(sig in resume_titles for sig in seniority_signals)

    if ("senior" in jd_level and has_seniority) or ("lead" in jd_level and has_seniority) or ("junior" in jd_level and not has_seniority):
        return 100
    if has_seniority:
        return 50
    return 0

def estimate_experience_years(resume: Dict[str, Any]) -> int:
    total_years = 0
    year_pattern = re.compile(r'\b(19\d{2}|20\d{2})\b')
    current_year = 2026 # Syncing current local time is 2026-06-07

    for exp in resume.get("experience", []):
        start_date = exp.get("startDate", "") or ""
        end_date = exp.get("endDate", "") or ""
        
        start_match = year_pattern.search(start_date)
        end_match = year_pattern.search(end_date)
        
        start_year = int(start_match.group(1)) if start_match else None
        
        if "present" in end_date.lower() or "current" in end_date.lower() or not end_match:
            end_year = current_year
        else:
            end_year = int(end_match.group(1)) if end_match else current_year

        if start_year and end_year >= start_year:
            total_years += (end_year - start_year)

    return total_years if total_years > 0 else 5 # default 5

def estimate_jd_experience_years(jd: Dict[str, Any]) -> int:
    all_text = " ".join([
        jd.get("jobTitle", ""),
        " ".join(jd.get("qualifications", [])),
        " ".join(jd.get("responsibilities", []))
    ])
    match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)', all_text, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return 5 # default 5


# --- CORE SERVICE INTERFACES ---

def parse_jd_service(jd_text: str) -> Dict[str, Any]:
    """Parse raw job description text into structured JSON"""
    try:
        parsed_data = call_llm(
            system_prompt=JD_EXTRACTION_SYSTEM_PROMPT,
            user_prompt=build_jd_extraction_user_prompt(jd_text),
            model="llama-3.1-8b-instant"
        )
        return parsed_data
    except Exception as e:
        logger.error(f"Error parsing job description: {e}")
        # Return a simple mock structure as fallback
        return {
            "jobTitle": "Software Engineer",
            "company": None,
            "requiredSkills": [],
            "preferredSkills": [],
            "responsibilities": [],
            "qualifications": [],
            "tools": [],
            "keywords": [],
            "seniorityLevel": None,
            "domainSignals": []
        }

def parse_resume_service(resume_text: str) -> Dict[str, Any]:
    """Parse raw resume text into structured JSON"""
    try:
        parsed_data = call_llm(
            system_prompt=RESUME_PARSER_SYSTEM_PROMPT,
            user_prompt=build_resume_parser_user_prompt(resume_text),
            model="llama-3.3-70b-versatile"
        )
        return parsed_data
    except Exception as e:
        logger.error(f"Error parsing resume: {e}")
        raise e

def compute_match_score(resume: Dict[str, Any], jd: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate the ATS and keyword match scores, using LLM for qualitative responsibilities alignment"""
    skill_coverage = compute_skill_coverage(resume, jd)
    keyword_score = compute_keyword_score(resume, jd)
    seniority_score = compute_seniority_score(resume, jd)
    
    resume_years = estimate_experience_years(resume)
    jd_years = estimate_jd_experience_years(jd)
    experience_score = int(round((min(resume_years, jd_years) / max(jd_years, 1)) * 100))

    try:
        # LLM scoring
        llm_scoring_raw = call_llm(
            system_prompt=MATCH_SCORING_SYSTEM_PROMPT,
            user_prompt=build_match_scoring_user_prompt(str(resume), str(jd)),
            model="llama-3.1-8b-instant"
        )
    except Exception as e:
        logger.error(f"LLM match scoring failed, using defaults: {e}")
        llm_scoring_raw = {
            "responsibilityAlignmentScore": 50,
            "criticalMissingRequirements": [],
            "explanation": "Scored using algorithmic fallback."
        }

    resp_alignment = llm_scoring_raw.get("responsibilityAlignmentScore", 50)
    missing_reqs = llm_scoring_raw.get("criticalMissingRequirements", [])
    explanation = llm_scoring_raw.get("explanation", "")

    # Calculate overall weighted score
    overall = int(round(
        skill_coverage * 0.4 +
        resp_alignment * 0.25 +
        keyword_score * 0.15 +
        seniority_score * 0.1 +
        experience_score * 0.1 -
        len(missing_reqs) * 3
    ))
    overall = min(100, max(0, overall))

    return {
        "overallScore": overall,
        "skillCoverageScore": skill_coverage,
        "responsibilityAlignmentScore": resp_alignment,
        "keywordScore": keyword_score,
        "seniorityScore": seniority_score,
        "experienceYearsScore": experience_score,
        "criticalMissingRequirements": missing_reqs,
        "explanation": explanation
    }

def analyze_gaps_service(resume: Dict[str, Any], jd: Dict[str, Any]) -> Dict[str, Any]:
    """Call the LLM gap analyzer to detect requirements missing in resume"""
    try:
        gaps_data = call_llm(
            system_prompt=GAP_ANALYSIS_SYSTEM_PROMPT,
            user_prompt=build_gap_analysis_user_prompt(str(resume), str(jd)),
            model="llama-3.1-8b-instant"
        )
        return gaps_data
    except Exception as e:
        logger.error(f"Error performing gap analysis: {e}")
        return {"gaps": []}

def tailor_resume_bullets(resume: Dict[str, Any], jd: Dict[str, Any]) -> Dict[str, Any]:
    """Tailor experience bullet points and evaluate truthfulness flags"""
    tailored_experience = []
    all_risk_flags = []

    # Process experience jobs and their bullet lists
    for exp_idx, exp in enumerate(resume.get("experience", [])):
        company = exp.get("company", "")
        title = exp.get("title", "")
        bullets = exp.get("bullets", [])
        
        if not bullets:
            tailored_experience.append({
                "company": company,
                "title": title,
                "startDate": exp.get("startDate"),
                "endDate": exp.get("endDate"),
                "bullets": []
            })
            continue

        try:
            # LLM call to tailor this block of bullets
            rewritten_bullets_list = call_llm(
                system_prompt=BULLET_REWRITER_SYSTEM_PROMPT,
                user_prompt=build_bullet_rewriter_user_prompt(bullets, str(resume), str(jd)),
                model="llama-3.3-70b-versatile",
                response_format_json=True
            )
            
            # Normalize response if LLM returned an object wrapping the array
            if isinstance(rewritten_bullets_list, dict):
                found_list = None
                for val in rewritten_bullets_list.values():
                    if isinstance(val, list):
                        found_list = val
                        break
                if found_list is not None:
                    rewritten_bullets_list = found_list
                else:
                    if "tailored" in rewritten_bullets_list or "original" in rewritten_bullets_list:
                        rewritten_bullets_list = [rewritten_bullets_list]
                    else:
                        rewritten_bullets_list = []
            
            if not isinstance(rewritten_bullets_list, list) or not rewritten_bullets_list:
                raise ValueError("Invalid format returned by LLM (expected non-empty array)")

        except Exception as e:
            logger.error(f"Failed to rewrite bullets for {company}: {e}")
            # Fallback to original bullets
            rewritten_bullets_list = [
                {
                    "original": b,
                    "tailored": b,
                    "changeReason": f"LLM tailer failed ({e}). Kept original.",
                    "keywordsAddressed": [],
                    "confidence": "high",
                    "riskFlag": None
                } for b in bullets
            ]

        # Extract tailored texts and check truthfulness flags
        tailored_bullets = []
        for bullet_idx, item in enumerate(rewritten_bullets_list):
            tailored_text = item.get("tailored", item.get("original", ""))
            tailored_bullets.append(tailored_text)

            # Heuristic truthfulness audit
            flags = evaluate_truthfulness(resume, tailored_text, exp_idx, bullet_idx)
            for f in flags:
                # Add descriptions from LLM riskFlag if present
                if item.get("riskFlag"):
                    f.description += f" [LLM Note: {item.get('riskFlag')}]"
                all_risk_flags.append(f.to_dict())

        tailored_experience.append({
            "company": company,
            "title": title,
            "startDate": exp.get("startDate"),
            "endDate": exp.get("endDate"),
            "bullets": tailored_bullets,
            "changes_explanation": rewritten_bullets_list # Save audit trail
        })

    # Build tailored resume profile
    tailored_resume_profile = {
        "contact": resume.get("contact"),
        "summary": resume.get("summary"),
        "skills": resume.get("skills"),
        "experience": tailored_experience,
        "projects": resume.get("projects", []),
        "education": resume.get("education", []),
        "certifications": resume.get("certifications", [])
    }

    return {
        "tailored_resume": tailored_resume_profile,
        "risk_flags": all_risk_flags
    }
