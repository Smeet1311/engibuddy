from __future__ import annotations

from copy import deepcopy
from typing import Any

PHASE_NAMES = {
    0: "Empathize",
    1: "Conceive",
    2: "Design",
    3: "Implement",
    4: "Test/Revise",
    5: "Operate",
}

# Review checklist points mapped to the six EngiBuddy phases.
REVIEW_CHECKLIST: dict[int, list[dict[str, str]]] = {
    0: [
        {"id": "problem_statement", "label": "Problem statement written (what and why)."},
        {"id": "stakeholder_analysis", "label": "Stakeholder analysis completed."},
        {"id": "research_summary", "label": "Primary and secondary research summarized."},
        {"id": "scope_constraints", "label": "Problem scope and constraints clearly defined."},
    ],
    1: [
        {"id": "solution_options", "label": "Multiple solution concepts discussed or documented."},
        {"id": "approach_justification", "label": "Chosen approach justified with criteria."},
        {"id": "tech_decisions", "label": "Technology or method decisions discussed or captured."},
        {"id": "risk_assessment", "label": "Risk assessment for chosen direction completed."},
    ],
    2: [
        {"id": "design_doc", "label": "Detailed design or architecture described or prepared."},
        {"id": "wbs", "label": "Work Breakdown Structure described or completed."},
        {"id": "timeline", "label": "Timeline with dependencies is realistic."},
        {"id": "test_plan_outline", "label": "Testing plan outline described or created."},
    ],
    3: [
        {"id": "working_build", "label": "Working build or prototype implemented."},
        {"id": "version_control", "label": "Version control and commits are up to date."},
        {"id": "integration", "label": "Core integration across components is completed."},
        {"id": "technical_docs", "label": "Technical documentation updated during build."},
    ],
    4: [
        {"id": "critical_bugs", "label": "Critical or high-priority bugs addressed."},
        {"id": "criteria_validation", "label": "Acceptance criteria validated with evidence."},
        {"id": "feedback_incorporated", "label": "User or peer feedback incorporated."},
        {"id": "performance_checks", "label": "Performance and edge-case checks completed."},
    ],
    5: [
        {"id": "delivery", "label": "Solution deployed or delivered to stakeholders."},
        {"id": "retrospective", "label": "Retrospective and lessons learned documented."},
        {"id": "presentation", "label": "Final presentation artifacts prepared."},
        {"id": "improvement_roadmap", "label": "Future improvement roadmap identified."},
    ],
}


def _normalize_phase_state(raw_phase_state: Any) -> dict[str, dict[str, Any]]:
    if not isinstance(raw_phase_state, dict):
        return {}

    normalized: dict[str, dict[str, Any]] = {}
    for key, value in raw_phase_state.items():
        if not isinstance(key, str) or not isinstance(value, dict):
            continue
        completed = bool(value.get("completed", False))
        evidence_value = value.get("evidence", "")
        evidence = evidence_value.strip() if isinstance(evidence_value, str) else ""
        normalized[key] = {"completed": completed, "evidence": evidence}
    return normalized


def normalize_review_progress(raw_progress: Any) -> dict[str, dict[str, dict[str, Any]]]:
    if not isinstance(raw_progress, dict):
        return {}

    normalized: dict[str, dict[str, dict[str, Any]]] = {}
    for phase_key, phase_state in raw_progress.items():
        if isinstance(phase_key, int):
            phase_id = phase_key
        elif isinstance(phase_key, str) and phase_key.isdigit():
            phase_id = int(phase_key)
        else:
            continue

        if phase_id not in REVIEW_CHECKLIST:
            continue

        normalized[str(phase_id)] = _normalize_phase_state(phase_state)

    return normalized


def build_review_progress(raw_progress: Any) -> dict[str, Any]:
    normalized = normalize_review_progress(raw_progress)

    phases: list[dict[str, Any]] = []
    total_points = 0
    completed_points = 0

    for phase_id in range(6):
        points_meta = REVIEW_CHECKLIST[phase_id]
        phase_state = normalized.get(str(phase_id), {})
        points: list[dict[str, Any]] = []

        for point in points_meta:
            state = phase_state.get(point["id"], {"completed": False, "evidence": ""})
            completed = bool(state.get("completed", False))
            evidence = state.get("evidence", "") if isinstance(state.get("evidence", ""), str) else ""
            points.append(
                {
                    "id": point["id"],
                    "label": point["label"],
                    "completed": completed,
                    "evidence": evidence,
                }
            )

        phase_completed_count = sum(1 for point in points if point["completed"])
        phase_total = len(points)

        phases.append(
            {
                "id": phase_id,
                "name": PHASE_NAMES[phase_id],
                "points": points,
                "completed": phase_completed_count == phase_total and phase_total > 0,
                "completedCount": phase_completed_count,
                "totalCount": phase_total,
            }
        )

        completed_points += phase_completed_count
        total_points += phase_total

    return {
        "phases": phases,
        "summary": {
            "completedPoints": completed_points,
            "totalPoints": total_points,
            "percent": round((completed_points / total_points) * 100, 2) if total_points > 0 else 0.0,
        },
    }


def update_review_point(
    raw_progress: Any,
    phase_id: int,
    point_id: str,
    completed: bool | None,
    evidence: str | None,
) -> dict[str, dict[str, dict[str, Any]]]:
    if phase_id not in REVIEW_CHECKLIST:
        raise ValueError("phaseId must be between 0 and 5")

    valid_point_ids = {point["id"] for point in REVIEW_CHECKLIST[phase_id]}
    if point_id not in valid_point_ids:
        raise ValueError("pointId is not valid for the selected phase")

    normalized = normalize_review_progress(raw_progress)
    result = deepcopy(normalized)

    phase_key = str(phase_id)
    if phase_key not in result:
        result[phase_key] = {}

    current = result[phase_key].get(point_id, {"completed": False, "evidence": ""})

    if completed is not None:
        current["completed"] = bool(completed)

    if evidence is not None:
        current["evidence"] = evidence.strip()

    result[phase_key][point_id] = current
    return result


def completed_phase_ids(raw_progress: Any) -> set[int]:
    review = build_review_progress(raw_progress)
    return {
        int(phase["id"])
        for phase in review["phases"]
        if bool(phase.get("completed", False))
    }


def compute_recommended_phase(raw_progress: Any) -> int:
    review = build_review_progress(raw_progress)
    for phase in review["phases"]:
        if not bool(phase.get("completed", False)):
            return int(phase["id"])
    return 5
