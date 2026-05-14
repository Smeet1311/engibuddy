"""
Pytest tests for RAG retrieval — verifies phase-aware context retrieval
using the local-hash embedding backend (no API key required).
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

os.environ["RAG_EMBEDDING_PROVIDER"] = "local"

from rag import retrieve_context, RagResult


PHASE_QUERIES = [
    (0, "How do I interview users effectively?"),
    (1, "What is a good problem scope?"),
    (2, "How should I compare different technologies?"),
    (3, "My code won't compile."),
    (4, "Does my system meet the success criteria?"),
    (5, "How should I present my project?"),
]


def test_retrieve_returns_rag_result():
    result = retrieve_context("How do I interview users?", phase_id=0)
    assert isinstance(result, RagResult)


def test_retrieve_has_context_for_each_phase():
    for phase_id, query in PHASE_QUERIES:
        result = retrieve_context(query, phase_id=phase_id)
        assert result.context, f"Phase {phase_id}: expected RAG context, got empty"


def test_retrieve_sources_list_populated():
    result = retrieve_context("How do I interview users effectively?", phase_id=0)
    assert isinstance(result.sources, list)
    assert len(result.sources) > 0


def test_retrieve_mode_is_local():
    result = retrieve_context("debugging my LED circuit", phase_id=3)
    assert "local" in result.retrieval_mode


def test_retrieve_guidance_mode_boosts_top_k():
    guidance = retrieve_context("help me get started", phase_id=0, mode="guidance")
    review = retrieve_context("help me get started", phase_id=0, mode="review")
    assert guidance.top_k >= review.top_k


def test_retrieve_preview_is_truncated_context():
    result = retrieve_context("How do I present my final report?", phase_id=5)
    if result.context:
        assert len(result.preview) <= len(result.context)
