"""
Vector RAG module for EngiBuddy.

The retriever builds small chunks from global course knowledge and optional
per-project artifacts, stores embeddings in SQLite, and retrieves phase-aware
context by cosine similarity with a lightweight keyword re-rank.
"""

import hashlib
import json
import logging
import math
import os
import re
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests

from db import DB_LOCK, DB_PATH, init_session_db

logger = logging.getLogger(__name__)


@dataclass
class RagResult:
    """Context plus lightweight metadata for API/UI debugging."""

    context: str
    sources: list[str]
    preview: str
    retrieval_mode: str

    @property
    def used(self) -> bool:
        return bool(self.context.strip())


@dataclass
class SourceChunk:
    """A chunk ready to embed and store."""

    scope: str
    project_id: str | None
    phase_id: int
    source: str
    chunk_index: int
    text: str

    @property
    def text_hash(self) -> str:
        return _hash_text(self.text)

    @property
    def chunk_id(self) -> str:
        identity = "|".join(
            [
                self.scope,
                self.project_id or "",
                str(self.phase_id),
                self.source,
                str(self.chunk_index),
                self.text_hash,
            ]
        )
        return hashlib.sha256(identity.encode("utf-8")).hexdigest()


@dataclass
class RetrievedChunk:
    """A chunk returned by vector search."""

    source: str
    text: str
    similarity: float
    keyword_score: float
    final_score: float
    scope: str


PHASE_NAMES_MAP = {
    0: "Empathize",
    1: "Conceive",
    2: "Design",
    3: "Implement",
    4: "Test/Revise",
    5: "Operate",
}


PHASE_KEYWORD_WEIGHTS = {
    0: {
        "empathize": 2.0,
        "user": 2.0,
        "interview": 3.0,
        "observation": 2.5,
        "pain point": 3.0,
        "stakeholder": 2.5,
        "how might we": 3.5,
        "stakeholder map": 3.5,
        "problem statement": 2.5,
    },
    1: {
        "conceive": 2.0,
        "problem statement": 3.0,
        "scope": 3.0,
        "success criteria": 3.0,
        "constraint": 2.0,
        "requirement": 2.5,
        "solution concept": 3.0,
        "alternative": 2.5,
        "trade-off": 3.0,
        "tradeoff": 3.0,
    },
    2: {
        "design": 2.0,
        "research": 2.0,
        "architecture": 3.0,
        "technology": 2.0,
        "technology choice": 4.0,
        "technology options": 4.0,
        "compare": 3.0,
        "comparison": 3.0,
        "trade-off": 3.5,
        "trade-offs": 3.5,
        "proof-of-concept": 3.0,
        "wbs": 3.5,
        "timeline": 3.0,
        "planning": 2.0,
        "architecture diagram": 3.5,
        "interface": 2.5,
    },
    3: {
        "implement": 2.0,
        "build": 2.0,
        "code": 2.0,
        "wiring": 2.0,
        "debug": 2.5,
        "debugging protocol": 4.0,
        "unit test": 4.0,
        "integration test": 3.5,
        "compile": 2.0,
        "merge": 2.0,
    },
    4: {
        "test": 2.0,
        "revise": 2.5,
        "validation": 3.0,
        "acceptance": 3.0,
        "acceptance test": 4.0,
        "criterion": 2.5,
        "success criteria": 4.5,
        "peer critique": 4.0,
        "iterate": 2.0,
        "stakeholder re-test": 3.5,
    },
    5: {
        "operate": 2.0,
        "deploy": 2.0,
        "demo": 2.0,
        "presentation": 3.5,
        "report": 2.5,
        "final report": 4.0,
        "handover": 3.0,
        "handover doc": 4.0,
        "retrospective": 3.0,
    },
}


HEADING_RE = re.compile(r"^#{2,3}\s+.+$", re.MULTILINE)
WORD_RE = re.compile(r"[a-z0-9][a-z0-9-]{2,}", re.IGNORECASE)
LOCAL_EMBEDDING_DIM = 384
GLOBAL_SCOPE = "global"
PROJECT_SCOPE = "project"
GENERIC_PHASE_ID = -1


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _now_iso() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def _init_rag_db() -> None:
    init_session_db()
    with DB_LOCK, _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS rag_chunks (
                id TEXT PRIMARY KEY,
                scope TEXT NOT NULL,
                project_id TEXT,
                phase_id INTEGER NOT NULL,
                source TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                text_hash TEXT NOT NULL,
                text TEXT NOT NULL,
                embedding_provider TEXT NOT NULL,
                embedding_model TEXT NOT NULL,
                embedding TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_rag_chunks_lookup
            ON rag_chunks(scope, project_id, phase_id, embedding_provider, embedding_model)
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS rag_index_meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def _normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _hash_text(text: str) -> str:
    return hashlib.sha256(_normalize_whitespace(text).encode("utf-8")).hexdigest()


def _split_by_headings(content: str) -> list[str]:
    matches = list(HEADING_RE.finditer(content))
    if not matches:
        return []

    sections: list[str] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(content)
        section = content[match.start() : end].strip()
        if section:
            sections.append(section)

    preface = content[: matches[0].start()].strip()
    if preface:
        sections.insert(0, preface)

    return sections


def _split_by_blank_lines(content: str) -> list[str]:
    return [
        section.strip()
        for section in re.split(r"\n\s*\n+", content)
        if section.strip()
    ]


def _split_sections(content: str) -> list[str]:
    sections = _split_by_headings(content) or _split_by_blank_lines(content)
    return [_normalize_whitespace(section) for section in sections if section.strip()]


def _chunk_text(text: str, max_words: int = 320, overlap_words: int = 40) -> list[str]:
    words = text.split()
    if len(words) <= max_words:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(words):
        end = min(start + max_words, len(words))
        chunks.append(" ".join(words[start:end]))
        if end == len(words):
            break
        start = max(end - overlap_words, start + 1)

    return chunks


def _query_terms(user_message: str) -> list[str]:
    seen: set[str] = set()
    terms: list[str] = []
    for term in WORD_RE.findall(user_message.lower()):
        if term not in seen:
            seen.add(term)
            terms.append(term)
    return terms


def _score_section(section: str, phase_id: int, query_terms: list[str]) -> float:
    section_lower = section.lower()
    phase_name = PHASE_NAMES_MAP.get(phase_id, "").lower()
    score = 0.0

    if phase_name:
        score += section_lower.count(phase_name) * 8.0

    for phrase, weight in PHASE_KEYWORD_WEIGHTS.get(phase_id, {}).items():
        score += section_lower.count(phrase) * weight

    for term in query_terms:
        score += section_lower.count(term) * 0.5

    return score


def _phase_signal_score(text: str, phase_id: int) -> float:
    text_lower = text.lower()
    phase_name = PHASE_NAMES_MAP.get(phase_id, "").lower()
    score = text_lower.count(phase_name) * 8.0
    for phrase, weight in PHASE_KEYWORD_WEIGHTS.get(phase_id, {}).items():
        score += text_lower.count(phrase) * weight
    return score


def _infer_phase_id(text: str) -> int:
    scored = [(phase_id, _phase_signal_score(text, phase_id)) for phase_id in PHASE_NAMES_MAP]
    phase_id, score = max(scored, key=lambda item: item[1])
    return phase_id if score >= 2.0 else GENERIC_PHASE_ID


def _trim_section(section: str, max_chars: int = 800) -> str:
    section = section.strip()
    if len(section) <= max_chars:
        return section

    trimmed = section[:max_chars].rsplit(" ", 1)[0].strip()
    return f"{trimmed}..."


def _embedding_backend() -> tuple[str, str]:
    configured = os.getenv("RAG_EMBEDDING_PROVIDER", "auto").strip().lower()
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small").strip()

    if configured in {"local", "local-hash", "hash"}:
        return "local-hash", f"hash-{LOCAL_EMBEDDING_DIM}"

    if configured in {"openai", "auto"} and api_key:
        return "openai", model

    return "local-hash", f"hash-{LOCAL_EMBEDDING_DIM}"


def _embed_texts(texts: list[str], provider: str, model: str) -> list[list[float]]:
    if not texts:
        return []

    if provider == "openai":
        return _openai_embeddings(texts, model)

    return [_local_embedding(text) for text in texts]


def _openai_embeddings(texts: list[str], model: str) -> list[list[float]]:
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise ValueError("OPENAI_API_KEY is required for OpenAI embeddings")

    response = requests.post(
        f"{base_url}/embeddings",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        json={"model": model, "input": texts},
        timeout=60,
    )
    if not response.ok:
        raise RuntimeError(f"Embedding API error {response.status_code}: {response.text[:300]}")

    data = response.json()
    embeddings = data.get("data", [])
    if len(embeddings) != len(texts):
        raise RuntimeError("Embedding API returned an unexpected number of vectors")

    return [item["embedding"] for item in sorted(embeddings, key=lambda item: item["index"])]


def _local_embedding(text: str) -> list[float]:
    vector = [0.0] * LOCAL_EMBEDDING_DIM
    for token in WORD_RE.findall(text.lower()):
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        index = int.from_bytes(digest[:4], "big") % LOCAL_EMBEDDING_DIM
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vector[index] += sign

    norm = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [value / norm for value in vector]


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    return sum(a * b for a, b in zip(left, right))


def _embedding_json(vector: list[float]) -> str:
    return json.dumps(vector, separators=(",", ":"))


def _parse_embedding(value: str) -> list[float]:
    parsed = json.loads(value)
    return [float(item) for item in parsed]


def _build_global_chunks() -> list[SourceChunk]:
    knowledge_dir = Path(__file__).parent.parent / "data" / "knowledge"
    chunks: list[SourceChunk] = []

    if not knowledge_dir.exists():
        logger.warning("Knowledge base directory not found: %s", knowledge_dir)
        return chunks

    files_found = sorted(list(knowledge_dir.glob("*.txt")) + list(knowledge_dir.glob("*.md")))
    for file_path in files_found:
        try:
            content = file_path.read_text(encoding="utf-8")
        except Exception as exc:
            logger.warning("Failed to read knowledge file %s: %s", file_path, exc)
            continue

        chunk_index = 0
        for section in _split_sections(content):
            phase_id = _infer_phase_id(section)
            for chunk in _chunk_text(section):
                chunks.append(
                    SourceChunk(
                        scope=GLOBAL_SCOPE,
                        project_id=None,
                        phase_id=phase_id,
                        source=file_path.name,
                        chunk_index=chunk_index,
                        text=chunk,
                    )
                )
                chunk_index += 1

    return chunks


def _build_project_chunks(project_id: str) -> list[SourceChunk]:
    init_session_db()
    with DB_LOCK, _connect() as conn:
        rows = conn.execute(
            """
            SELECT id, artifact_type, title, phase_id, content
            FROM project_artifacts
            WHERE project_id = ?
            ORDER BY id ASC
            """,
            (project_id,),
        ).fetchall()

    chunks: list[SourceChunk] = []
    for row in rows:
        title = _normalize_whitespace(row["title"]) or f"artifact-{row['id']}"
        artifact_type = _normalize_whitespace(row["artifact_type"]) or "artifact"
        source = f"project:{artifact_type}:{title}"
        content = _normalize_whitespace(row["content"])
        if not content:
            continue

        phase_id = row["phase_id"]
        if phase_id is None or not 0 <= int(phase_id) <= 5:
            phase_id = _infer_phase_id(content)
        else:
            phase_id = int(phase_id)

        for chunk_index, chunk in enumerate(_chunk_text(content)):
            chunks.append(
                SourceChunk(
                    scope=PROJECT_SCOPE,
                    project_id=project_id,
                    phase_id=phase_id,
                    source=source,
                    chunk_index=chunk_index,
                    text=chunk,
                )
            )

    return chunks


def _chunk_signature(chunks: list[SourceChunk]) -> str:
    payload = [
        {
            "id": chunk.chunk_id,
            "hash": chunk.text_hash,
            "phase": chunk.phase_id,
            "source": chunk.source,
        }
        for chunk in chunks
    ]
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def _meta_key(scope: str, provider: str, model: str, project_id: str | None = None) -> str:
    return f"{scope}:{project_id or '_global'}:{provider}:{model}"


def _read_meta(key: str) -> str | None:
    with DB_LOCK, _connect() as conn:
        row = conn.execute("SELECT value FROM rag_index_meta WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else None


def _write_meta(key: str, value: str) -> None:
    with DB_LOCK, _connect() as conn:
        conn.execute(
            """
            INSERT INTO rag_index_meta(key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
            """,
            (key, value, _now_iso()),
        )
        conn.commit()


def _replace_chunks(
    chunks: list[SourceChunk],
    scope: str,
    provider: str,
    model: str,
    project_id: str | None = None,
) -> None:
    texts = [chunk.text for chunk in chunks]
    embeddings = _embed_texts(texts, provider, model)
    now = _now_iso()

    with DB_LOCK, _connect() as conn:
        if scope == GLOBAL_SCOPE:
            conn.execute(
                """
                DELETE FROM rag_chunks
                WHERE scope = ? AND embedding_provider = ? AND embedding_model = ?
                """,
                (scope, provider, model),
            )
        else:
            conn.execute(
                """
                DELETE FROM rag_chunks
                WHERE scope = ? AND project_id = ? AND embedding_provider = ? AND embedding_model = ?
                """,
                (scope, project_id, provider, model),
            )

        conn.executemany(
            """
            INSERT INTO rag_chunks (
                id,
                scope,
                project_id,
                phase_id,
                source,
                chunk_index,
                text_hash,
                text,
                embedding_provider,
                embedding_model,
                embedding,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    chunk.chunk_id,
                    chunk.scope,
                    chunk.project_id,
                    chunk.phase_id,
                    chunk.source,
                    chunk.chunk_index,
                    chunk.text_hash,
                    chunk.text,
                    provider,
                    model,
                    _embedding_json(embedding),
                    now,
                )
                for chunk, embedding in zip(chunks, embeddings)
            ],
        )
        conn.commit()


def _ensure_global_index(provider: str, model: str) -> None:
    chunks = _build_global_chunks()
    signature = _chunk_signature(chunks)
    key = _meta_key(GLOBAL_SCOPE, provider, model)
    if _read_meta(key) == signature:
        return

    logger.info(
        "Rebuilding global RAG vector index: chunks=%s provider=%s model=%s",
        len(chunks),
        provider,
        model,
    )
    _replace_chunks(chunks, GLOBAL_SCOPE, provider, model)
    _write_meta(key, signature)


def _ensure_project_index(project_id: str | None, provider: str, model: str) -> None:
    if not project_id:
        return

    chunks = _build_project_chunks(project_id)
    signature = _chunk_signature(chunks)
    key = _meta_key(PROJECT_SCOPE, provider, model, project_id)
    if _read_meta(key) == signature:
        return

    logger.info(
        "Rebuilding project RAG vector index: project_id=%s chunks=%s provider=%s model=%s",
        project_id,
        len(chunks),
        provider,
        model,
    )
    _replace_chunks(chunks, PROJECT_SCOPE, provider, model, project_id)
    _write_meta(key, signature)


def _candidate_rows(
    phase_id: int,
    provider: str,
    model: str,
    project_id: str | None,
) -> list[sqlite3.Row]:
    with DB_LOCK, _connect() as conn:
        global_rows = conn.execute(
            """
            SELECT *
            FROM rag_chunks
            WHERE scope = ?
              AND embedding_provider = ?
              AND embedding_model = ?
              AND phase_id IN (?, ?)
            """,
            (GLOBAL_SCOPE, provider, model, phase_id, GENERIC_PHASE_ID),
        ).fetchall()

        project_rows: list[sqlite3.Row] = []
        if project_id:
            project_rows = conn.execute(
                """
                SELECT *
                FROM rag_chunks
                WHERE scope = ?
                  AND project_id = ?
                  AND embedding_provider = ?
                  AND embedding_model = ?
                  AND phase_id IN (?, ?)
                """,
                (PROJECT_SCOPE, project_id, provider, model, phase_id, GENERIC_PHASE_ID),
            ).fetchall()

    return list(project_rows) + list(global_rows)


def _retrieve_with_backend(
    user_message: str,
    phase_id: int,
    project_id: str | None,
    provider: str,
    model: str,
) -> RagResult:
    _init_rag_db()
    _ensure_global_index(provider, model)
    _ensure_project_index(project_id, provider, model)

    query_text = f"{PHASE_NAMES_MAP.get(phase_id, '')}: {user_message}"
    query_vector = _embed_texts([query_text], provider, model)[0]
    query_terms = _query_terms(user_message)
    rows = _candidate_rows(phase_id, provider, model, project_id)

    retrieved: list[RetrievedChunk] = []
    for row in rows:
        embedding = _parse_embedding(row["embedding"])
        similarity = _cosine_similarity(query_vector, embedding)
        keyword_score = _score_section(row["text"], phase_id, query_terms)
        scope_boost = 0.35 if row["scope"] == PROJECT_SCOPE else 0.0
        final_score = similarity + min(keyword_score, 25.0) / 25.0 + scope_boost
        retrieved.append(
            RetrievedChunk(
                source=row["source"],
                text=row["text"],
                similarity=similarity,
                keyword_score=keyword_score,
                final_score=final_score,
                scope=row["scope"],
            )
        )

    retrieved.sort(key=lambda item: item.final_score, reverse=True)
    top_chunks = retrieved[: int(os.getenv("RAG_TOP_K", "3"))]
    query_snippet = _normalize_whitespace(user_message)[:120]

    if not top_chunks:
        logger.info(
            "Vector RAG miss: phase=%s project=%s query=%r provider=%s",
            phase_id,
            project_id,
            query_snippet,
            provider,
        )
        return RagResult(context="", sources=[], preview="", retrieval_mode=f"vector:{provider}")

    sources: list[str] = []
    context_parts: list[str] = []
    for chunk in top_chunks:
        if chunk.source not in sources:
            sources.append(chunk.source)
        context_parts.append(f"Source: {chunk.source}\n{_trim_section(chunk.text)}")

    context = "\n\n".join(context_parts)
    logger.info(
        "Vector RAG hit: phase=%s project=%s query=%r provider=%s sources=%s scores=%s",
        phase_id,
        project_id,
        query_snippet,
        provider,
        sources,
        [
            {
                "final": round(chunk.final_score, 3),
                "cosine": round(chunk.similarity, 3),
                "keyword": round(chunk.keyword_score, 2),
            }
            for chunk in top_chunks
        ],
    )

    return RagResult(
        context=context,
        sources=sources,
        preview=_trim_section(context, max_chars=500),
        retrieval_mode=f"vector:{provider}",
    )


def retrieve_context(
    user_message: str,
    phase_id: int,
    project_id: str | None = None,
) -> RagResult:
    """
    Retrieve global + project-aware context for a message.

    The index is phase-aware: candidate chunks must match the current phase
    or be marked generic. Project chunks, when present, are searched alongside
    global course knowledge.
    """
    provider, model = _embedding_backend()

    try:
        return _retrieve_with_backend(user_message, phase_id, project_id, provider, model)
    except Exception as exc:
        if provider == "local-hash":
            logger.exception("Local vector RAG failed")
            return RagResult(context="", sources=[], preview="", retrieval_mode="vector:failed")

        logger.warning(
            "OpenAI embedding retrieval failed; falling back to local vectors: %s",
            exc,
        )
        return _retrieve_with_backend(
            user_message,
            phase_id,
            project_id,
            "local-hash",
            f"hash-{LOCAL_EMBEDDING_DIM}",
        )
