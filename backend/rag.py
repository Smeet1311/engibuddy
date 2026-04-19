"""
Minimal RAG Module for EngiBuddy

Retrieves relevant context from the knowledge base based on the user message and current phase.
Uses simple keyword scoring (no embeddings yet).

Knowledge base location: data/knowledge/
Supported formats: .txt, .md files

Usage:
    from rag import retrieve_context
    context = retrieve_context(user_message="How do I interview users?", phase_id=0)
    if context:
        # Prepend context to system prompt
        ...
"""

import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Phase names for keyword matching
PHASE_NAMES_MAP = {
    0: "Empathize",
    1: "Conceive",
    2: "Design",
    3: "Implement",
    4: "Test/Revise",
    5: "Operate",
}

# Keywords associated with each phase (for improved matching)
PHASE_KEYWORDS = {
    0: ["empathize", "user", "interview", "observation", "pain point", "stakeholder"],
    1: ["conceive", "problem statement", "scope", "success criteria", "constraint", "requirement"],
    2: ["design", "research", "architecture", "technology", "wbs", "timeline", "planning"],
    3: ["implement", "build", "code", "wiring", "debug", "test", "compile", "merge"],
    4: ["test", "revise", "validation", "acceptance", "criterion", "iterate"],
    5: ["operate", "deploy", "demo", "presentation", "report", "handover"],
}


def retrieve_context(user_message: str, phase_id: int) -> str:
    """
    Retrieve relevant knowledge base context based on user message and phase.

    Strategy:
    1. Read all .txt/.md files from data/knowledge/
    2. Score each file/chunk by relevance:
       - Presence of current phase name (high priority)
       - Presence of phase-specific keywords
       - Presence of query words from user message
    3. Return top 1-2 relevant passages

    Args:
        user_message: The student's latest message.
        phase_id: The current phase (0-5).

    Returns:
        String containing relevant context (may be empty if no good match found).
        Format: "Reference context:\n{passage1}\n\n{passage2}"
    """
    # Determine knowledge base path (relative to backend/)
    backend_dir = Path(__file__).parent  # backend/
    knowledge_dir = backend_dir.parent / "data" / "knowledge"

    if not knowledge_dir.exists():
        logger.warning(f"Knowledge base directory not found: {knowledge_dir}")
        return ""

    # Read all relevant files
    files_found = list(knowledge_dir.glob("*.txt")) + list(knowledge_dir.glob("*.md"))
    if not files_found:
        logger.info(f"No knowledge files found in {knowledge_dir}")
        return ""

    # Normalize query terms
    query_terms = user_message.lower().split()
    phase_name = PHASE_NAMES_MAP.get(phase_id, "").lower()
    phase_keywords = [kw.lower() for kw in PHASE_KEYWORDS.get(phase_id, [])]

    # Score and collect passages
    passages: list[tuple[float, str, str]] = []  # (score, filename, text)

    for file_path in files_found:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            logger.warning(f"Failed to read knowledge file {file_path}: {e}")
            continue

        # Simple scoring: count relevant keyword occurrences
        content_lower = content.lower()
        score = 0.0

        # High priority: current phase name
        if phase_name and phase_name in content_lower:
            score += 10.0

        # Medium priority: phase keywords
        for kw in phase_keywords:
            score += content_lower.count(kw) * 2.0

        # Low priority: user query terms
        for term in query_terms:
            if len(term) > 2:  # Skip very short words
                score += content_lower.count(term) * 0.5

        if score > 0:
            passages.append((score, file_path.name, content))

    # Sort by score (descending) and take top 1-2
    passages.sort(key=lambda x: x[0], reverse=True)
    top_passages = passages[:2]

    if not top_passages:
        return ""

    # Format for inclusion in system prompt
    context_parts = []
    for score, filename, content in top_passages:
        # Trim to reasonable length (e.g., first 500 chars)
        trimmed = content[:500].strip()
        if not trimmed.endswith("."):
            trimmed = trimmed.rsplit(" ", 1)[0] + "..."  # Cut at word boundary
        context_parts.append(trimmed)
        logger.debug(f"RAG: Retrieved from {filename} (score={score:.1f})")

    return "\n\n".join(context_parts)
