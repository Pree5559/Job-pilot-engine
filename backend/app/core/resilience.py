"""
Resilience utilities — retry engine with exponential backoff.

Wraps external API calls (Groq LLM, Firecrawl, HTTP scrapers) so that
transient failures and rate-limit responses (HTTP 429) are retried
automatically before propagating the error.

Architecture Reference: Section 7B — LLM & API Retry Engine.
"""

import time
import logging
from typing import Callable, Any, Optional, Tuple, Type

import httpx
import requests

logger = logging.getLogger("jobflow.resilience")


# ---------------------------------------------------------------------------
# Generic retry wrapper (matches architecture spec signature)
# ---------------------------------------------------------------------------

def call_with_retry(
    func: Callable,
    *args: Any,
    max_retries: int = 3,
    initial_delay: float = 2.0,
    retryable_exceptions: Tuple[Type[BaseException], ...] = (Exception,),
    **kwargs: Any,
) -> Any:
    """
    Invoke *func* with exponential backoff on failure.

    Parameters
    ----------
    func : Callable
        The function to call.
    max_retries : int
        Maximum number of retry attempts (total attempts = max_retries + 1).
    initial_delay : float
        Seconds to wait before the first retry; doubles after each attempt.
    retryable_exceptions : tuple
        Exception types that should trigger a retry.  All others propagate
        immediately.

    Returns
    -------
    The return value of *func* on the first successful call.

    Raises
    ------
    The last exception encountered once all retries are exhausted.
    """
    delay = initial_delay
    last_exception: Optional[BaseException] = None

    for attempt in range(max_retries + 1):
        try:
            return func(*args, **kwargs)

        except retryable_exceptions as exc:
            last_exception = exc

            # Detect HTTP 429 (rate-limit) from httpx or requests
            status = _extract_status(exc)
            is_rate_limit = status == 429

            if attempt < max_retries:
                level = logging.WARNING if is_rate_limit else logging.ERROR
                logger.log(
                    level,
                    "[Retry %d/%d] %s — retrying in %.1fs%s",
                    attempt + 1,
                    max_retries,
                    exc,
                    delay,
                    " (rate-limited)" if is_rate_limit else "",
                )
                time.sleep(delay)
                delay *= 2
            else:
                logger.error(
                    "[Retry exhausted] %s after %d attempts",
                    exc,
                    max_retries + 1,
                )

    # All retries exhausted — re-raise last exception
    raise last_exception  # type: ignore[misc]


# ---------------------------------------------------------------------------
# HTTP-specific convenience wrapper
# ---------------------------------------------------------------------------

def http_request_with_retry(
    method: str,
    url: str,
    *,
    max_retries: int = 3,
    initial_delay: float = 2.0,
    timeout: float = 30.0,
    session: Optional[requests.Session] = None,
    **request_kwargs: Any,
) -> requests.Response:
    """
    Perform an HTTP request via *requests* with automatic retry on failure.

    Rate-limit (429), server errors (500-599), and connection errors trigger
    retries.  All other HTTP errors propagate immediately.
    """
    _session = session or requests.Session()

    def _do_request() -> requests.Response:
        resp = _session.request(method, url, timeout=timeout, **request_kwargs)
        if resp.status_code == 429 or resp.status_code >= 500:
            resp.raise_for_status()
        return resp

    return call_with_retry(
        _do_request,
        max_retries=max_retries,
        initial_delay=initial_delay,
        retryable_exceptions=(
            requests.exceptions.ConnectionError,
            requests.exceptions.Timeout,
            requests.exceptions.HTTPError,
        ),
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_status(exc: BaseException) -> Optional[int]:
    """Best-effort extraction of an HTTP status code from an exception."""
    # httpx.HTTPStatusError
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code
    # requests.exceptions.HTTPError
    if isinstance(exc, requests.exceptions.HTTPError) and exc.response is not None:
        return exc.response.status_code
    return None
