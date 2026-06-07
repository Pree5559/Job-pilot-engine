import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
import datetime

from ..core.database import get_db
from ..core.models import Job
from ..services.scrapers.naukri_scraper import NaukriScraper
from ..services.scrapers.remoteok_scraper import RemoteOkScraper
from ..services.scrapers.wellfound_scraper import WellfoundScraper
from ..services.scrapers.job_filter import JobFilter

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic schemas for request/response validation
class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    location: Optional[str] = None
    url: str
    salary: Optional[str] = None
    description: Optional[str] = None
    source: str
    status: str
    scraped_at: datetime.datetime

    class Config:
        from_attributes = True

class SyncRequest(BaseModel):
    keywords: List[str]
    location: Optional[str] = ""

class StatusUpdateRequest(BaseModel):
    status: str

def run_sync_scrapers(keywords: List[str], location: str, db_session_factory):
    """Background task to run scrapers and save findings to database"""
    db = db_session_factory()
    try:
        logger.info(f"Starting background scraper sync for keywords={keywords}, location={location}")
        all_scraped_jobs = []

        # 1. Naukri Scraper
        try:
            naukri = NaukriScraper()
            for kw in keywords:
                jobs = naukri.fetch_jobs(keywords=kw, location=location)
                all_scraped_jobs.extend(jobs)
        except Exception as e:
            logger.error(f"Naukri scraping failed: {e}")

        # 2. RemoteOk Scraper
        try:
            remoteok = RemoteOkScraper()
            for kw in keywords:
                jobs = remoteok.fetch_jobs(keywords=kw)
                all_scraped_jobs.extend(jobs)
        except Exception as e:
            logger.error(f"RemoteOk scraping failed: {e}")

        # 3. Wellfound Scraper (Firecrawl)
        try:
            wellfound = WellfoundScraper()
            for kw in keywords:
                jobs = wellfound.fetch_jobs(job_role=kw, location=location)
                all_scraped_jobs.extend(jobs)
        except Exception as e:
            logger.error(f"Wellfound scraping failed: {e}")

        # Deduplicate results using our JobFilter helper
        unique_jobs = JobFilter.remove_duplicates(all_scraped_jobs)
        logger.info(f"Scraped {len(all_scraped_jobs)} total jobs. {len(unique_jobs)} unique after filter.")

        # Save unique jobs to SQLite DB
        new_jobs_count = 0
        for job in unique_jobs:
            # Check if job url already exists in DB
            existing = db.query(Job).filter(Job.url == job.url).first()
            if not existing:
                # Assign a fresh ID and insert
                db.add(job)
                new_jobs_count += 1
        
        db.commit()
        logger.info(f"Sync complete. Inserted {new_jobs_count} new jobs.")
    except Exception as e:
        logger.error(f"Error in run_sync_scrapers task: {e}")
    finally:
        db.close()

@router.get("/", response_model=List[JobResponse])
def get_jobs(
    status: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Job)
    if status:
        query = query.filter(Job.status == status)
    if source:
        query = query.filter(Job.source == source)
    if search:
        query = query.filter(
            (Job.title.ilike(f"%{search}%")) | 
            (Job.company.ilike(f"%{search}%")) |
            (Job.location.ilike(f"%{search}%")) |
            (Job.description.ilike(f"%{search}%"))
        )
    
    return query.order_by(Job.scraped_at.desc()).offset(offset).limit(limit).all()

@router.post("/sync")
def sync_jobs(request: SyncRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Run the scraping operation asynchronously
    # We pass the SessionLocal creator to open a thread-safe database connection inside the worker thread
    from ..core.database import SessionLocal
    background_tasks.add_task(run_sync_scrapers, request.keywords, request.location, SessionLocal)
    return {"status": "sync_started", "message": "Scrapers are running in the background"}

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job listing not found")
    return job

@router.put("/{job_id}/status", response_model=JobResponse)
def update_job_status(job_id: str, request: StatusUpdateRequest, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job listing not found")
    job.status = request.status
    db.commit()
    db.refresh(job)
    return job

@router.delete("/{job_id}")
def delete_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job listing not found")
    db.delete(job)
    db.commit()
    return {"status": "success", "message": "Job deleted successfully"}
