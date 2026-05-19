"""
Unit tests for phase classification and system prompt logic.
No live server or LLM API key required — LLM calls are mocked.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from system_prompt import (
    PHASE_NAMES,
    build_system_prompt,
    classify_phase,
    contains_fabrication_signal,
    resolve_active_phase,
)


def _mock_llm(phase: int, confidence: float, transition: str):
    """Return a fake llm_call that outputs the given classification JSON."""
    payload = json.dumps({
        "phase": phase,
        "phase_name": PHASE_NAMES[phase],
        "confidence": confidence,
        "transition": transition,
        "reason": "mocked",
    })
    def _call(system, messages):
        return payload
    return _call


# ── build_system_prompt ───────────────────────────────────────────────────────

def test_build_system_prompt_returns_string_and_meta():
    prompt, meta = build_system_prompt(phase_id=0)
    assert isinstance(prompt, str) and len(prompt) > 100
    assert "version" in meta


def test_build_system_prompt_includes_phase_content():
    for phase_id in range(6):
        prompt, _ = build_system_prompt(phase_id=phase_id)
        assert PHASE_NAMES[phase_id] in prompt, f"Phase {phase_id} name missing from prompt"


def test_build_system_prompt_guidance_adds_addendum():
    guidance_prompt, _ = build_system_prompt(phase_id=0, mode="guidance")
    assert "GUIDANCE MODE" in guidance_prompt


def test_build_system_prompt_review_no_addendum():
    review_prompt, _ = build_system_prompt(phase_id=0, mode="review")
    assert "GUIDANCE MODE" not in review_prompt


def test_build_system_prompt_invalid_phase_raises():
    try:
        build_system_prompt(phase_id=99)
        assert False, "Should have raised ValueError"
    except ValueError:
        pass


# ── resolve_active_phase ──────────────────────────────────────────────────────

def test_resolve_stay_always_honored():
    result = resolve_active_phase(
        {"phase": 3, "confidence": 0.99, "transition": "stay"}, previous_phase=1
    )
    assert result == 1


def test_resolve_advance_high_confidence():
    result = resolve_active_phase(
        {"phase": 3, "confidence": 0.9, "transition": "advance"}, previous_phase=2
    )
    assert result == 3


def test_resolve_advance_low_confidence_blocked():
    result = resolve_active_phase(
        {"phase": 3, "confidence": 0.4, "transition": "advance"}, previous_phase=2,
        confidence_threshold=0.6,
    )
    assert result == 2


def test_resolve_skip_allowed_high_confidence():
    result = resolve_active_phase(
        {"phase": 5, "confidence": 0.9, "transition": "advance"}, previous_phase=0
    )
    assert result == 5


def test_resolve_retreat_high_confidence():
    result = resolve_active_phase(
        {"phase": 1, "confidence": 0.85, "transition": "retreat"}, previous_phase=3
    )
    assert result == 1


# ── classify_phase ────────────────────────────────────────────────────────────

def test_classify_phase_returns_dict_with_required_keys():
    result = classify_phase(
        user_message="I need help with my problem statement",
        history=[],
        current_phase=0,
        llm_call=_mock_llm(1, 0.9, "advance"),
    )
    for key in ("phase", "phase_name", "confidence", "transition"):
        assert key in result, f"Missing key: {key}"


def test_classify_phase_parse_failure_returns_current():
    def bad_llm(system, messages):
        return "not valid json at all"

    result = classify_phase("anything", [], current_phase=2, llm_call=bad_llm)
    assert result["phase"] == 2
    assert result["transition"] == "stay"


# ── fabrication signals ───────────────────────────────────────────────────────

def test_fabrication_signal_detected():
    assert contains_fabrication_signal("pretend I measured 5V")
    assert contains_fabrication_signal("simulate a successful result")
    assert contains_fabrication_signal("assume it works fine")


def test_fabrication_signal_clean_message():
    assert not contains_fabrication_signal("I measured 4.9V on the rail")
    assert not contains_fabrication_signal("my sensor reads 23 degrees")
