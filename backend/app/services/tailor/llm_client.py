import os
import re
import json
import time
import httpx
import logging
from typing import Dict, Any, Optional

from ...core.config import settings

logger = logging.getLogger("jobflow.llm")

DEFAULT_MODEL = "llama-3.1-8b-instant"
FALLBACK_MODEL = "llama-3.3-70b-versatile"
MAX_RETRIES = 3

class LLMError(Exception):
    pass

def call_llm(system_prompt: str, user_prompt: str, model: str = DEFAULT_MODEL, max_retries: int = MAX_RETRIES, response_format_json: bool = True) -> Dict[str, Any]:
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise LLMError("The GROQ_API_KEY environment variable is missing or empty")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    url = "https://api.groq.com/openai/v1/chat/completions"
    
    current_model = model
    delay = 2.0

    for attempt in range(max_retries + 1):
        payload = {
            "model": current_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.1,
        }

        # Apply response_format JSON mode if supported by the model
        # llama-3.3-70b-versatile and llama-3.1-8b-instant support JSON mode
        if response_format_json:
            payload["response_format"] = {"type": "json_object"}

        try:
            with httpx.Client(timeout=45.0) as client:
                response = client.post(url, headers=headers, json=payload)
                
                # Check for rate-limiting (429)
                if response.status_code == 429:
                    logger.warning(f"[LLM] Rate limited (429). Retrying in {delay}s (attempt {attempt + 1}/{max_retries + 1})")
                    time.sleep(delay)
                    delay *= 2
                    continue
                
                response.raise_for_status()
                res_data = response.json()
                
                content = res_data["choices"][0]["message"]["content"]
                if not content:
                    raise LLMError("Empty response content received from Groq")
                
                # Parse content as JSON if JSON mode was requested
                if response_format_json:
                    try:
                        parsed = json.loads(content)
                        return parsed
                    except json.JSONDecodeError:
                        # Fallback parsing in case model returns JSON wrapped in markdown
                        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', content)
                        if json_match:
                            return json.loads(json_match.group(1))
                        raise LLMError("Failed to parse JSON content from Groq response")
                else:
                    return {"text": content}

        except httpx.HTTPStatusError as e:
            logger.error(f"[LLM] HTTP error: {e.response.text}")
            if attempt == max_retries:
                # Try fallback model on final retry if using standard model
                if current_model == DEFAULT_MODEL:
                    logger.info(f"[LLM] Retrying with fallback model: {FALLBACK_MODEL}")
                    current_model = FALLBACK_MODEL
                    time.sleep(1.0)
                    continue
                raise LLMError(f"Groq API HTTP error: {e}")
            time.sleep(delay)
            delay *= 2
            
        except Exception as e:
            logger.error(f"[LLM] Unexpected error: {e}")
            if attempt == max_retries:
                raise LLMError(f"Failed to communicate with LLM: {e}")
            time.sleep(delay)
            delay *= 2

    raise LLMError("Max retries exceeded for LLM call")
