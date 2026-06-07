import os
import json
import logging
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from ..core.config import settings
from ..core.database import get_db
from ..core.models import Job, TailoredResume, OutreachLog
from ..services.outreach.email_generator import EmailGenerator
from ..services.outreach.email_sender import EmailSender
from ..services.outreach.quality_scorer import QualityScorer
from ..services.outreach.spam_checker import SpamChecker
from ..services.tailor.llm_client import call_llm

router = APIRouter()
logger = logging.getLogger("jobflow.outreach")

class DraftRequest(BaseModel):
    job_id: str
    tailored_resume_id: str
    recipient_email: str
    recipient_name: Optional[str] = "Hiring Manager"
    template: Optional[str] = "default"
    use_llm: Optional[bool] = True

class SendRequest(BaseModel):
    outreach_log_id: str
    subject: str
    body: str

# SMTP configuration is now sourced from the centralized settings
# (see app.core.config.Settings for all SMTP fields)

def generate_llm_email(job_title: str, company: str, job_description: str, resume_skills: List[str], recipient_name: str) -> Dict[str, str]:
    """Uses Groq API directly to generate a highly tailored cold email"""
    system_prompt = "You are an expert executive recruiter and job outreach email writer. Write brief, engaging, high-converting cold emails."
    
    user_prompt = f"""Write a cold email to {recipient_name} regarding the '{job_title}' role at '{company}'.
Job Description highlights: {job_description[:500]}
Candidate skills to highlight: {', '.join(resume_skills[:5])}

Rules:
1. Under 150 words.
2. Subject line should be short and attention-grabbing.
3. Be professional, clear, and request a brief chat/profile review.
4. Format response as JSON with:
{{
  "subject": "Email Subject Line",
  "body": "Email Body Text"
}}"""

    try:
        res = call_llm(system_prompt=system_prompt, user_prompt=user_prompt, model="llama-3.1-8b-instant", response_format_json=True)
        return {
            "subject": res.get("subject", f"Outreach: {job_title} role"),
            "body": res.get("body", "")
        }
    except Exception as e:
        logger.error(f"Failed to generate LLM cold email: {e}")
        # Default fallback template
        return {
            "subject": f"Inquiry: {job_title} position",
            "body": f"Hi {recipient_name},\n\nI am reaching out regarding the {job_title} role at {company}. I have experience in {', '.join(resume_skills[:3])}."
        }

@router.post("/draft")
def create_draft(request: DraftRequest, db: Session = Depends(get_db)):
    """Generate email outreach draft based on job details and resume text"""
    # 1. Fetch job description and tailored resume
    job = db.query(Job).filter(Job.id == request.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job listing not found")

    tailored = db.query(TailoredResume).filter(TailoredResume.id == request.tailored_resume_id).first()
    if not tailored:
        raise HTTPException(status_code=404, detail="Tailored resume record not found")

    try:
        tailored_profile = json.loads(tailored.tailored_text)
        skills = tailored_profile.get("skills", [])
        
        # Candidate Info
        contact_name = tailored_profile.get("contact", {}).get("name", "Job Seeker")
        contact_email = tailored_profile.get("contact", {}).get("email", "")
        contact_linkedin = tailored_profile.get("contact", {}).get("linkedin", "")
        
        # Assemble record for Template Generator
        record = {
            "recipient_name": request.recipient_name,
            "company": job.company,
            "role": job.title,
            "candidate_name": contact_name,
            "candidate_background": ", ".join(skills[:4]) if skills else "Software Engineering",
            "portfolio_url": contact_linkedin,
            "personalization_note": f"I was excited to see your postings on {job.source}."
        }

        # 2. Email generation (LLM vs Template)
        email_data = {"subject": "", "body": ""}
        if request.use_llm:
            email_data = generate_llm_email(
                job_title=job.title,
                company=job.company,
                job_description=job.description or "",
                resume_skills=skills,
                recipient_name=request.recipient_name
            )
        else:
            generator = EmailGenerator(template=request.template)
            email_data = generator.generate_email(record)

        # 3. Quality evaluation
        scorer = QualityScorer()
        quality_score = scorer.score_email(email_data)
        
        # 4. Spam check
        spam_checker = SpamChecker()
        spam_risk = spam_checker.check_spam_risk(email_data)

        # 5. Save draft in database
        log = OutreachLog(
            job_id=job.id,
            recipient_email=request.recipient_email,
            recipient_name=request.recipient_name,
            subject=email_data["subject"],
            body=email_data["body"],
            status="Draft",
            word_count=len(email_data["body"].split()),
            quality_score=float(quality_score.get("score", 70)),
            spam_score=float(spam_risk.get("spam_score", 0.0))
        )
        
        db.add(log)
        db.commit()
        db.refresh(log)

        return {
            "outreach_log_id": log.id,
            "subject": log.subject,
            "body": log.body,
            "status": log.status,
            "quality_score": log.quality_score,
            "spam_score": log.spam_score,
            "recommendations": quality_score.get("recommendations", [])
        }

    except Exception as e:
        logger.error(f"Error generating draft: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Drafting failed: {e}")

@router.post("/send")
def send_email(request: SendRequest, db: Session = Depends(get_db)):
    """Dispatch cold email via SMTP socket or dry-run simulation"""
    log = db.query(OutreachLog).filter(OutreachLog.id == request.outreach_log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Outreach log record not found")

    try:
        # Update draft contents with final edits
        log.subject = request.subject
        log.body = request.body
        
        config = settings
        
        if config.DRY_RUN:
            # Simulated sending mode: write draft to simulated_emails folder
            log.status = "Simulated"
            log.sent_at = datetime.datetime.utcnow()
            
            sim_dir = "logs/simulated_emails"
            os.makedirs(sim_dir, exist_ok=True)
            sim_file = os.path.join(sim_dir, f"{log.id}.txt")
            
            with open(sim_file, "w", encoding="utf-8") as f:
                f.write(f"Timestamp: {log.sent_at}\n")
                f.write(f"To: {log.recipient_email} ({log.recipient_name})\n")
                f.write(f"Subject: {log.subject}\n")
                f.write(f"----------------------------------------\n")
                f.write(log.body)
            
            logger.info(f"Simulated email written to {sim_file}")
            
            # Update associated job status
            job = db.query(Job).filter(Job.id == log.job_id).first()
            if job:
                job.status = "Applied"
                
            db.commit()
            return {"status": "simulated", "message": f"Dry-run enabled. Email saved to {sim_file}"}
        
        else:
            # Active SMTP delivery
            sender = EmailSender(config)
            sender.connect()
            success, err_msg = sender.send_email(
                to=log.recipient_email,
                subject=log.subject,
                body=log.body
            )
            sender.disconnect()
            
            if success:
                log.status = "Sent"
                log.sent_at = datetime.datetime.utcnow()
                log.error_message = None
                
                # Update job status
                job = db.query(Job).filter(Job.id == log.job_id).first()
                if job:
                    job.status = "Applied"
            else:
                log.status = "Failed"
                log.error_message = err_msg
                
            db.commit()
            
            if not success:
                raise HTTPException(status_code=502, detail=f"SMTP Send failed: {err_msg}")
            
            return {"status": "sent", "message": "Email dispatched successfully"}

    except Exception as e:
        logger.error(f"Error sending email: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Outreach delivery failed: {e}")

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    """Computes aggregate funnel statistics and timeline distributions"""
    try:
        # Total counts by status
        job_counts = db.query(Job.status, func.count(Job.id)).group_by(Job.status).all()
        outreach_counts = db.query(OutreachLog.status, func.count(OutreachLog.id)).group_by(OutreachLog.status).all()
        
        # Formulate stats dictionary
        job_stats = {status: count for status, count in job_counts}
        outreach_stats = {status: count for status, count in outreach_counts}
        
        # Scraper statistics
        source_counts = db.query(Job.source, func.count(Job.id)).group_by(Job.source).all()
        source_stats = {source: count for source, count in source_counts}
        
        total_scraped = db.query(func.count(Job.id)).scalar() or 0
        total_applied = db.query(func.count(Job.id)).filter(Job.status == "Applied").scalar() or 0
        total_tailored = db.query(func.count(Job.id)).filter(Job.status == "Tailored").scalar() or 0
        
        # Average quality score of sent/simulated emails
        avg_quality = db.query(func.avg(OutreachLog.quality_score)).filter(
            OutreachLog.status.in_(["Sent", "Simulated"])
        ).scalar()
        
        return {
            "jobs": {
                "total": total_scraped,
                "tailored": total_tailored,
                "applied": total_applied,
                "breakdown": job_stats,
                "sources": source_stats
            },
            "outreach": {
                "total": sum(outreach_stats.values()),
                "sent": outreach_stats.get("Sent", 0),
                "simulated": outreach_stats.get("Simulated", 0),
                "drafts": outreach_stats.get("Draft", 0),
                "failed": outreach_stats.get("Failed", 0),
                "average_quality_score": round(float(avg_quality), 2) if avg_quality else 0.0
            }
        }
    except Exception as e:
        logger.error(f"Failed to fetch analytics data: {e}")
        raise HTTPException(status_code=500, detail=f"Database aggregation failed: {e}")
