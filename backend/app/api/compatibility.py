import logging
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.tailor.tailor_service import (
    parse_resume_service,
    parse_jd_service,
    compute_match_score,
    analyze_gaps_service,
    tailor_resume_bullets,
    call_llm,
    build_bullet_rewriter_user_prompt,
    BULLET_REWRITER_SYSTEM_PROMPT
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Request models
class ParseRequest(BaseModel):
    text: str

class ScoreRequest(BaseModel):
    resume: Dict[str, Any]
    jd: Dict[str, Any]

class GapsRequest(BaseModel):
    resume: Dict[str, Any]
    jd: Dict[str, Any]

class TailorRequest(BaseModel):
    resume: Dict[str, Any]
    jd: Dict[str, Any]
    score: Dict[str, Any]

@router.post("/parse-resume")
def parse_resume(request: ParseRequest):
    try:
        return parse_resume_service(request.text)
    except Exception as e:
        logger.error(f"Error in compatibility parse-resume: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/parse-jd")
def parse_jd(request: ParseRequest):
    try:
        return parse_jd_service(request.text)
    except Exception as e:
        logger.error(f"Error in compatibility parse-jd: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/score")
def score_match(request: ScoreRequest):
    try:
        return compute_match_score(request.resume, request.jd)
    except Exception as e:
        logger.error(f"Error in compatibility score: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/gaps")
def analyze_gaps(request: GapsRequest):
    try:
        return analyze_gaps_service(request.resume, request.jd)
    except Exception as e:
        logger.error(f"Error in compatibility gaps: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tailor")
def tailor_resume(request: TailorRequest):
    try:
        # LLM call for summary rewriter
        from ..services.tailor.tailor_service import build_summary_rewriter_user_prompt
        summary_raw = call_llm(
            system_prompt="You are a professional resume rewriter.",
            user_prompt=build_summary_rewriter_user_prompt(
                request.resume.get("summary", ""),
                str(request.resume),
                str(request.jd)
            ),
            model="llama-3.1-8b-instant"
        )
        tailored_summary = summary_raw.get("summary", request.resume.get("summary", ""))

        # Tailor experience bullets
        tailored_experience = []
        for exp in request.resume.get("experience", []):
            bullets = exp.get("bullets", [])
            if not bullets:
                tailored_experience.append({
                    "company": exp.get("company", ""),
                    "title": exp.get("title", ""),
                    "bullets": []
                })
                continue

            try:
                rewritten_bullets_list = call_llm(
                    system_prompt=BULLET_REWRITER_SYSTEM_PROMPT,
                    user_prompt=build_bullet_rewriter_user_prompt(bullets, str(request.resume), str(request.jd)),
                    model="llama-3.3-70b-versatile"
                )
            except Exception as e:
                logger.error(f"Failed to tailor compatibility bullets: {e}")
                # Fallback format
                rewritten_bullets_list = [
                    {
                        "original": b,
                        "tailored": b,
                        "changeReason": "LLM tailoring failed. Retained original.",
                        "keywordsAddressed": [],
                        "confidence": "high",
                        "riskFlag": None
                    } for b in bullets
                ]

            tailored_experience.append({
                "company": exp.get("company", ""),
                "title": exp.get("title", ""),
                "bullets": rewritten_bullets_list
            })

        return {
            "tailoredSummary": tailored_summary,
            "tailoredSkills": request.resume.get("skills", []),
            "tailoredExperience": tailored_experience
        }

    except Exception as e:
        logger.error(f"Error in compatibility tailor: {e}")
        raise HTTPException(status_code=500, detail=str(e))
