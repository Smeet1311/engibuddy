"""Exit criteria per PBL phase for Review Mode."""

from typing import Any

PHASE_NAMES = ["Empathize", "Conceive", "Design", "Implement", "Test/Revise", "Operate"]

PHASE_CRITERIA: dict[int, list[dict[str, str]]] = {
    0: [
        {"id": "emp-problem", "label": "Problem statement is clearly defined"},
        {"id": "emp-users", "label": "Target users and needs are identified"},
        {"id": "emp-research", "label": "Background research or observations are documented"},
    ],
    1: [
        {"id": "con-ideas", "label": "Multiple solution ideas are listed"},
        {"id": "con-scope", "label": "Project scope and constraints are stated"},
        {"id": "con-selection", "label": "A preferred approach is chosen with rationale"},
    ],
    2: [
        {"id": "des-plan", "label": "Solution design or architecture is described"},
        {"id": "des-specs", "label": "Key components and specifications are defined"},
        {"id": "des-timeline", "label": "Implementation plan or milestones exist"},
    ],
    3: [
        {"id": "imp-build", "label": "Prototype or implementation progress is shown"},
        {"id": "imp-docs", "label": "Build steps or technical notes are documented"},
        {"id": "imp-issues", "label": "Known issues or blockers are listed"},
    ],
    4: [
        {"id": "test-plan", "label": "Test plan or acceptance criteria are defined"},
        {"id": "test-results", "label": "Test results or validation evidence are included"},
        {"id": "test-iterate", "label": "Revisions based on testing are described"},
    ],
    5: [
        {"id": "op-deploy", "label": "Deployment or delivery approach is explained"},
        {"id": "op-handoff", "label": "User documentation or handoff notes exist"},
        {"id": "op-reflect", "label": "Reflection on outcomes and lessons learned"},
    ],
}


def get_criteria_for_phase(phase_id: int) -> list[dict[str, str]]:
    if phase_id not in PHASE_CRITERIA:
        raise ValueError(f"Unknown phase id: {phase_id}")
    return list(PHASE_CRITERIA[phase_id])


def build_status_payload(phase_id: int, completed_ids: set[str] | None = None) -> dict[str, Any]:
    completed = completed_ids or set()
    criteria = get_criteria_for_phase(phase_id)
    items = []
    missing = []
    for entry in criteria:
        met = entry["id"] in completed
        item = {**entry, "completed": met}
        items.append(item)
        if not met:
            missing.append(entry)
    return {
        "phaseId": phase_id,
        "phaseName": PHASE_NAMES[phase_id],
        "onTrack": len(missing) == 0,
        "missingCount": len(missing),
        "criteria": items,
        "missing": missing,
    }
