import logging

from db import UNSET, create_project_artifact, delete_project_artifact, list_project_artifacts, list_sessions, update_project_artifact
from rag import _infer_phase_id, PHASE_NAMES_MAP

logger = logging.getLogger(__name__)

PHASE_NAMES = PHASE_NAMES_MAP


def get_artifacts_payload(project_id: str) -> dict:
    return {"artifacts": list_project_artifacts(project_id)}


def create_artifact_payload(
    project_id: str,
    artifact_type: str,
    title: str,
    content: str,
    phase_id: int | None,
    session_id: str | None = None,
) -> dict:
    # Auto-detect phase from document content if the caller didn't specify one.
    # _infer_phase_id uses the same PHASE_KEYWORD_WEIGHTS as the RAG retriever,
    # so phase detection is consistent with what RAG would weight highly.
    detected_phase: int | None = phase_id
    if detected_phase is None:
        inferred = _infer_phase_id(content)
        if inferred >= 0:
            detected_phase = inferred

    artifact = create_project_artifact(
        project_id=project_id,
        artifact_type=artifact_type,
        title=title,
        phase_id=detected_phase,
        content=content,
    )

    # Determine which session the client will validate against next.
    # Prefer the session_id passed by the client (the active guidance session).
    # Fall back to the most recently active session for this project.
    # The caller (frontend upload flow) is responsible for triggering
    # POST /sessions/{id}/review/validate after all files in a batch are
    # uploaded — no validation is fired here to avoid a redundant call.
    validation_session_id: str | None = session_id
    if not validation_session_id:
        sessions = list_sessions(project_id=project_id)
        if sessions:
            validation_session_id = sessions[0]["id"]

    phase_name = PHASE_NAMES.get(detected_phase, "Unknown") if detected_phase is not None else None

    return {
        "artifact": artifact,
        "detectedPhase": detected_phase,
        "detectedPhaseName": phase_name,
        "validationSessionId": validation_session_id,
    }


def delete_artifact_payload(
    project_id: str,
    artifact_id: int,
    session_id: str | None = None,
) -> dict:
    """Delete an artifact then synchronously re-validate the session so any
    criteria that were only evidenced by the deleted document are undone."""
    delete_project_artifact(project_id=project_id, artifact_id=artifact_id)

    # Re-run full validation so criteria are recalculated without the deleted doc.
    # Use the provided session_id; fall back to the most recently active session.
    validation_session_id: str | None = session_id
    if not validation_session_id:
        sessions = list_sessions(project_id=project_id)
        if sessions:
            validation_session_id = sessions[0]["id"]

    review_progress = None
    phase_progress = None

    if validation_session_id:
        from db import get_messages
        remaining_messages = get_messages(session_id=validation_session_id)
        remaining_artifacts = list_project_artifacts(project_id=project_id)

        if not remaining_messages and not remaining_artifacts:
            # Nothing left to validate — clear all criteria progress so the
            # checklist reflects a truly empty session.
            try:
                from services.session_service import get_or_create_session, persist_session
                from review_mode import build_review_progress
                from system_prompt import get_phase_progress
                session = get_or_create_session(validation_session_id, project_id)
                session.review_progress = {}
                session.current_phase = 0
                session.phase_exit_met = set()
                persist_session(session_id=validation_session_id, session=session)
                review_progress = build_review_progress({})
                phase_progress = get_phase_progress(session)
            except Exception:
                logger.exception(
                    "Failed to clear session progress after last artifact deleted for session %s",
                    validation_session_id,
                )
        else:
            try:
                from services.session_service import auto_validate_session_review
                result = auto_validate_session_review(
                    validation_session_id,
                    update_current_phase=True,
                    allow_advance=True,
                )
                review_progress = result.get("reviewProgress")
                phase_progress = result.get("phaseProgress")
            except Exception:
                logger.exception(
                    "Re-validation after artifact deletion failed for session %s — resetting progress",
                    validation_session_id,
                )
                # Re-validation failed: reset the session so a page refresh does not
                # show stale criteria from the deleted document.
                try:
                    from services.session_service import get_or_create_session, persist_session
                    from review_mode import build_review_progress
                    from system_prompt import get_phase_progress
                    session = get_or_create_session(validation_session_id, project_id)
                    session.review_progress = {}
                    session.current_phase = 0
                    session.phase_exit_met = set()
                    persist_session(session_id=validation_session_id, session=session)
                    review_progress = build_review_progress({})
                    phase_progress = get_phase_progress(session)
                except Exception:
                    logger.exception(
                        "Failed to reset session progress after re-validation failure for session %s",
                        validation_session_id,
                    )

    return {
        "ok": True,
        "reviewProgress": review_progress,
        "phaseProgress": phase_progress,
    }


def update_artifact_payload(
    project_id: str,
    artifact_id: int,
    phase_id: int | None | object = UNSET,
    relevance: str | None = None,
) -> dict:
    artifact = update_project_artifact(
        project_id=project_id,
        artifact_id=artifact_id,
        phase_id=phase_id,
        relevance=relevance,
    )
    return {"artifact": artifact}
