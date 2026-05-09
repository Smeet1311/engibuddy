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


def run() -> None:
    phase_cases = json.loads((ROOT / "evals" / "golden_phase_cases.json").read_text(encoding="utf-8"))
    fabrication_cases = json.loads((ROOT / "evals" / "golden_fabrication_cases.json").read_text(encoding="utf-8"))

    print("Phase regression:")
    for case in phase_cases:
        current_phase = int(case["current_phase"])
        classification = classify_phase(
            user_message="eval",
            history=[],
            current_phase=current_phase,
            llm_call=_fake_llm_call(json.dumps(case["model_output"])),
        )
        resolved = resolve_active_phase(classification, previous_phase=current_phase, confidence_threshold=0.6)
        ok = resolved == int(case["expected_phase"])
        print(f"- {case['name']}: {'PASS' if ok else 'FAIL'} (got {resolved})")

    print("\nAnti-fabrication regression:")
    for sample in fabrication_cases:
        ok = contains_fabrication_signal(sample)
        print(f"- {sample[:40]}...: {'PASS' if ok else 'FAIL'}")


if __name__ == "__main__":
    run()
