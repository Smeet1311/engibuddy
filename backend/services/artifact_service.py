from db import create_project_artifact, list_project_artifacts


def get_artifacts_payload(project_id: str) -> dict:
    return {"artifacts": list_project_artifacts(project_id)}


def create_artifact_payload(
    project_id: str,
    artifact_type: str,
    title: str,
    content: str,
    phase_id: int | None,
) -> dict:
    artifact = create_project_artifact(
        project_id=project_id,
        artifact_type=artifact_type,
        title=title,
        phase_id=phase_id,
        content=content,
    )
    return {"artifact": artifact}
