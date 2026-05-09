from dataclasses import dataclass, field
from typing import Any

from db import (
    get_messages,
    get_session,
    list_sessions,
    load_or_create_session,
    rename_session,
    save_session,
)
from system_prompt import get_phase_progress


@dataclass
class SessionState:
    phase_history: list[int] = field(default_factory=lambda: [0])
    current_phase: int = 0
    phase_exit_met: set[int] = field(default_factory=set)
    project_id: str = "default"


def get_or_create_session(session_id: str, project_id: str) -> SessionState:
    data = load_or_create_session(session_id=session_id, project_id=project_id)
    return SessionState(
        phase_history=data["phase_history"],
        current_phase=data["current_phase"],
        phase_exit_met=set(data["phase_exit_met"]),
        project_id=data["project_id"],
    )


def persist_session(session_id: str, session: SessionState) -> None:
    save_session(
        session_id=session_id,
        project_id=session.project_id,
        current_phase=session.current_phase,
        phase_history=session.phase_history,
        phase_exit_met=session.phase_exit_met,
    )


def build_session_payload(project_id: str) -> dict[str, Any]:
    sessions = list_sessions(project_id=project_id)
    return {
        "sessions": [
            {
                "sessionId": session["id"],
                "name": session["name"],
                "createdAt": session["created_at"],
                "lastMessageAt": session["last_message_at"],
            }
            for session in sessions
        ]
    }


def build_session_messages(session_id: str) -> dict[str, Any]:
    from datetime import datetime

    rows = get_messages(session_id=session_id)
    messages = []
    for row in rows:
        dt = datetime.fromisoformat(row["created_at"])
        messages.append(
            {
                "role": row["role"],
                "content": row["content"],
                "timestamp": dt.strftime("%I:%M %p").lstrip("0"),
            }
        )
    return {"messages": messages}


def build_session_state_payload(session_id: str) -> dict[str, Any]:
    session_data = get_session(session_id=session_id)
    if not session_data:
        return {"found": False}

    session = SessionState(
        phase_history=session_data["phase_history"],
        current_phase=session_data["current_phase"],
        phase_exit_met=set(session_data["phase_exit_met"]),
        project_id=session_data["project_id"],
    )
    return {
        "found": True,
        "phaseProgress": get_phase_progress(session),
    }


def update_session_name(session_id: str, name: str) -> None:
    rename_session(session_id=session_id, name=name)
