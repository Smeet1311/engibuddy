import json
import logging
from typing import Any

import requests

from config import get_llm_config
from review_mode import REVIEW_CHECKLIST

logger = logging.getLogger(__name__)


def _extract_json_object(raw_text: str) -> dict[str, Any]:
    text = (raw_text or "").strip()
    if not text:
        raise ValueError("Empty LLM response")

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or start >= end:
        raise ValueError("LLM response did not contain a JSON object")

    candidate = text[start : end + 1]
    parsed = json.loads(candidate)
    if not isinstance(parsed, dict):
        raise ValueError("Parsed JSON must be an object")
    return parsed


def _llm_chat_completion(system_prompt: str, messages: list[dict[str, str]]) -> str:
    config = get_llm_config()
    payload = {
        "model": config.model,
        "messages": [{"role": "system", "content": system_prompt}, *messages],
        "temperature": 0.0,
        "max_tokens": 4000,
    }

    response = requests.post(
        f"{config.base_url}/chat/completions",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config.api_key}",
        },
        json=payload,
        timeout=90,
    )
    response.raise_for_status()

    data = response.json()
    choices = data.get("choices")
    if not isinstance(choices, list) or not choices:
        raise ValueError("No choices returned from model")

    message = choices[0].get("message", {})
    content = message.get("content")
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts: list[str] = []
        for part in content:
            if isinstance(part, dict) and part.get("type") == "text" and isinstance(part.get("text"), str):
                parts.append(part["text"])
            elif isinstance(part, str):
                parts.append(part)
        return "\n".join(parts)

    raise ValueError("Model returned unsupported content format")


def _build_checklist_prompt() -> str:
    lines: list[str] = []
    for phase_id, points in REVIEW_CHECKLIST.items():
        lines.append(f"Phase {phase_id}:")
        for point in points:
            lines.append(f"- {point['id']}: {point['label']}")

    checklist_text = "\n".join(lines)

    return (
        "You are a STRICT evaluator checking project evidence against a phase-by-phase review checklist.\n\n"
        "EVIDENCE RULES — follow exactly, no exceptions:\n"
        "1. A criterion is completed=true ONLY when the evidence EXPLICITLY and SPECIFICALLY addresses "
        "that exact criterion with concrete details (names, numbers, decisions, results). "
        "Vague mentions, passing references, or general topic overlap do NOT count.\n"
        "2. Evidence may come from any uploaded document regardless of its phase label — "
        "read the document content and match it to the criterion it directly addresses.\n"
        "3. Chat history counts ONLY when the student states specific, detailed content that directly "
        "satisfies the criterion — not when they merely mention a related topic. "
        "Short messages like 'ok', 'done', 'yes', 'I think so' are never sufficient.\n"
        "4. DEFAULT IS INCOMPLETE. When in doubt, set completed=false. "
        "It is always better to under-count than over-count.\n"
        "5. For criteria requiring measurable thresholds or test results, the evidence MUST contain "
        "actual numbers, pass/fail outcomes, or clear conditions — not intentions or plans.\n"
        "6. Do NOT infer or extrapolate. If the criterion is not directly addressed, it is not met.\n\n"
        "Return STRICT JSON only with this schema:\n"
        "{\n"
        "  \"phases\": [\n"
        "    {\"phaseId\": 0, \"points\": [{\"id\": \"point_id\", \"completed\": true, \"evidence\": \"short quote or summary\"}]}\n"
        "  ]\n"
        "}\n"
        "Include all 6 phases and every checklist point exactly once.\n"
        "Checklist:\n"
        f"{checklist_text}"
    )


def _build_evidence_payload(messages: list[dict[str, Any]], artifacts: list[dict[str, Any]]) -> str:
    # Split into recent (last 15) and older for prominence (Problem 7: pass at least 10 messages)
    all_messages = messages[-80:]
    recent_cutoff = min(15, len(all_messages))
    recent_messages = all_messages[-recent_cutoff:]
    older_messages = all_messages[:-recent_cutoff] if len(all_messages) > recent_cutoff else []

    def _format_messages(msgs: list[dict[str, Any]]) -> str:
        lines: list[str] = []
        for msg in msgs:
            role = str(msg.get("role", "unknown")).strip()
            content = str(msg.get("content", "")).strip()
            if content:
                lines.append(f"[{role}] {content}")
        return "\n".join(lines) if lines else "(none)"

    artifact_lines: list[str] = []
    for artifact in artifacts[:40]:
        relevance = str(artifact.get("relevance", "unknown")).strip()
        if relevance == "not_relevant":
            continue
        title = str(artifact.get("title", "")).strip()
        artifact_type = str(artifact.get("artifact_type", "")).strip()
        phase_id = artifact.get("phase_id")
        content = str(artifact.get("content", "")).strip()
        snippet = content[:8000]
        artifact_lines.append(
            f"type={artifact_type}; title={title}; phase={phase_id}; relevance={relevance}; content={snippet}"
        )

    artifacts_text = "\n".join(artifact_lines) if artifact_lines else "(none)"
    return (
        "EVIDENCE START\n"
        "MOST RECENT MESSAGES (check these first for the latest evidence — "
        "student chat descriptions here count as valid evidence):\n"
        f"{_format_messages(recent_messages)}\n\n"
        "EARLIER CONVERSATION HISTORY (also search for evidence from earlier turns):\n"
        f"{_format_messages(older_messages)}\n\n"
        "Project artifacts (uploaded documents — equally valid evidence):\n"
        f"{artifacts_text}\n"
        "EVIDENCE END"
    )


def validate_review_checklist_with_ai(
    messages: list[dict[str, Any]],
    artifacts: list[dict[str, Any]],
) -> dict[str, dict[str, dict[str, Any]]]:
    if not messages and not artifacts:
        raise ValueError("No evidence available for AI review validation")

    system_prompt = _build_checklist_prompt()
    evidence_payload = _build_evidence_payload(messages=messages, artifacts=artifacts)

    raw_response = _llm_chat_completion(
        system_prompt=system_prompt,
        messages=[{"role": "user", "content": evidence_payload}],
    )
    parsed = _extract_json_object(raw_response)

    phases = parsed.get("phases")
    if not isinstance(phases, list):
        raise ValueError("AI response missing phases array")

    normalized: dict[str, dict[str, dict[str, Any]]] = {}
    for phase in phases:
        if not isinstance(phase, dict):
            continue

        phase_id = phase.get("phaseId")
        if not isinstance(phase_id, int) or phase_id not in REVIEW_CHECKLIST:
            continue

        points = phase.get("points")
        if not isinstance(points, list):
            continue

        phase_key = str(phase_id)
        normalized[phase_key] = {}

        valid_point_ids = {point["id"] for point in REVIEW_CHECKLIST[phase_id]}
        for point in points:
            if not isinstance(point, dict):
                continue
            point_id = point.get("id")
            if not isinstance(point_id, str) or point_id not in valid_point_ids:
                continue

            completed = bool(point.get("completed", False))
            evidence = point.get("evidence", "")
            evidence_text = evidence.strip() if isinstance(evidence, str) else ""

            normalized[phase_key][point_id] = {
                "completed": completed,
                "evidence": evidence_text,
            }

    # Ensure all checklist points exist in output. Missing values default to not completed.
    for phase_id, checklist_points in REVIEW_CHECKLIST.items():
        phase_key = str(phase_id)
        if phase_key not in normalized:
            normalized[phase_key] = {}

        for point in checklist_points:
            point_id = point["id"]
            if point_id not in normalized[phase_key]:
                normalized[phase_key][point_id] = {"completed": False, "evidence": ""}

    return normalized


def validate_current_phase_criteria(
    phase_id: int,
    messages: list[dict[str, Any]],
    artifacts: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    """Fast focused validation of only the current phase's criteria.

    Uses only the last 15 messages for speed, but includes all artifacts.
    Returns a dict of {point_id: {"completed": bool, "evidence": str}}.
    Falls back to empty dict on any error so the caller degrades gracefully.
    """
    if phase_id not in REVIEW_CHECKLIST:
        return {}

    criteria = REVIEW_CHECKLIST[phase_id]
    criteria_text = "\n".join(f"- {c['id']}: {c['label']}" for c in criteria)
    valid_ids = {c["id"] for c in criteria}

    # Use last 15 messages (fast path — Problem 7)
    recent = messages[-15:] if len(messages) > 15 else messages
    transcript_lines: list[str] = []
    for m in recent:
        role = str(m.get("role", "user")).strip()
        content = str(m.get("content", "")).strip()
        if content:
            transcript_lines.append(f"[{role}] {content}")
    transcript = "\n".join(transcript_lines) or "(none)"

    artifact_lines: list[str] = []
    for a in artifacts[:20]:
        if str(a.get("relevance", "unknown")) == "not_relevant":
            continue
        snippet = str(a.get("content", ""))[:600]
        artifact_lines.append(
            f"[artifact] phase={a.get('phase_id')} type={a.get('artifact_type')}: {snippet}"
        )
    artifacts_text = "\n".join(artifact_lines) or "(none)"

    system = (
        f"Evaluate ONLY Phase {phase_id} checklist criteria from the evidence below. "
        "Mark completed=true ONLY when evidence EXPLICITLY and SPECIFICALLY addresses that criterion with concrete details. "
        "Vague mentions or general topic references do NOT count. Default is completed=false when in doubt. "
        "Return JSON only: "
        "{\"criteria\": [{\"id\": \"point_id\", \"completed\": true, \"evidence\": \"brief quote or summary\"}]}\n"
        f"Criteria to evaluate:\n{criteria_text}"
    )
    user = f"Recent transcript:\n{transcript}\n\nArtifacts:\n{artifacts_text}"

    try:
        config = get_llm_config()
        payload = {
            "model": config.model,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "temperature": 0.0,
            "max_tokens": 400,
        }
        response = requests.post(
            f"{config.base_url}/chat/completions",
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {config.api_key}"},
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices")
        if not isinstance(choices, list) or not choices:
            return {}
        content = choices[0].get("message", {}).get("content", "")
        if isinstance(content, list):
            content = "\n".join(p.get("text", "") for p in content if isinstance(p, dict))

        parsed = _extract_json_object(content)
        result: dict[str, dict[str, Any]] = {}
        for item in parsed.get("criteria", []):
            if not isinstance(item, dict):
                continue
            point_id = item.get("id")
            if not isinstance(point_id, str) or point_id not in valid_ids:
                continue
            result[point_id] = {
                "completed": bool(item.get("completed", False)),
                "evidence": str(item.get("evidence", "")).strip(),
            }
        return result
    except Exception:
        logger.exception("Fast phase-criteria validation failed for phase %s", phase_id)
        return {}
