import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any


DB_LOCK = Lock()
ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = Path(__file__).resolve().with_name("engibuddy_sessions.db")
DB_PATH = Path(os.getenv("ENGIBUDDY_SESSION_DB", str(DEFAULT_DB_PATH)))
if not DB_PATH.is_absolute():
    DB_PATH = ROOT_DIR / DB_PATH


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_session_db() -> None:
    with DB_LOCK, _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                current_phase INTEGER NOT NULL,
                phase_history TEXT NOT NULL,
                phase_exit_met TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS project_artifacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id TEXT NOT NULL,
                artifact_type TEXT NOT NULL,
                title TEXT NOT NULL,
                phase_id INTEGER,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_project_artifacts_project
            ON project_artifacts(project_id)
            """
        )
        conn.commit()


def _json_list(value: str | None, fallback: list[int]) -> list[int]:
    if not value:
        return fallback

    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return fallback

    if not isinstance(parsed, list):
        return fallback

    phase_ids: list[int] = []
    for item in parsed:
        if isinstance(item, int) and 0 <= item <= 5 and item not in phase_ids:
            phase_ids.append(item)

    return phase_ids or fallback


def load_or_create_session(session_id: str, project_id: str) -> dict[str, Any]:
    init_session_db()

    with DB_LOCK, _connect() as conn:
        row = conn.execute(
            "SELECT * FROM sessions WHERE id = ?",
            (session_id,),
        ).fetchone()

        if row is None:
            now = _now_iso()
            conn.execute(
                """
                INSERT INTO sessions (
                    id,
                    project_id,
                    current_phase,
                    phase_history,
                    phase_exit_met,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    project_id,
                    0,
                    json.dumps([0]),
                    json.dumps([]),
                    now,
                    now,
                ),
            )
            conn.commit()
            return {
                "project_id": project_id,
                "current_phase": 0,
                "phase_history": [0],
                "phase_exit_met": [],
            }

        return {
            "project_id": row["project_id"],
            "current_phase": int(row["current_phase"]),
            "phase_history": _json_list(row["phase_history"], [0]),
            "phase_exit_met": _json_list(row["phase_exit_met"], []),
        }


def save_session(
    session_id: str,
    project_id: str,
    current_phase: int,
    phase_history: list[int],
    phase_exit_met: set[int],
) -> None:
    init_session_db()

    with DB_LOCK, _connect() as conn:
        now = _now_iso()
        conn.execute(
            """
            INSERT INTO sessions (
                id,
                project_id,
                current_phase,
                phase_history,
                phase_exit_met,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                project_id = excluded.project_id,
                current_phase = excluded.current_phase,
                phase_history = excluded.phase_history,
                phase_exit_met = excluded.phase_exit_met,
                updated_at = excluded.updated_at
            """,
            (
                session_id,
                project_id,
                current_phase,
                json.dumps(phase_history),
                json.dumps(sorted(phase_exit_met)),
                now,
                now,
            ),
        )
        conn.commit()


def create_project_artifact(
    project_id: str,
    artifact_type: str,
    title: str,
    content: str,
    phase_id: int | None = None,
) -> dict[str, Any]:
    init_session_db()

    with DB_LOCK, _connect() as conn:
        now = _now_iso()
        cursor = conn.execute(
            """
            INSERT INTO project_artifacts (
                project_id,
                artifact_type,
                title,
                phase_id,
                content,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                project_id,
                artifact_type,
                title,
                phase_id,
                content,
                now,
                now,
            ),
        )
        conn.commit()
        artifact_id = cursor.lastrowid

    return get_project_artifact(project_id, artifact_id)


def get_project_artifact(project_id: str, artifact_id: int) -> dict[str, Any]:
    init_session_db()

    with DB_LOCK, _connect() as conn:
        row = conn.execute(
            """
            SELECT *
            FROM project_artifacts
            WHERE project_id = ? AND id = ?
            """,
            (project_id, artifact_id),
        ).fetchone()

    if row is None:
        raise KeyError(f"Project artifact not found: {artifact_id}")

    return dict(row)


def list_project_artifacts(project_id: str) -> list[dict[str, Any]]:
    init_session_db()

    with DB_LOCK, _connect() as conn:
        rows = conn.execute(
            """
            SELECT *
            FROM project_artifacts
            WHERE project_id = ?
            ORDER BY updated_at DESC, id DESC
            """,
            (project_id,),
        ).fetchall()

    return [dict(row) for row in rows]
