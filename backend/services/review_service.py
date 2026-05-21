import json
import logging
import re

from config import get_llm_config
from review_criteria import PHASE_NAMES, build_status_payload, get_criteria_for_phase
from services.artifact_service import create_artifact_payload
from services.chat_service import llm_chat_completion

logger = logging.getLogger(__name__)

ANALYZE_SYSTEM = """You are EngiBuddy in Review Mode. Compare the student's uploaded document against the rubric checklist for their current PBL phase.

Rules:
- Do NOT rewrite their project or give full solutions.
- For each checklist item, decide if the document provides enough evidence (met: true/false).
- Give one short feedback sentence per item.
- End with a brief overall summary.

Respond with ONLY valid JSON in this shape:
{
  "summary": "string",
  "items": [
    {"id": "criterion-id", "met": true, "feedback": "string"}
  ]
}
"""


def _heuristic_analysis(content: str, phase_id: int) -> dict:
    """Fallback when LLM is unavailable — keyword hints only."""
    lowered = content.lower()
    items = []
    for entry in get_criteria_for_phase(phase_id):
        tokens = [word for word in re.findall(r"[a-z]{5,}", entry["label"].lower())[:3]]
        met = any(token in lowered for token in tokens) if tokens else len(content.strip()) > 120
        items.append(
            {
                "id": entry["id"],
                "label": entry["label"],
                "met": met,
                "feedback": "Possible evidence found in upload." if met else "Not clearly addressed in upload.",
            }
        )
    met_count = sum(1 for item in items if item["met"])
    return {
        "summary": f"Heuristic scan: {met_count}/{len(items)} criteria may be covered. Add detail or retry with API for full review.",
        "items": items,
        "source": "heuristic",
    }


def _parse_analysis_json(raw: str, phase_id: int) -> dict | None:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict):
        return None
    criteria_by_id = {c["id"]: c["label"] for c in get_criteria_for_phase(phase_id)}
    items = []
    for row in data.get("items") or []:
        if not isinstance(row, dict):
            continue
        cid = str(row.get("id", "")).strip()
        if cid not in criteria_by_id:
            continue
        items.append(
            {
                "id": cid,
                "label": criteria_by_id[cid],
                "met": bool(row.get("met")),
                "feedback": str(row.get("feedback", "")).strip() or "No feedback provided.",
            }
        )
    for entry in get_criteria_for_phase(phase_id):
        if not any(item["id"] == entry["id"] for item in items):
            items.append(
                {
                    "id": entry["id"],
                    "label": entry["label"],
                    "met": False,
                    "feedback": "Not evaluated in model response.",
                }
            )
    summary = str(data.get("summary", "")).strip() or "Review complete."
    return {"summary": summary, "items": items, "source": "llm"}


def analyze_document(
    *,
    content: str,
    phase_id: int,
    project_id: str,
    title: str | None = None,
    save_artifact: bool = True,
) -> dict:
    clean = content.strip()
    if not clean:
        raise ValueError("Document content is empty.")
    if not 0 <= phase_id <= 5:
        raise ValueError("phaseId must be between 0 and 5.")

    artifact = None
    if save_artifact:
        artifact = create_artifact_payload(
            project_id=project_id,
            artifact_type="review-upload",
            title=title or f"Review upload — {PHASE_NAMES[phase_id]}",
            content=clean[:50000],
            phase_id=phase_id,
        )

    criteria_lines = "\n".join(f"- {c['id']}: {c['label']}" for c in get_criteria_for_phase(phase_id))
    user_prompt = (
        f"Phase: {PHASE_NAMES[phase_id]} (id={phase_id})\n\n"
        f"Checklist:\n{criteria_lines}\n\n"
        f"Student document:\n{clean[:12000]}"
    )

    llm_config = get_llm_config()
    raw = llm_chat_completion(
        base_url=llm_config.base_url,
        api_key=llm_config.api_key,
        model=llm_config.model,
        system=ANALYZE_SYSTEM,
        messages=[{"role": "user", "content": user_prompt}],
        temperature=0.2,
        max_tokens=900,
    )

    analysis = _parse_analysis_json(raw, phase_id)
    if analysis is None:
        logger.warning("LLM analysis parse failed; using heuristic fallback.")
        analysis = _heuristic_analysis(clean, phase_id)

    status = build_status_payload(
        phase_id,
        {item["id"] for item in analysis["items"] if item.get("met")},
    )

    return {
        "phaseId": phase_id,
        "phaseName": PHASE_NAMES[phase_id],
        "analysis": analysis,
        "status": status,
        "artifact": artifact.get("artifact") if artifact else None,
    }


def get_review_status(phase_id: int, completed_ids: list[str] | None = None) -> dict:
    if not 0 <= phase_id <= 5:
        raise ValueError("phaseId must be between 0 and 5.")
    return build_status_payload(phase_id, set(completed_ids or []))
