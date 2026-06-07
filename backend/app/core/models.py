import datetime
import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, nullable=True)
    url = Column(String, unique=True, nullable=False)
    salary = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    source = Column(String, nullable=False)  # 'Naukri', 'Wellfound', 'RemoteOk'
    status = Column(String, default="New")  # 'New', 'Tailored', 'Applied', 'Rejected'
    scraped_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    tailored_resumes = relationship("TailoredResume", back_populates="job", cascade="all, delete-orphan")
    outreach_logs = relationship("OutreachLog", back_populates="job", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    original_text = Column(Text, nullable=False)
    parsed_json = Column(Text, nullable=True)  # JSON-stringified parsed details
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    tailored_resumes = relationship("TailoredResume", back_populates="resume", cascade="all, delete-orphan")


class TailoredResume(Base):
    __tablename__ = "tailored_resumes"

    id = Column(String, primary_key=True, default=generate_uuid)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(String, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    tailored_text = Column(Text, nullable=False)
    tailoring_changes_json = Column(Text, nullable=True)  # JSON-stringified diff/rationale
    ats_score = Column(Float, nullable=True)
    truthfulness_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="tailored_resumes")
    resume = relationship("Resume", back_populates="tailored_resumes")


class OutreachLog(Base):
    __tablename__ = "outreach_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    recipient_email = Column(String, nullable=False)
    recipient_name = Column(String, nullable=True)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String, default="Draft")  # 'Draft', 'Pending', 'Sent', 'Failed', 'Simulated'
    sent_at = Column(DateTime, nullable=True)
    word_count = Column(Integer, nullable=True)
    quality_score = Column(Float, nullable=True)
    spam_score = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)

    # Relationships
    job = relationship("Job", back_populates="outreach_logs")
