"""
Centralized logging configuration for JobFlow AI.

Sets up structured logging with three named channels as specified in the
architecture (Section 7A):

    - ``jobflow.scrapers``  — scraping duration, rate-limiting, retries
    - ``jobflow.llm``       — payload sizes, response latency, rate-limits
    - ``jobflow.outreach``  — SMTP transactions, timeouts, delivery responses

All channels write to:
    1. Console (stdout) — coloured, concise format
    2. ``logs/jobflow.log`` — full timestamped format, rotated at 5 MB

Usage (call once in ``main.py``):
    from app.core.logging_config import setup_logging
    setup_logging()
"""

import os
import logging
from logging.handlers import RotatingFileHandler


# Channel names matching the architecture spec
CHANNEL_SCRAPERS = "jobflow.scrapers"
CHANNEL_LLM = "jobflow.llm"
CHANNEL_OUTREACH = "jobflow.outreach"

# Also used by resilience.py
CHANNEL_RESILIENCE = "jobflow.resilience"

# Log format
_FILE_FMT = "%(asctime)s | %(levelname)-8s | %(name)-24s | %(message)s"
_CONSOLE_FMT = "%(levelname)-8s | %(name)-24s | %(message)s"
_DATE_FMT = "%Y-%m-%d %H:%M:%S"


def setup_logging(
    log_level: str = "INFO",
    log_file: str = "logs/jobflow.log",
) -> None:
    """
    Initialise the root logger and named channel loggers.

    Parameters
    ----------
    log_level : str
        Minimum severity for all handlers (DEBUG, INFO, WARNING, ERROR).
    log_file : str
        Path to the rotating log file.  Parent directories are created
        automatically.
    """
    level = getattr(logging, log_level.upper(), logging.INFO)

    # Ensure log directory exists
    log_dir = os.path.dirname(log_file)
    if log_dir:
        os.makedirs(log_dir, exist_ok=True)

    # Also ensure simulated_emails directory exists for DRY_RUN mode
    sim_dir = os.path.join(log_dir, "simulated_emails") if log_dir else "logs/simulated_emails"
    os.makedirs(sim_dir, exist_ok=True)

    # ----- File handler (rotating, 5 MB max, 3 backups) -----
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=5 * 1024 * 1024,  # 5 MB
        backupCount=3,
        encoding="utf-8",
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(logging.Formatter(_FILE_FMT, datefmt=_DATE_FMT))

    # ----- Console handler -----
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)
    console_handler.setFormatter(logging.Formatter(_CONSOLE_FMT))

    # ----- Root logger -----
    root = logging.getLogger()
    root.setLevel(level)
    # Avoid duplicate handlers on repeated calls (e.g. hot-reload)
    if not root.handlers:
        root.addHandler(file_handler)
        root.addHandler(console_handler)

    # ----- Named channel loggers (inherit from root) -----
    for channel in (CHANNEL_SCRAPERS, CHANNEL_LLM, CHANNEL_OUTREACH, CHANNEL_RESILIENCE):
        ch_logger = logging.getLogger(channel)
        ch_logger.setLevel(level)
        # Propagation to root is True by default, so they use root handlers

    logging.getLogger("jobflow").info(
        "Logging initialised — level=%s, file=%s", log_level, log_file
    )
