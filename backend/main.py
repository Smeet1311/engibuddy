import os
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
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system}, *messages],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    resp = requests.post(
        f"{base_url}/chat/completions",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        json=payload,
        timeout=60,
    )
    if not resp.ok:
        raise HTTPException(
            status_code=500,
            detail=f"LLM request failed ({resp.status_code}): {resp.text[:400]}",
        )
    data = resp.json()
    message = data.get("choices", [{}])[0].get("message", {}) or {}
    content = message.get("content")

    # Some providers/models can return content as null or as a list of parts.
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        text_parts: list[str] = []
        for part in content:
            if isinstance(part, dict) and part.get("type") == "text" and isinstance(part.get("text"), str):
                text_parts.append(part["text"])
            elif isinstance(part, str):
                text_parts.append(part)
        return "\n".join(text_parts).strip()

    return ""


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
    user_message = req.userMessage.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Missing userMessage")

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set")

    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

    history = [
        {"role": m.role, "content": m.content}
        for m in (req.conversationHistory or [])[-12:]
        if m.content and m.content.strip()
    ]

    session_id = (req.sessionId or f"session-{req.projectId or 'default'}").strip()
    session = _get_session(session_id)

    try:
        classification = classify_phase(
            user_message=user_message,
            history=history,
            llm_call=lambda system, messages: _llm_chat_completion(
                base_url=base_url,
                api_key=api_key,
                model=model,
                system=system,
                messages=messages,
                temperature=0.0,
                max_tokens=220,
            ),
        )
        phase_id = resolve_active_phase(
            classification=classification,
            previous_phase=session.current_phase,
            confidence_threshold=0.35,
        )
        session.current_phase = phase_id
        if phase_id not in session.phase_history:
            session.phase_history.append(phase_id)

        system_prompt = build_system_prompt(phase_id)
        assistant_message = _llm_chat_completion(
            base_url=base_url,
            api_key=api_key,
            model=model,
            system=system_prompt,
            messages=[*history, {"role": "user", "content": user_message}],
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=500, detail=f"LLM request failed: {exc}") from exc
    if not assistant_message:
        assistant_message = "No response returned."

    return {
        "assistantMessage": assistant_message,
        "classification": classification,
        "phaseProgress": get_phase_progress(session),
    }
