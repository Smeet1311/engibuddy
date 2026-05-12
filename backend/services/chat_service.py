import logging
from uuid import uuid4

import requests

from config import LLMConfig, get_llm_config
from db import get_messages, save_message
from observability import log_event, retrieval_metrics
from rag import retrieve_context
from review_mode import build_review_progress
from services.session_service import (
    SessionState,
    auto_validate_session_review,
    get_or_create_session,
    persist_session,
    update_session_name,
)
from system_prompt import (
    build_system_prompt,
    classify_phase,
    get_phase_progress,
    resolve_active_phase,
)

logger = logging.getLogger(__name__)


def llm_chat_completion(
    base_url: str,
    api_key: str,
    model: str,
    system: str,
    messages: list[dict],
    temperature: float = 0.6,
    max_tokens: int = 1024,
) -> str:
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
        if not resp.ok:
            logger.error("LLM API error (%s): %s", resp.status_code, resp.text[:400])
            return fallback_response
        data = resp.json()
        choices = data.get("choices")
        if not choices or not isinstance(choices, list):
            return fallback_response
        message = choices[0].get("message")
        if not isinstance(message, dict):
            return fallback_response
        content = message.get("content")
        if isinstance(content, str) and content.strip():
            return content.strip()
        if isinstance(content, list):
            text_parts = []
            for part in content:
                if isinstance(part, dict) and part.get("type") == "text" and isinstance(part.get("text"), str):
                    text_parts.append(part["text"])
                elif isinstance(part, str):
                    text_parts.append(part)
            joined = "\n".join(text_parts).strip()
            if joined:
                return joined
        return fallback_response
    except Exception:
        logger.exception("Unexpected error in llm_chat_completion")
        return fallback_response


def process_chat(
    user_message: str,
    session_id: str | None,
    project_id: str | None,
    conversation_history: list,
    request_id: str,
    mode: str = "guidance",
) -> dict:
    clean_message = user_message.strip()
    history = [
        {"role": m.role, "content": m.content}
        for m in (conversation_history or [])[-12:]
        if getattr(m, "content", "").strip()
    ]
    normalized_project_id = (project_id or "default").strip() or "default"
    normalized_session_id = (session_id or "").strip() or f"session-{uuid4().hex[:12]}"
    session: SessionState = get_or_create_session(
        session_id=normalized_session_id,
        project_id=normalized_project_id,
    )
    session.project_id = normalized_project_id
    llm_config: LLMConfig = get_llm_config()
    existing_message_count = len(get_messages(session_id=normalized_session_id))

    classification = classify_phase(
        user_message=clean_message,
        history=history,
        current_phase=session.current_phase,
        llm_call=lambda system, messages: llm_chat_completion(
            base_url=llm_config.base_url,
            api_key=llm_config.api_key,
            model=llm_config.model,
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
    previous_phase = session.current_phase
    session.current_phase = phase_id
    if phase_id > previous_phase:
        for completed_phase in range(previous_phase, phase_id):
            session.phase_exit_met.add(completed_phase)
    if phase_id not in session.phase_history:
        session.phase_history.append(phase_id)

    rag_result = retrieve_context(
        user_message=clean_message,
        phase_id=phase_id,
        project_id=normalized_project_id,
        mode=mode,
    )
    metric = retrieval_metrics.record(phase_id=phase_id, top_k=rag_result.top_k, empty=not rag_result.used)
    log_event(
        message="retrieval_metrics",
        request_id=request_id,
        phase=phase_id,
        top_k=rag_result.top_k,
        candidates=rag_result.candidate_count,
        empty=not rag_result.used,
        aggregate=metric,
    )

    system_prompt, prompt_meta = build_system_prompt(
        phase_id,
        session_id=normalized_session_id,
        mode=mode,
    )
    if rag_result.context:
        system_prompt = (
            f"{system_prompt}\n\n---\nReference context from knowledge base:\n{rag_result.context}\n---\n"
            "Use the above context to inform your coaching, but still follow the phase rules."
        )

    assistant_message = llm_chat_completion(
        base_url=llm_config.base_url,
        api_key=llm_config.api_key,
        model=llm_config.model,
        system=system_prompt,
        messages=[*history, {"role": "user", "content": clean_message}],
    ) or "No response returned."

    persist_session(normalized_session_id, session)

    if existing_message_count == 0 and history:
        for item in history:
            role = item.get("role")
            content = (item.get("content") or "").strip()
            if role in {"user", "assistant"} and content:
                save_message(session_id=normalized_session_id, role=role, content=content)

    save_message(session_id=normalized_session_id, role="user", content=clean_message)
    save_message(session_id=normalized_session_id, role="assistant", content=assistant_message)
    if existing_message_count <= 1:
        auto_name = " ".join(clean_message.split()[:6])[:50].strip()
        if auto_name:
            update_session_name(normalized_session_id, auto_name)

    phase_progress_payload = get_phase_progress(session)
    review_progress_payload = build_review_progress(session.review_progress)
    if mode == "guidance":
        try:
            validation_payload = auto_validate_session_review(normalized_session_id)
            if validation_payload.get("phaseProgress"):
                phase_progress_payload = validation_payload["phaseProgress"]
            if validation_payload.get("reviewProgress"):
                review_progress_payload = validation_payload["reviewProgress"]
        except Exception:
            # Guidance replies should still complete even if checklist validation fails.
            logger.exception("Automatic checklist validation failed for session %s", normalized_session_id)

    return {
        "sessionId": normalized_session_id,
        "assistantMessage": assistant_message,
        "classification": classification,
        "phaseProgress": phase_progress_payload,
        "reviewProgress": review_progress_payload,
        "ragUsed": rag_result.used,
        "ragSources": rag_result.sources,
        "ragPreview": rag_result.preview,
        "ragRetrievalMode": rag_result.retrieval_mode,
        "ragTopK": rag_result.top_k,
        "ragCandidates": rag_result.candidate_count,
        "promptVersion": prompt_meta["version"],
    }
