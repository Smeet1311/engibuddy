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
        "max_tokens": 1500,
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
        "You are an evaluator that checks project evidence against a review checklist. "
        "Use only provided evidence from chat logs and artifacts. "
        "If evidence is weak or missing, set completed=false. "
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
    recent_messages = messages[-80:]
    message_lines: list[str] = []
    for msg in recent_messages:
        role = str(msg.get("role", "unknown")).strip()
        content = str(msg.get("content", "")).strip()
        if not content:
            continue
        message_lines.append(f"[{role}] {content}")

    artifact_lines: list[str] = []
    for artifact in artifacts[:40]:
        title = str(artifact.get("title", "")).strip()
        artifact_type = str(artifact.get("artifact_type", "")).strip()
        phase_id = artifact.get("phase_id")
        content = str(artifact.get("content", "")).strip()
        snippet = content[:1200]
        artifact_lines.append(
            f"type={artifact_type}; title={title}; phase={phase_id}; content={snippet}"
        )

    return (
        "EVIDENCE START\n"
        "Chat transcript:\n"
        f"{'\n'.join(message_lines) if message_lines else '(none)'}\n\n"
        "Project artifacts:\n"
        f"{'\n'.join(artifact_lines) if artifact_lines else '(none)'}\n"
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
