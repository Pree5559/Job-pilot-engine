import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.models import Job, OutreachLog

from sqlalchemy.pool import StaticPool

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_get_jobs_empty(client):
    response = client.get("/api/jobs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) == 0

def test_create_and_get_job(client, db_session):
    # Seed job
    job = Job(
        title="Python Developer",
        company="Google",
        url="https://google.com/jobs/1",
        source="RemoteOk",
        status="New"
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)

    response = client.get("/api/jobs")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "Python Developer"
    assert response.json()[0]["company"] == "Google"

def test_analytics(client, db_session):
    # Seed outreach log
    job = db_session.query(Job).first()
    log = OutreachLog(
        job_id=job.id,
        recipient_email="recruiter@google.com",
        subject="Application",
        body="Cold email",
        status="Sent",
        quality_score=85.0
    )
    db_session.add(log)
    db_session.commit()

    response = client.get("/api/outreach/analytics")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["jobs"]["total"] == 1
    assert json_data["outreach"]["sent"] == 1
