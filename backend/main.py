import os
import logging
from dataclasses import dataclass, field
from threading import Lock
from typing import List, Literal, Optional

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from system_prompt import (
    classify_phase,
    build_system_prompt,
    get_phase_progress,
    resolve_active_phase,
)
from config import get_llm_config, LLMConfig
from rag import retrieve_context

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    sessionId: Optional[str] = None
    projectId: Optional[str] = None
    userMessage: str
    conversationHistory: Optional[List[ChatMessage]] = []


@dataclass
class SessionState:
    phase_history: List[int] = field(default_factory=lambda: [0])
    current_phase: Optional[int] = 0
    phase_exit_met: set[int] = field(default_factory=set)


SESSIONS: dict[str, SessionState] = {}
SESSIONS_LOCK = Lock()


def _get_session(session_id: str) -> SessionState:
    with SESSIONS_LOCK:
        if session_id not in SESSIONS:
            SESSIONS[session_id] = SessionState()
        return SESSIONS[session_id]


def _llm_chat_completion(
    base_url: str,
    api_key: str,
    model: str,
    system: str,
    messages: list[dict],
    temperature: float = 0.6,
    max_tokens: int = 1024,
) -> str:
    """
    Safely call the LLM API with defensive error handling.

    This function:
    - Validates HTTP response status
    - Defensively parses JSON (checks choices, message, content)
    - Handles content as string or list of parts
    - Returns a safe fallback if anything fails

    Args:
        base_url: API base URL (e.g., https://api.openai.com/v1)
        api_key: API authentication key
        model: Model name (e.g., gpt-4o-mini)
        system: System prompt content
        messages: List of message dicts [{role, content}, ...]
        temperature: Sampling temperature (0.0-2.0)
        max_tokens: Max tokens in response

    Returns:
        str: The assistant's response content, or a fallback error message.
    """
    fallback_response = "I could not generate a response right now. Please try again."

    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system}, *messages],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    try:
        resp = requests.post(
            f"{base_url}/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            json=payload,
            timeout=60,
        )

        # Validate HTTP response
        if not resp.ok:
            logger.error(f"LLM API error ({resp.status_code}): {resp.text[:400]}")
            return fallback_response

        # Parse JSON defensively
        try:
            data = resp.json()
        except ValueError as e:
            logger.error(f"Failed to parse LLM response JSON: {e}")
            return fallback_response

        # Extract content with defensive checks
        choices = data.get("choices")
        if not choices or not isinstance(choices, list) or len(choices) == 0:
            logger.error(f"Unexpected response format: 'choices' is missing or empty. Got: {data}")
            return fallback_response

        message = choices[0].get("message")
        if not message or not isinstance(message, dict):
            logger.error(f"Unexpected response format: 'message' is missing or invalid. Got: {message}")
            return fallback_response

        content = message.get("content")

        # Handle various content formats
        if isinstance(content, str):
            if content.strip():
                return content.strip()
            else:
                logger.warning("LLM returned empty string content")
                return fallback_response

        if isinstance(content, list):
            # Content may be a list of parts (e.g., from vision models)
            text_parts: list[str] = []
            for part in content:
                if isinstance(part, dict) and part.get("type") == "text":
                    text = part.get("text")
                    if isinstance(text, str):
                        text_parts.append(text)
                elif isinstance(part, str):
                    text_parts.append(part)

            joined = "\n".join(text_parts).strip()
            if joined:
                return joined
            else:
                logger.warning("LLM returned empty list of content parts")
                return fallback_response

        # Content is neither string nor list
        logger.error(f"Unexpected content type {type(content)}: {content}")
        return fallback_response

    except requests.RequestException as e:
        logger.error(f"LLM request failed (network error): {e}")
        return fallback_response
    except Exception as e:
        logger.error(f"Unexpected error in _llm_chat_completion: {e}")
        return fallback_response



app = FastAPI(title="EngiBuddy Python Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/chat")
def chat(req: ChatRequest) -> dict:
    """
    Main chat endpoint: classify phase, retrieve context, generate response.

    Flow:
    1. Validate input
    2. Load LLM configuration
    3. Classify the student's message into a phase
    4. Retrieve relevant knowledge base context (RAG)
    5. Generate a Socratic coaching response
    6. Return response + phase info

    The response includes:
    - assistantMessage: The coaching response
    - classification: Phase classification details
    - phaseProgress: Sidebar state
    """
    user_message = req.userMessage.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Missing userMessage")

    # Load LLM configuration (centralized)
    try:
        llm_config: LLMConfig = get_llm_config()
    except ValueError as e:
        logger.error(f"LLM configuration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    history = [
        {"role": m.role, "content": m.content}
        for m in (req.conversationHistory or [])[-12:]
        if m.content and m.content.strip()
    ]

    session_id = (req.sessionId or f"session-{req.projectId or 'default'}").strip()
    session = _get_session(session_id)

    try:
        # ============================================================
        # STEP 1: Classify the message into a phase
        # ============================================================
        classification = classify_phase(
            user_message=user_message,
            history=history,
            current_phase=session.current_phase,
            llm_call=lambda system, messages: _llm_chat_completion(
                base_url=llm_config.base_url,
                api_key=llm_config.api_key,
                model=llm_config.model,
                system=system,
                messages=messages,
                temperature=0.0,
                max_tokens=220,
            ),
        )

        # Resolve the active phase (sticky-state rules)
        phase_id = resolve_active_phase(
            classification=classification,
            previous_phase=session.current_phase,
            confidence_threshold=0.35,
        )
        session.current_phase = phase_id
        if phase_id not in session.phase_history:
            session.phase_history.append(phase_id)

        # ============================================================
        # STEP 2: Retrieve knowledge base context (RAG)
        # ============================================================
        rag_context = retrieve_context(
            user_message=user_message,
            phase_id=phase_id,
        )

        # ============================================================
        # STEP 3: Build system prompt with optional RAG context
        # ============================================================
        system_prompt = build_system_prompt(phase_id)

        # Prepend RAG context if available
        if rag_context:
            system_prompt = (
                f"{system_prompt}\n\n"
                f"---\n"
                f"Reference context from knowledge base:\n{rag_context}\n"
                f"---\n"
                f"Use the above context to inform your coaching, but still follow the phase rules."
            )

        # ============================================================
        # STEP 4: Generate coaching response
        # ============================================================
        assistant_message = _llm_chat_completion(
            base_url=llm_config.base_url,
            api_key=llm_config.api_key,
            model=llm_config.model,
            system=system_prompt,
            messages=[*history, {"role": "user", "content": user_message}],
        )

    except requests.RequestException as exc:
        logger.error(f"Request failed: {exc}")
        raise HTTPException(status_code=500, detail=f"Request failed: {exc}") from exc
    except Exception as exc:
        logger.error(f"Unexpected error in /chat: {exc}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}") from exc

    # Ensure we always return a message
    if not assistant_message:
        assistant_message = "No response returned."

    return {
        "assistantMessage": assistant_message,
        "classification": classification,
        "phaseProgress": get_phase_progress(session),
    }
