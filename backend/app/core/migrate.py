import os
import csv
import uuid
import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models import Job, OutreachLog

JOBS_CSV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../job-agent/output/jobs.csv"))
OUTREACH_CSV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../cold_email_parser/outreach_log.csv"))

def parse_date(date_str):
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%d'):
        try:
            return datetime.datetime.strptime(date_str, fmt)
        except ValueError:
            pass
    return datetime.datetime.utcnow()

def migrate_jobs(db: Session):
    if not os.path.exists(JOBS_CSV_PATH):
        print(f"Jobs CSV not found at {JOBS_CSV_PATH}, skipping jobs migration.")
        return

    print(f"Migrating jobs from {JOBS_CSV_PATH}...")
    
    # Pre-load existing URLs from database
    existing_urls = set(u[0] for u in db.query(Job.url).all())
    seen_urls_in_batch = set()

    with open(JOBS_CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            url = row.get('url')
            if not url or url in existing_urls or url in seen_urls_in_batch:
                continue

            job = Job(
                id=str(uuid.uuid4()),
                title=row.get('title', 'Unknown Title'),
                company=row.get('company', 'Unknown Company'),
                location=row.get('location'),
                url=url,
                salary=row.get('salary'),
                description=row.get('description'),
                source=row.get('source', 'Imported'),
                status='New',
                scraped_at=parse_date(row.get('scraped_at', ''))
            )
            db.add(job)
            seen_urls_in_batch.add(url)
            count += 1
            
            if count % 50 == 0:
                db.commit()
                
        db.commit()
        print(f"Successfully migrated {count} jobs.")

def migrate_outreach(db: Session):
    if not os.path.exists(OUTREACH_CSV_PATH):
        print(f"Outreach CSV not found at {OUTREACH_CSV_PATH}, skipping outreach migration.")
        return

    print(f"Migrating outreach logs from {OUTREACH_CSV_PATH}...")
    
    # Pre-load existing logs and track batch duplicates
    existing_logs = set((log.recipient_email, log.sent_at) for log in db.query(OutreachLog).all())
    seen_outreach_in_batch = set()

    with open(OUTREACH_CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            recipient_email = row.get('recipient_email')
            if not recipient_email:
                continue

            timestamp = parse_date(row.get('timestamp', ''))
            
            if (recipient_email, timestamp) in existing_logs or (recipient_email, timestamp) in seen_outreach_in_batch:
                continue

            company = row.get('company', '')
            role = row.get('role', '')
            
            job = db.query(Job).filter(
                Job.company.ilike(company),
                Job.title.ilike(role)
            ).first()

            if not job:
                # Create a placeholder job to link the outreach log to
                job = Job(
                    id=str(uuid.uuid4()),
                    title=role if role else "Unknown Role",
                    company=company if company else "Unknown Company",
                    url=f"imported://outreach-{uuid.uuid4()}",
                    source="Imported",
                    status="Applied",
                    scraped_at=timestamp
                )
                db.add(job)
                db.commit()
                db.refresh(job)

            csv_status = row.get('status', 'Sent')
            db_status = 'Sent'
            if 'fail' in csv_status.lower() or 'error' in csv_status.lower():
                db_status = 'Failed'
            elif 'dry' in csv_status.lower() or 'simulated' in csv_status.lower():
                db_status = 'Simulated'

            log = OutreachLog(
                id=str(uuid.uuid4()),
                job_id=job.id,
                recipient_email=recipient_email,
                recipient_name=row.get('recipient_name', recipient_email.split('@')[0]),
                subject=row.get('subject', 'Outreach'),
                body=row.get('body', f"Cold email for {role} at {company}"),
                status=db_status,
                sent_at=timestamp,
                word_count=int(row.get('word_count', 0)) if row.get('word_count') else None,
                error_message=row.get('error_message')
            )
            db.add(log)
            seen_outreach_in_batch.add((recipient_email, timestamp))
            count += 1
            
            if count % 50 == 0:
                db.commit()
                
        db.commit()
        print(f"Successfully migrated {count} outreach logs.")

def run_migrations():
    # Create tables if they do not exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        migrate_jobs(db)
        migrate_outreach(db)
    finally:
        db.close()

if __name__ == "__main__":
    run_migrations()
