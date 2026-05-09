import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from system_prompt import classify_phase, contains_fabrication_signal, resolve_active_phase


def _fake_llm_call(raw: str):
    def _call(system: str, messages: list[dict]) -> str:
        _ = system
        _ = messages
        return raw

    return _call


def test_phase_regression_cases() -> None:
    cases = json.loads((ROOT / "evals" / "golden_phase_cases.json").read_text(encoding="utf-8"))
    for case in cases:
        current_phase = int(case["current_phase"])
        model_output = json.dumps(case["model_output"])
        classification = classify_phase(
            user_message="dummy",
            history=[],
            current_phase=current_phase,
            llm_call=_fake_llm_call(model_output),
        )
        resolved = resolve_active_phase(classification, previous_phase=current_phase, confidence_threshold=0.6)
        assert resolved == int(case["expected_phase"]), case["name"]


def test_fabrication_signal_regression() -> None:
    cases = json.loads((ROOT / "evals" / "golden_fabrication_cases.json").read_text(encoding="utf-8"))
    for text in cases:
        assert contains_fabrication_signal(text)
