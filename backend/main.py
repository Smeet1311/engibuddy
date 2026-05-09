import os
import logging
from typing import List, Literal, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from db import (
    delete_session,
    init_session_db,
    load_or_create_session,
    rename_session,
)
from observability import log_request, start_request
from services.artifact_service import create_artifact_payload, get_artifacts_payload
from services.chat_service import process_chat
from services.session_service import (
    build_session_messages,
    build_session_payload,
    build_session_state_payload,
)

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
    mode: str = "guidance"


class ProjectArtifactRequest(BaseModel):
    artifactType: str
    title: Optional[str] = None
    phaseId: Optional[int] = None
    content: str


class CreateSessionRequest(BaseModel):
    projectId: Optional[str] = "default"
    name: Optional[str] = "New Chat"

app = FastAPI(title="EngiBuddy Python Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_session_db()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/projects/{project_id}/artifacts")
def get_project_artifacts(project_id: str) -> dict:
    return get_artifacts_payload(project_id)


@app.post("/projects/{project_id}/artifacts")
def post_project_artifact(project_id: str, req: ProjectArtifactRequest) -> dict:
    content = req.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Missing artifact content")

    artifact_type = req.artifactType.strip() or "artifact"
    title = (req.title or artifact_type).strip()
    if req.phaseId is not None and not 0 <= req.phaseId <= 5:
        raise HTTPException(status_code=400, detail="phaseId must be between 0 and 5")

    return create_artifact_payload(
        project_id=project_id,
        artifact_type=artifact_type,
        title=title,
        content=content,
        phase_id=req.phaseId,
    )


@app.get("/sessions")
def get_sessions(project_id: str = "default") -> dict:
    return build_session_payload(project_id)


@app.post("/sessions")
def create_session(req: CreateSessionRequest) -> dict:
    project_id = (req.projectId or "default").strip() or "default"
    name = (req.name or "New Chat").strip() or "New Chat"
    session_id = f"session-{uuid4().hex[:12]}"
    load_or_create_session(session_id=session_id, project_id=project_id)
    rename_session(session_id=session_id, name=name)
    return {"sessionId": session_id, "name": name}


@app.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: str) -> dict:
    return build_session_messages(session_id)


@app.get("/sessions/{session_id}/state")
def get_session_state(session_id: str) -> dict:
    return build_session_state_payload(session_id)


@app.delete("/sessions/{session_id}")
def remove_session(session_id: str) -> dict:
    delete_session(session_id=session_id)
    return {"ok": True}


@app.post("/chat")
def chat(req: ChatRequest) -> dict:
    user_message = req.userMessage.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Missing userMessage")
    request = start_request()
    try:
        payload = process_chat(
            user_message=user_message,
            session_id=req.sessionId,
            project_id=req.projectId,
            conversation_history=req.conversationHistory or [],
            request_id=request.request_id,
            mode=req.mode,
        )
        log_request(
            request,
            "chat_completed",
            phase=payload.get("classification", {}).get("phase"),
            rag_used=payload.get("ragUsed"),
            rag_top_k=payload.get("ragTopK"),
            mode=req.mode,
        )
        return payload
    except ValueError as exc:
        logger.error("Configuration error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        log_request(request, "chat_failed", error=str(exc))
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}") from exc
