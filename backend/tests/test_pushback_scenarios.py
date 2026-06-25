"""
Adversarial push-back scenarios mirroring the 4 manual QA cases:

  1. Software development project   -> chat tries to claim the whole project is done.
  2. Bridge building + doc upload    -> uploaded document evidences a LATE phase while
                                         an EARLY phase is still unaddressed.
  3. Starting a project with no idea -> vague/no-signal input, low-confidence and
                                         unparsable-LLM-output edge cases.
  4. Project already 2 weeks in,
     professor-assigned task         -> Review Mode check-in against an existing
                                         Guidance session; probes whether Review Mode
                                         has any push-back protection at all.

Same mocking conventions as backend/tests/test_push_back.py.
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import logging
logging.basicConfig(level=logging.INFO)

from services.session_service import SessionState, auto_validate_session_review
from services.chat_service import _prepare_chat_context, process_chat
from review_mode import REVIEW_CHECKLIST
from system_prompt import classify_phase, resolve_active_phase


def _mock_retrieve(mock_retrieve):
    mock_retrieve.return_value.context = "fake context"
    mock_retrieve.return_value.sources = []
    mock_retrieve.return_value.used = True
    mock_retrieve.return_value.top_k = 3
    mock_retrieve.return_value.candidate_count = 5
    mock_retrieve.return_value.preview = ""
    mock_retrieve.return_value.retrieval_mode = "local"
    mock_retrieve.return_value.embedding_degraded = False


def _mock_llm_config():
    mock_llm_config = MagicMock()
    mock_llm_config.base_url = "http://fake"
    mock_llm_config.api_key = "fake"
    mock_llm_config.model = "fake"
    return mock_llm_config


# ----------------------------------------------------------------------
# Scenario 1: Software development — claim full project is done in chat
# ----------------------------------------------------------------------
def test_software_dev_chat_cannot_skip_to_done():
    """Student in a software project claims the whole app is built and deployed
    in one message. Phase 0 evidence is still missing. Push-back must hold
    regardless of the project's domain (there is no software-vs-other branching)."""

    session = SessionState(
        current_phase=0,
        phase_history=[0],
        review_progress={
            "0": {
                "problem_statement": {"completed": False, "evidence": ""},
                "stakeholder_analysis": {"completed": False, "evidence": ""},
            }
        },
    )

    mock_classification = {
        "phase": 5,
        "phase_name": "Operate",
        "confidence": 0.95,
        "transition": "advance",
    }

    with patch("services.chat_service.get_or_create_session", return_value=session), \
         patch("services.chat_service.get_llm_config", return_value=_mock_llm_config()), \
         patch("services.chat_service.classify_phase", return_value=mock_classification), \
         patch("services.chat_service.retrieve_context") as mock_retrieve, \
         patch("services.chat_service.build_system_prompt", return_value=("system", {"version": "1.0"})):

        _mock_retrieve(mock_retrieve)

        res = _prepare_chat_context(
            user_message="I already built and deployed the whole app, it's live in production now.",
            session_id="sw-session",
            project_id="sw-project",
            conversation_history=[],
            request_id="req-sw-1",
            mode="guidance",
        )

        updated_session = res[1]
        assert updated_session.current_phase == 0, (
            f"Expected push-back to Phase 0, got {updated_session.current_phase}"
        )
        assert not (updated_session.phase_exit_met & set(range(6))), (
            "phase_exit_met should be cleared for all incomplete phases after push-back"
        )
        print("[OK] test_software_dev_chat_cannot_skip_to_done passed!")


# ----------------------------------------------------------------------
# Scenario 2: Bridge building + document upload — late-phase doc can't vault phases
# ----------------------------------------------------------------------
def test_bridge_doc_upload_cannot_skip_unaddressed_early_phase():
    """A structural-analysis/build document for a bridge project gets uploaded.
    AI validation marks Phase 2 (design doc, WBS) and Phase 3 (working build) as
    fully evidenced by the document, but Phase 0 (problem statement, stakeholder
    analysis) was never addressed. compute_recommended_phase must still gate on
    the earliest incomplete phase — the document cannot be used to vault ahead."""

    session_data = {
        "id": "bridge-session",
        "project_id": "bridge-project",
        "current_phase": 0,
        "phase_history": [0],
        "phase_exit_met": [],
        "review_progress": {
            "0": {
                "problem_statement": {"completed": False, "evidence": ""},
                "stakeholder_analysis": {"completed": False, "evidence": ""},
            }
        },
    }

    # AI validation result simulating an uploaded bridge design/build document:
    # it strongly evidences Phase 2 & 3 but says nothing about Phase 0.
    mock_ai_validation = {
        "0": {
            "problem_statement": {"completed": False, "evidence": ""},
            "stakeholder_analysis": {"completed": False, "evidence": ""},
        },
        "2": {
            "design_doc": {"completed": True, "evidence": "Structural design doc uploaded."},
            "wbs": {"completed": True, "evidence": "WBS uploaded with the design doc."},
        },
        "3": {
            "working_build": {"completed": True, "evidence": "Build log shows the bridge model is complete."},
        },
    }

    with patch("services.session_service.get_session", return_value=session_data), \
         patch("services.session_service.get_messages", return_value=[]), \
         patch("services.session_service.list_project_artifacts", return_value=[]), \
         patch("services.session_service.validate_review_checklist_with_ai", return_value=mock_ai_validation), \
         patch("services.session_service.persist_session") as mock_persist:

        # Mirrors artifact_service.create_artifact_payload's background validation call.
        res = auto_validate_session_review("bridge-session", update_current_phase=True, allow_advance=True)

        persisted_session = mock_persist.call_args.kwargs.get("session") or mock_persist.call_args[0][1]

        assert persisted_session.current_phase == 0, (
            f"Expected the doc upload to be blocked from skipping Phase 0, "
            f"got current_phase={persisted_session.current_phase}"
        )
        assert res["recommendedPhase"] == 0
        # Late-phase points should still show as completed in the checklist
        # (the doc's evidence isn't discarded) — it's only the *gate* that holds.
        phase2 = next(p for p in res["reviewProgress"]["phases"] if p["id"] == 2)
        assert phase2["completed"] is False, "Phase 2 has only 2/4 points evidenced, should not show fully complete"
        print("[OK] test_bridge_doc_upload_cannot_skip_unaddressed_early_phase passed!")


# ----------------------------------------------------------------------
# Scenario 3: Starting a project with no idea — vague input / no-signal edge cases
# ----------------------------------------------------------------------
def test_no_idea_yet_low_confidence_jump_is_rejected():
    """Brand-new, empty session. Student says they don't have an idea yet.
    If the classifier hallucinates a confident-sounding phase jump anyway but
    reports low confidence, resolve_active_phase's threshold must hold the
    student at their current phase regardless of push-back."""

    session = SessionState(current_phase=0, phase_history=[0], review_progress={})

    mock_classification = {
        "phase": 3,
        "phase_name": "Implement",
        "confidence": 0.2,
        "transition": "advance",
    }

    with patch("services.chat_service.get_or_create_session", return_value=session), \
         patch("services.chat_service.get_llm_config", return_value=_mock_llm_config()), \
         patch("services.chat_service.classify_phase", return_value=mock_classification), \
         patch("services.chat_service.retrieve_context") as mock_retrieve, \
         patch("services.chat_service.build_system_prompt", return_value=("system", {"version": "1.0"})):

        _mock_retrieve(mock_retrieve)

        res = _prepare_chat_context(
            user_message="Honestly I don't have an idea yet, not sure where to even start.",
            session_id="no-idea-session",
            project_id="no-idea-project",
            conversation_history=[],
            request_id="req-no-idea-1",
            mode="guidance",
        )

        updated_session = res[1]
        assert updated_session.current_phase == 0, (
            f"Low-confidence jump should be rejected, got current_phase={updated_session.current_phase}"
        )
        print("[OK] test_no_idea_yet_low_confidence_jump_is_rejected passed!")


def test_classify_phase_handles_unparsable_llm_output():
    """If the phase-classifier LLM call returns garbage (no JSON at all), classify_phase
    must fall back to a safe 'stay at current phase, zero confidence' result instead of
    raising — this is the literal no-signal case for a student with nothing to classify."""

    result = classify_phase(
        user_message="I don't have an idea yet.",
        history=[],
        current_phase=0,
        llm_call=lambda system, messages: "not json at all, the model went off the rails",
    )

    assert result["phase"] == 0
    assert result["confidence"] == 0.0
    assert result["transition"] == "stay"

    # And resolve_active_phase must keep the student in place given that result.
    resolved = resolve_active_phase(result, previous_phase=0)
    assert resolved == 0
    print("[OK] test_classify_phase_handles_unparsable_llm_output passed!")


# ----------------------------------------------------------------------
# Scenario 4: Project already 2 weeks in, professor task — Review Mode check-in
# ----------------------------------------------------------------------
def test_review_mode_gates_pushback_against_source_session_progress():
    """Guidance session has 2 weeks of real progress: Phase 0 & 1 fully evidenced,
    Phase 2 partially evidenced (professor-assigned docs already shared/discussed).
    A separate Review Mode session checks in against it via review_source_session_id.

    Part A: the review session must mirror current_phase/phase_history/phase_exit_met
    from the guidance session, and the snapshot must reflect the guidance session's
    real review_progress.

    Part B (adversarial): if the classifier proposes a confident jump to Phase 5 while
    Phase 2 is still incomplete, Review Mode must push back to Phase 2 — same gate as
    Guidance Mode, just reading the source guidance session's evidence since Review
    Mode has no checklist of its own.
    """

    phase0_progress = {pt["id"]: {"completed": True, "evidence": "done"} for pt in REVIEW_CHECKLIST[0]}
    phase1_progress = {pt["id"]: {"completed": True, "evidence": "done"} for pt in REVIEW_CHECKLIST[1]}
    phase2_progress = {
        REVIEW_CHECKLIST[2][0]["id"]: {"completed": True, "evidence": "design doc shared by professor"},
    }

    guidance_session = SessionState(
        current_phase=2,
        phase_history=[0, 1, 2],
        phase_exit_met={0, 1},
        review_progress={"0": phase0_progress, "1": phase1_progress, "2": phase2_progress},
        project_id="capstone-project",
    )
    review_session = SessionState(current_phase=0, phase_history=[0], project_id="capstone-project")

    def _get_or_create_session(session_id, project_id):
        if session_id == "guidance-sess":
            return guidance_session
        return review_session

    mock_classification = {
        "phase": 5,
        "phase_name": "Operate",
        "confidence": 0.97,
        "transition": "advance",
    }

    with patch("services.chat_service.get_or_create_session", side_effect=_get_or_create_session), \
         patch("services.chat_service.get_llm_config", return_value=_mock_llm_config()), \
         patch("services.chat_service.classify_phase", return_value=mock_classification), \
         patch("services.chat_service.retrieve_context") as mock_retrieve, \
         patch("services.chat_service.build_system_prompt", return_value=("system", {"version": "1.0"})):

        _mock_retrieve(mock_retrieve)

        res = _prepare_chat_context(
            user_message="Are we done? I think we can present this now.",
            session_id="review-sess",
            project_id="capstone-project",
            conversation_history=[],
            request_id="req-review-1",
            mode="review",
            review_source_session_id="guidance-sess",
        )

        updated_session = res[1]
        system_prompt = res[4]

        # Part A: mirrored state + accurate snapshot.
        assert 2 in updated_session.phase_history
        assert "design doc shared by professor" in system_prompt, (
            "Review snapshot should reflect the guidance session's real progress"
        )

        # Part B: push-back gate now applies in review mode too.
        assert updated_session.current_phase == 2, (
            f"Expected Review Mode to push back to Phase 2 (oldest incomplete in the "
            f"source guidance session), got {updated_session.current_phase}"
        )
        print("[OK] test_review_mode_gates_pushback_against_source_session_progress passed!")


# ----------------------------------------------------------------------
# Category A (extra) — Software development: legitimate multi-phase advance
# ----------------------------------------------------------------------
def test_phases_0_1_2_complete_allows_direct_advance_to_phase_3():
    """Phases 0, 1, and 2 are all fully evidenced. The classifier proposes Phase 3.
    This must be ALLOWED — push-back only blocks jumps PAST an incomplete phase,
    it must never block a legitimate advance once everything before it is done."""

    progress = {
        str(i): {pt["id"]: {"completed": True, "evidence": "done"} for pt in REVIEW_CHECKLIST[i]}
        for i in range(3)
    }
    session = SessionState(current_phase=2, phase_history=[0, 1, 2], review_progress=progress)

    mock_classification = {"phase": 3, "phase_name": "Implement", "confidence": 0.9, "transition": "advance"}

    with patch("services.chat_service.get_or_create_session", return_value=session), \
         patch("services.chat_service.get_llm_config", return_value=_mock_llm_config()), \
         patch("services.chat_service.classify_phase", return_value=mock_classification), \
         patch("services.chat_service.retrieve_context") as mock_retrieve, \
         patch("services.chat_service.build_system_prompt", return_value=("system", {"version": "1.0"})), \
         patch("services.chat_service.validate_current_phase_criteria", return_value={}):

        _mock_retrieve(mock_retrieve)

        res = _prepare_chat_context(
            user_message="We've nailed down the design, WBS, timeline and test plan, ready to start building.",
            session_id="adv-session",
            project_id="adv-project",
            conversation_history=[],
            request_id="req-adv-1",
            mode="guidance",
        )

        updated_session = res[1]
        assert updated_session.current_phase == 3, (
            f"Expected legitimate advance to Phase 3, got {updated_session.current_phase}"
        )
        print("[OK] test_phases_0_1_2_complete_allows_direct_advance_to_phase_3 passed!")


def test_phase_2_incomplete_blocks_jump_to_phase_3_even_with_0_1_done():
    """Phases 0 & 1 are fully done, but Phase 2 is only partially evidenced.
    The classifier proposes Phase 3 anyway — must push back to 2, proving that
    finishing earlier phases does NOT excuse an unfinished one in between."""

    progress = {
        "0": {pt["id"]: {"completed": True, "evidence": "done"} for pt in REVIEW_CHECKLIST[0]},
        "1": {pt["id"]: {"completed": True, "evidence": "done"} for pt in REVIEW_CHECKLIST[1]},
        "2": {REVIEW_CHECKLIST[2][0]["id"]: {"completed": True, "evidence": "design doc only"}},
    }
    session = SessionState(current_phase=2, phase_history=[0, 1, 2], review_progress=progress)

    mock_classification = {"phase": 3, "phase_name": "Implement", "confidence": 0.9, "transition": "advance"}

    with patch("services.chat_service.get_or_create_session", return_value=session), \
         patch("services.chat_service.get_llm_config", return_value=_mock_llm_config()), \
         patch("services.chat_service.classify_phase", return_value=mock_classification), \
         patch("services.chat_service.retrieve_context") as mock_retrieve, \
         patch("services.chat_service.build_system_prompt", return_value=("system", {"version": "1.0"})), \
         patch("services.chat_service.validate_current_phase_criteria", return_value={}):

        _mock_retrieve(mock_retrieve)

        res = _prepare_chat_context(
            user_message="Let's start building now.",
            session_id="blocked-session",
            project_id="blocked-project",
            conversation_history=[],
            request_id="req-blocked-1",
            mode="guidance",
        )

        updated_session = res[1]
        assert updated_session.current_phase == 2, (
            f"Expected push-back to Phase 2 (still incomplete), got {updated_session.current_phase}"
        )
        print("[OK] test_phase_2_incomplete_blocks_jump_to_phase_3_even_with_0_1_done passed!")


# ----------------------------------------------------------------------
# Category B (extra) — Bridge building + upload: allow_advance guard rail
# ----------------------------------------------------------------------
def test_auto_validate_never_advances_without_allow_advance_flag():
    """A generic re-validation pass (no allow_advance flag, e.g. a periodic background
    check) finds that Phase 0 is now fully evidenced, which would recommend Phase 1.
    Without allow_advance=True explicitly passed, the student must NOT be moved
    forward — only the artifact-upload path is allowed to auto-advance."""

    session_data = {
        "id": "guard-session",
        "project_id": "guard-project",
        "current_phase": 0,
        "phase_history": [0],
        "phase_exit_met": [],
        "review_progress": {
            "0": {pt["id"]: {"completed": False, "evidence": ""} for pt in REVIEW_CHECKLIST[0]},
        },
    }

    mock_ai_validation = {
        "0": {pt["id"]: {"completed": True, "evidence": "all addressed"} for pt in REVIEW_CHECKLIST[0]},
    }

    with patch("services.session_service.get_session", return_value=session_data), \
         patch("services.session_service.get_messages", return_value=[]), \
         patch("services.session_service.list_project_artifacts", return_value=[]), \
         patch("services.session_service.validate_review_checklist_with_ai", return_value=mock_ai_validation), \
         patch("services.session_service.persist_session") as mock_persist:

        # NOTE: allow_advance left at its default (False).
        res = auto_validate_session_review("guard-session", update_current_phase=True)

        persisted_session = mock_persist.call_args.kwargs.get("session") or mock_persist.call_args[0][1]

        assert persisted_session.current_phase == 0, (
            f"Expected no auto-advance without allow_advance=True, "
            f"got current_phase={persisted_session.current_phase}"
        )
        assert res["recommendedPhase"] == 1, "Sanity check: evidence really did recommend Phase 1"
        print("[OK] test_auto_validate_never_advances_without_allow_advance_flag passed!")


def test_artifact_deletion_rolls_back_phase_after_evidence_removed():
    """Student had advanced to Phase 2 because an uploaded document evidenced
    Phase 0 & 1. The document gets deleted; re-validation (mirroring
    artifact_service.delete_artifact_payload) finds Phase 0 evidence gone.
    The session must be pushed back to Phase 0."""

    session_data = {
        "id": "delete-session",
        "project_id": "delete-project",
        "current_phase": 2,
        "phase_history": [0, 1, 2],
        "phase_exit_met": [0, 1],
        "review_progress": {
            "0": {pt["id"]: {"completed": True, "evidence": "from deleted doc"} for pt in REVIEW_CHECKLIST[0]},
            "1": {pt["id"]: {"completed": True, "evidence": "from deleted doc"} for pt in REVIEW_CHECKLIST[1]},
        },
    }

    # Post-deletion re-validation: Phase 0's evidence is gone now.
    mock_ai_validation = {
        "0": {pt["id"]: {"completed": False, "evidence": ""} for pt in REVIEW_CHECKLIST[0]},
        "1": {pt["id"]: {"completed": True, "evidence": "still discussed in chat"} for pt in REVIEW_CHECKLIST[1]},
    }

    with patch("services.session_service.get_session", return_value=session_data), \
         patch("services.session_service.get_messages", return_value=[]), \
         patch("services.session_service.list_project_artifacts", return_value=[]), \
         patch("services.session_service.validate_review_checklist_with_ai", return_value=mock_ai_validation), \
         patch("services.session_service.persist_session") as mock_persist:

        res = auto_validate_session_review("delete-session", update_current_phase=True, allow_advance=True)

        persisted_session = mock_persist.call_args.kwargs.get("session") or mock_persist.call_args[0][1]

        assert persisted_session.current_phase == 0, (
            f"Expected rollback to Phase 0 after evidence was removed, "
            f"got current_phase={persisted_session.current_phase}"
        )
        print("[OK] test_artifact_deletion_rolls_back_phase_after_evidence_removed passed!")


# ----------------------------------------------------------------------
# Category C (extra) — Start without idea: out-of-range hallucinated phase ids
# ----------------------------------------------------------------------
def test_out_of_range_hallucinated_phase_is_gated_when_evidence_incomplete():
    """Fresh, empty session. The classifier hallucinates a wildly out-of-range
    phase (12) with high confidence. The push-back gate must still hold: any
    incomplete phase blocks ANY proposed phase greater than it, no matter how
    far out of range that proposal is."""

    session = SessionState(current_phase=0, phase_history=[0], review_progress={})

    mock_classification = {"phase": 12, "phase_name": "Unknown", "confidence": 0.99, "transition": "advance"}

    with patch("services.chat_service.get_or_create_session", return_value=session), \
         patch("services.chat_service.get_llm_config", return_value=_mock_llm_config()), \
         patch("services.chat_service.classify_phase", return_value=mock_classification), \
         patch("services.chat_service.retrieve_context") as mock_retrieve, \
         patch("services.chat_service.build_system_prompt", return_value=("system", {"version": "1.0"})), \
         patch("services.chat_service.validate_current_phase_criteria", return_value={}):

        _mock_retrieve(mock_retrieve)

        res = _prepare_chat_context(
            user_message="I have no idea what to do, just put me wherever.",
            session_id="hallucinated-session",
            project_id="hallucinated-project",
            conversation_history=[],
            request_id="req-hallucinated-1",
            mode="guidance",
        )

        updated_session = res[1]
        assert updated_session.current_phase == 0, (
            f"Expected gate to hold regardless of how out-of-range the proposal is, "
            f"got {updated_session.current_phase}"
        )
        print("[OK] test_out_of_range_hallucinated_phase_is_gated_when_evidence_incomplete passed!")


def test_out_of_range_hallucinated_phase_when_all_complete_is_clamped():
    """All 6 phases are fully evidenced (project finished). The classifier still
    hallucinates an out-of-range phase (9). Found during testing: this used to
    crash with IndexError (chat_service.py indexed the fixed 6-phase checklist
    list with the raw, unclamped phase id). Fixed by clamping phase_id into
    [0, 5] right after resolve_active_phase. This test guards that fix."""

    progress = {
        str(i): {pt["id"]: {"completed": True, "evidence": "done"} for pt in REVIEW_CHECKLIST[i]}
        for i in range(6)
    }
    session = SessionState(current_phase=5, phase_history=list(range(6)), review_progress=progress)

    mock_classification = {"phase": 9, "phase_name": "Unknown", "confidence": 0.99, "transition": "advance"}

    with patch("services.chat_service.get_or_create_session", return_value=session), \
         patch("services.chat_service.get_llm_config", return_value=_mock_llm_config()), \
         patch("services.chat_service.classify_phase", return_value=mock_classification), \
         patch("services.chat_service.retrieve_context") as mock_retrieve, \
         patch("services.chat_service.build_system_prompt", return_value=("system", {"version": "1.0"})), \
         patch("services.chat_service.validate_current_phase_criteria", return_value={}):

        _mock_retrieve(mock_retrieve)

        res = _prepare_chat_context(
            user_message="Are we totally done now?",
            session_id="finished-session",
            project_id="finished-project",
            conversation_history=[],
            request_id="req-finished-1",
            mode="guidance",
        )

        updated_session = res[1]
        assert updated_session.current_phase == 5, (
            f"Expected out-of-range phase to clamp to the last valid phase (5), "
            f"got {updated_session.current_phase}"
        )
        print("[OK] test_out_of_range_hallucinated_phase_when_all_complete_is_clamped passed!")


# ----------------------------------------------------------------------
# Category D (extra) — Existing project / Review Mode: no source session wired
# ----------------------------------------------------------------------
def test_review_mode_without_source_session_falls_back_to_own_progress():
    """Review Mode opened with no review_source_session_id at all (e.g. the
    professor's review tab isn't linked to a specific guidance session). The
    gate must fall back to the review session's own stored review_progress
    instead of silently skipping the check."""

    progress = {
        "0": {pt["id"]: {"completed": True, "evidence": "done"} for pt in REVIEW_CHECKLIST[0]},
        "1": {pt["id"]: {"completed": True, "evidence": "done"} for pt in REVIEW_CHECKLIST[1]},
        "2": {REVIEW_CHECKLIST[2][0]["id"]: {"completed": True, "evidence": "partial"}},
    }
    session = SessionState(current_phase=2, phase_history=[0, 1, 2], review_progress=progress)

    mock_classification = {"phase": 5, "phase_name": "Operate", "confidence": 0.95, "transition": "advance"}

    with patch("services.chat_service.get_or_create_session", return_value=session), \
         patch("services.chat_service.get_llm_config", return_value=_mock_llm_config()), \
         patch("services.chat_service.classify_phase", return_value=mock_classification), \
         patch("services.chat_service.retrieve_context") as mock_retrieve, \
         patch("services.chat_service.build_system_prompt", return_value=("system", {"version": "1.0"})):

        _mock_retrieve(mock_retrieve)

        res = _prepare_chat_context(
            user_message="I think we're ready to present.",
            session_id="standalone-review-sess",
            project_id="standalone-project",
            conversation_history=[],
            request_id="req-standalone-1",
            mode="review",
            review_source_session_id=None,
        )

        updated_session = res[1]
        assert updated_session.current_phase == 2, (
            f"Expected fallback gate to push back to Phase 2, got {updated_session.current_phase}"
        )
        print("[OK] test_review_mode_without_source_session_falls_back_to_own_progress passed!")


# ----------------------------------------------------------------------
# Category D (extra) — Non-streaming /chat must report the SOURCE session's
# checklist in Review Mode, not the local review session's empty one.
# ----------------------------------------------------------------------
def test_process_chat_review_mode_reports_source_session_review_progress():
    """Found via live API testing: process_chat (the non-streaming /chat endpoint)
    built reviewProgress/phaseProgress from the local review-mode session's own
    state, which is never populated with checklist data in Review Mode. The
    streaming endpoint (process_chat_stream) already re-fetches the linked
    guidance session for its 'done' event; process_chat must do the same so a
    client calling /chat (not /chat/stream) gets the real checklist too."""

    phase0_progress = {pt["id"]: {"completed": True, "evidence": "done"} for pt in REVIEW_CHECKLIST[0]}
    guidance_session = SessionState(
        current_phase=1,
        phase_history=[0, 1],
        phase_exit_met={0},
        review_progress={"0": phase0_progress},
        project_id="report-project",
    )
    review_session = SessionState(current_phase=0, phase_history=[0], project_id="report-project")

    def _get_or_create_session(session_id, project_id):
        if session_id == "guidance-report-sess":
            return guidance_session
        return review_session

    mock_classification = {"phase": 5, "phase_name": "Operate", "confidence": 0.9, "transition": "advance"}

    with patch("services.chat_service.get_or_create_session", side_effect=_get_or_create_session), \
         patch("services.chat_service.get_llm_config", return_value=_mock_llm_config()), \
         patch("services.chat_service.classify_phase", return_value=mock_classification), \
         patch("services.chat_service.retrieve_context") as mock_retrieve, \
         patch("services.chat_service.build_system_prompt", return_value=("system", {"version": "1.0"})), \
         patch("services.chat_service.llm_chat_completion", return_value="Some reply"), \
         patch("services.chat_service.get_messages", return_value=[]), \
         patch("services.chat_service.save_message"), \
         patch("services.chat_service.persist_session"), \
         patch("services.chat_service.update_session_name"), \
         patch("services.chat_service.auto_validate_session_review"):

        _mock_retrieve(mock_retrieve)

        result = process_chat(
            user_message="Are we done?",
            session_id="review-report-sess",
            project_id="report-project",
            conversation_history=[],
            request_id="req-report-1",
            mode="review",
            review_source_session_id="guidance-report-sess",
        )

        assert result["phaseProgress"]["current"] == 1, (
            f"Expected reported phase to be the guidance session's real phase (1), "
            f"got {result['phaseProgress']['current']}"
        )
        phase0 = next(p for p in result["reviewProgress"]["phases"] if p["id"] == 0)
        assert phase0["completed"] is True and phase0["completedCount"] == 4, (
            "Expected the real guidance session's Phase 0 evidence to show up, "
            f"got completed={phase0['completed']} count={phase0['completedCount']}"
        )
        print("[OK] test_process_chat_review_mode_reports_source_session_review_progress passed!")


if __name__ == "__main__":
    print("Running EngiBuddy push-back adversarial scenario tests...")
    test_software_dev_chat_cannot_skip_to_done()
    test_bridge_doc_upload_cannot_skip_unaddressed_early_phase()
    test_no_idea_yet_low_confidence_jump_is_rejected()
    test_classify_phase_handles_unparsable_llm_output()
    test_review_mode_gates_pushback_against_source_session_progress()
    test_phases_0_1_2_complete_allows_direct_advance_to_phase_3()
    test_phase_2_incomplete_blocks_jump_to_phase_3_even_with_0_1_done()
    test_auto_validate_never_advances_without_allow_advance_flag()
    test_artifact_deletion_rolls_back_phase_after_evidence_removed()
    test_out_of_range_hallucinated_phase_is_gated_when_evidence_incomplete()
    test_out_of_range_hallucinated_phase_when_all_complete_is_clamped()
    test_review_mode_without_source_session_falls_back_to_own_progress()
    test_process_chat_review_mode_reports_source_session_review_progress()
    print("All push-back scenario tests passed successfully!")
