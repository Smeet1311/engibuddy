from dataclasses import dataclass, field
from typing import Any

from db import (
    get_messages,
    list_project_artifacts,
    get_session,
    list_sessions,
    load_or_create_session,
    rename_session,
    save_session,
)
from review_mode import (
    build_review_progress,
    completed_phase_ids,
    normalize_review_progress,
    update_review_point,
)
from services.review_validation_service import validate_review_checklist_with_ai
from system_prompt import get_phase_progress


@dataclass
class SessionState:
    phase_history: list[int] = field(default_factory=lambda: [0])
    current_phase: int = 0
    phase_exit_met: set[int] = field(default_factory=set)
    review_progress: dict[str, Any] = field(default_factory=dict)
    project_id: str = "default"


def get_or_create_session(session_id: str, project_id: str) -> SessionState:
    data = load_or_create_session(session_id=session_id, project_id=project_id)
    return SessionState(
        phase_history=data["phase_history"],
        current_phase=data["current_phase"],
        phase_exit_met=set(data["phase_exit_met"]),
        review_progress=normalize_review_progress(data.get("review_progress", {})),
        project_id=data["project_id"],
    )


def persist_session(session_id: str, session: SessionState) -> None:
    completed_review_phases = completed_phase_ids(session.review_progress)
    session.phase_exit_met = set(session.phase_exit_met).union(completed_review_phases)

    save_session(
        session_id=session_id,
        project_id=session.project_id,
        current_phase=session.current_phase,
        phase_history=session.phase_history,
        phase_exit_met=session.phase_exit_met,
        review_progress=normalize_review_progress(session.review_progress),
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
        review_progress=normalize_review_progress(session_data.get("review_progress", {})),
        project_id=session_data["project_id"],
    )
    return {
        "found": True,
        "phaseProgress": get_phase_progress(session),
        "reviewProgress": build_review_progress(session.review_progress),
    }


def update_session_name(session_id: str, name: str) -> None:
    rename_session(session_id=session_id, name=name)


def build_review_payload(session_id: str) -> dict[str, Any]:
    session_data = get_session(session_id=session_id)
    if not session_data:
        return {"found": False}

    normalized = normalize_review_progress(session_data.get("review_progress", {}))
    return {
        "found": True,
        "reviewProgress": build_review_progress(normalized),
    }


def auto_validate_session_review(session_id: str) -> dict[str, Any]:
    session_data = get_session(session_id=session_id)
    if not session_data:
        raise KeyError("Session not found")

    session = SessionState(
        phase_history=session_data["phase_history"],
        current_phase=session_data["current_phase"],
        phase_exit_met=set(session_data["phase_exit_met"]),
        review_progress=normalize_review_progress(session_data.get("review_progress", {})),
        project_id=session_data["project_id"],
    )

    messages = get_messages(session_id=session_id)
    artifacts = list_project_artifacts(project_id=session.project_id)

    ai_result = validate_review_checklist_with_ai(messages=messages, artifacts=artifacts)

    updated_progress = normalize_review_progress(session.review_progress)
    for phase_key, points in ai_result.items():
        if not phase_key.isdigit():
            continue
        phase_id = int(phase_key)
        for point_id, point_state in points.items():
            updated_progress = update_review_point(
                raw_progress=updated_progress,
                phase_id=phase_id,
                point_id=point_id,
                completed=bool(point_state.get("completed", False)),
                evidence=str(point_state.get("evidence", "")),
            )

    session.review_progress = updated_progress
    completed_review_phases = completed_phase_ids(session.review_progress)
    session.phase_exit_met = set(session.phase_exit_met).union(completed_review_phases)
    persist_session(session_id=session_id, session=session)

    return {
        "ok": True,
        "sessionId": session_id,
        "reviewProgress": build_review_progress(session.review_progress),
        "phaseProgress": get_phase_progress(session),
        "validationSummary": {
            "messagesAnalyzed": len(messages),
            "artifactsAnalyzed": len(artifacts),
        },
    }
