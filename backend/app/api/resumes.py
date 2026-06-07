import json
import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..core.database import get_db
from ..core.models import Resume, Job, TailoredResume
from ..services.tailor.tailor_service import (
    parse_resume_service,
    compute_match_score,
    analyze_gaps_service,
    tailor_resume_bullets
)

router = APIRouter()
logger = logging.getLogger(__name__)

class TailorRequest(BaseModel):
    job_id: str
    resume_id: str

@router.post("/upload")
async def upload_resume(
    name: str = Form(...),
    text_content: str = Form(...),
    db: Session = Depends(get_db)
):
    """Upload resume text and parse it into structured JSON"""
    try:
        # Call parser service to structure the resume
        parsed_json = parse_resume_service(text_content)
        
        resume = Resume(
            name=name,
            original_text=text_content,
            parsed_json=json.dumps(parsed_json)
        )
        
        db.add(resume)
        db.commit()
        db.refresh(resume)
        
        return {
            "id": resume.id,
            "name": resume.name,
            "parsed_json": parsed_json,
            "created_at": resume.created_at
        }
    except Exception as e:
        logger.error(f"Failed to upload and parse resume: {e}")
        raise HTTPException(status_code=500, detail=f"Parsing error: {e}")

@router.post("/tailor")
def tailor_resume(request: TailorRequest, db: Session = Depends(get_db)):
    """Analyze a resume against a job listing, compute ATS compatibility, and output tailored details"""
    # 1. Fetch job description and original resume details
    job = db.query(Job).filter(Job.id == request.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job listing not found")

    resume = db.query(Resume).filter(Resume.id == request.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume record not found")

    try:
        # Parse job details and resume content
        resume_data = json.loads(resume.parsed_json)
        
        # We need a structured job description (JD) profile.
        # If the job description is not already parsed, parse it.
        # We can extract the description text from the job entry.
        from ..services.tailor.tailor_service import parse_jd_service
        jd_text = job.description or f"{job.title} at {job.company}. Location: {job.location or ''}"
        jd_data = parse_jd_service(jd_text)

        # 2. Score compatibility
        score_data = compute_match_score(resume_data, jd_data)

        # 3. Analyze gaps
        gap_data = analyze_gaps_service(resume_data, jd_data)

        # 4. Tailor Experience Bullet Points
        tailored_data = tailor_resume_bullets(resume_data, jd_data)

        # Save to database
        tailored_record = TailoredResume(
            job_id=job.id,
            resume_id=resume.id,
            tailored_text=json.dumps(tailored_data["tailored_resume"]),
            tailoring_changes_json=json.dumps({
                "changes": tailored_data["tailored_resume"]["experience"],
                "gaps": gap_data.get("gaps", []),
                "explanation": score_data.get("explanation", ""),
                "risk_flags": tailored_data["risk_flags"]
            }),
            ats_score=float(score_data["overallScore"]),
            truthfulness_score=100.0 - (len(tailored_data["risk_flags"]) * 10) # Simple deduction index
        )

        # Update Job Status to reflect tailoring
        job.status = "Tailored"
        
        db.add(tailored_record)
        db.commit()
        db.refresh(tailored_record)

        return {
            "tailored_resume_id": tailored_record.id,
            "ats_score": tailored_record.ats_score,
            "truthfulness_score": tailored_record.truthfulness_score,
            "gap_analysis": gap_data,
            "tailored_resume": tailored_data["tailored_resume"],
            "risk_flags": tailored_data["risk_flags"]
        }

    except Exception as e:
        logger.error(f"Error during tailoring process: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Tailoring failed: {e}")

@router.get("/tailored/{tailored_id}")
def get_tailored_resume(tailored_id: str, db: Session = Depends(get_db)):
    """Fetch tailored resume specifications by ID"""
    record = db.query(TailoredResume).filter(TailoredResume.id == tailored_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Tailored resume record not found")
        
    return {
        "id": record.id,
        "job_id": record.job_id,
        "resume_id": record.resume_id,
        "tailored_resume": json.loads(record.tailored_text),
        "audit_data": json.loads(record.tailoring_changes_json),
        "ats_score": record.ats_score,
        "truthfulness_score": record.truthfulness_score,
        "created_at": record.created_at
    }

@router.get("/")
def get_all_resumes(db: Session = Depends(get_db)):
    """List all uploaded master resumes"""
    resumes = db.query(Resume).order_by(Resume.created_at.desc()).all()
    return [{
        "id": r.id,
        "name": r.name,
        "created_at": r.created_at
    } for r in resumes]
