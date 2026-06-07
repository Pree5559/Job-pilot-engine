import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

from .core.config import settings
from .core.logging_config import setup_logging
from .core.database import Base, engine
from .core.migrate import run_migrations
from .api import jobs, resumes, outreach, compatibility

# Initialize centralized logging (Section 7A of architecture)
setup_logging(log_level=settings.LOG_LEVEL, log_file=settings.LOG_FILE)
logger = logging.getLogger(__name__)

# Run database migrations to make sure tables exist and CSV data is imported
try:
    logger.info("Initializing database and running migrations...")
    run_migrations()
except Exception as e:
    logger.error(f"Migration error during startup: {e}")

app = FastAPI(
    title="JobFlow AI API",
    description="Unified API gateway for Job Aggregation, Resume Customization, and Email Outreach",
    version="1.0.0"
)

# CORS configuration to allow local and production Next.js client interaction
origins = [org.strip().rstrip("/") for org in settings.ALLOWED_ORIGINS.split(",") if org.strip()]
logger.info(f"CORS Allowed Origins initialized: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Include routers
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])
app.include_router(outreach.router, prefix="/api/outreach", tags=["Outreach"])
app.include_router(compatibility.router, prefix="/api", tags=["Compatibility"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "JobFlow AI API Gateway",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
