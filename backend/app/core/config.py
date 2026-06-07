"""
Centralized application configuration using Pydantic Settings.

All environment variables are loaded from the root .env file and made available
as typed, validated settings. Modules should import `settings` instead of calling
os.getenv() directly.

Usage:
    from app.core.config import settings
    print(settings.GROQ_API_KEY)
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """JobFlow AI application settings loaded from environment variables."""

    # --- Core ---
    ENVIRONMENT: str = Field(default="development", description="Runtime environment (development, staging, production)")
    DATABASE_URL: str = Field(default="sqlite:///./jobflow.db", description="SQLAlchemy database connection string")

    # --- LLM Orchestrator ---
    GROQ_API_KEY: str = Field(default="", description="Groq Cloud API key for LLM inference")

    # --- Scraping ---
    FIRECRAWL_API_KEY: str = Field(default="", description="Firecrawl API key for JS-rendered scraping")

    # --- Email / SMTP ---
    SMTP_HOST: str = Field(default="smtp.gmail.com", description="SMTP server hostname")
    SMTP_PORT: int = Field(default=587, description="SMTP server port (587 for TLS, 465 for SSL)")
    SMTP_USER: str = Field(default="", description="SMTP login email address")
    SMTP_PASSWORD: str = Field(default="", description="SMTP login password / Gmail App Password")
    SENDER_NAME: str = Field(default="Job Seeker", description="Display name on outgoing emails")
    DRY_RUN: bool = Field(default=True, description="When True, emails are simulated instead of sent via SMTP")

    # --- Logging ---
    LOG_LEVEL: str = Field(default="INFO", description="Root log level (DEBUG, INFO, WARNING, ERROR)")
    LOG_FILE: str = Field(default="logs/jobflow.log", description="Path to the centralized log file")

    # --- Resilience ---
    MAX_RETRIES: int = Field(default=3, description="Default max retries for external API calls")
    RETRY_INITIAL_DELAY: float = Field(default=2.0, description="Initial retry delay in seconds (doubles on each retry)")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


# Singleton instance — import this everywhere
settings = Settings()
