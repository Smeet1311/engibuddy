import os
from typing import List, Literal, Optional

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from system_prompt import ENGIBUDDY_SYSTEM_PROMPT

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    userMessage: str
    conversationHistory: Optional[List[ChatMessage]] = []


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

    messages = [
        {"role": "system", "content": ENGIBUDDY_SYSTEM_PROMPT},
        *history,
        {"role": "user", "content": user_message},
    ]

    try:
        resp = requests.post(
            f"{base_url}/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": 0.6,
                "max_tokens": 1024,
            },
            timeout=60,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=500, detail=f"LLM request failed: {exc}") from exc

    if not resp.ok:
        raise HTTPException(
            status_code=500,
            detail=f"LLM request failed ({resp.status_code}): {resp.text[:400]}",
        )

    data = resp.json()
    assistant_message = (
        data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    )
    if not assistant_message:
        assistant_message = "No response returned."

    return {"assistantMessage": assistant_message}
