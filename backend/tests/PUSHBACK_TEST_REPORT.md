# Push-Back Mechanism — Adversarial QA Report

Scope: stress-test the push-back gate between **Guidance Mode** and **Review Mode**
against the 4 teammate test scenarios, try to break it, fix what's actually broken,
and document anything left as a known/accepted gap.

Test file: `backend/tests/test_pushback_scenarios.py` (14 tests, mocked LLM).
Run with: `cd backend && python -m pytest tests/test_pushback_scenarios.py -v`

In addition to the mocked unit tests, this round also drove the **real backend
server** (`uvicorn main:app`) with **real HTTP requests and a real LLM**
(NVIDIA `meta/llama-3.3-70b-instruct` via the key in `.env`) for all 4
scenarios — see "Live API verification" below. Found a third real bug that
way (logic bugs hide at the seams between mocked-unit-test world and the real
multi-endpoint flow).

## Summary

| # | Scenario | Test(s) | Result |
|---|----------|---------|--------|
| 1 | Software development | `test_software_dev_chat_cannot_skip_to_done` | PASS |
| 1b | …legit multi-phase advance | `test_phases_0_1_2_complete_allows_direct_advance_to_phase_3` | PASS |
| 1c | …partial earlier phase still blocks | `test_phase_2_incomplete_blocks_jump_to_phase_3_even_with_0_1_done` | PASS |
| 2 | Bridge building + doc upload | `test_bridge_doc_upload_cannot_skip_unaddressed_early_phase` | PASS |
| 2b | …no silent auto-advance | `test_auto_validate_never_advances_without_allow_advance_flag` | PASS |
| 2c | …delete doc rolls phase back | `test_artifact_deletion_rolls_back_phase_after_evidence_removed` | PASS |
| 3 | Start without an idea | `test_no_idea_yet_low_confidence_jump_is_rejected` | PASS |
| 3b | …unparsable LLM output | `test_classify_phase_handles_unparsable_llm_output` | PASS |
| 3c | …out-of-range phase, evidence incomplete | `test_out_of_range_hallucinated_phase_is_gated_when_evidence_incomplete` | PASS |
| 3d | …out-of-range phase, all complete (bug) | `test_out_of_range_hallucinated_phase_when_all_complete_is_clamped` | PASS (fixed) |
| 4 | Project 2 weeks in, Review Mode | `test_review_mode_gates_pushback_against_source_session_progress` | PASS (bug fixed) |
| 4b | …Review Mode with no source session wired | `test_review_mode_without_source_session_falls_back_to_own_progress` | PASS |
| 4c | …non-streaming /chat reviewProgress in review mode (bug) | `test_process_chat_review_mode_reports_source_session_review_progress` | PASS (fixed) |

## Scenario walkthroughs

**1. Software development.** Student in Phase 0 (problem statement/stakeholder
analysis missing) claims in one chat message that the whole app is built and
deployed. Tried to get the gate to believe a single confident message. Push-back
held, forced back to Phase 0. Also checked the opposite: when Phases 0-2 are
genuinely fully evidenced, advancing straight to Phase 3 is allowed (no
false-positive blocking) — and if Phase 2 is only partially done, even with 0 & 1
finished, the jump to Phase 3 is still blocked. Domain (software vs. anything else)
doesn't matter — there's no domain-specific branching in the codebase, the same
generic 6-phase checklist gates everyone.

**2. Bridge building + document upload.** Tried uploading a "document" (mocked AI
validation result) that evidences a late phase (design doc, working build) while
Phase 0 is never addressed — the upload path explicitly allows auto-advance
(`allow_advance=True`), but `compute_recommended_phase` always returns the
*earliest* incomplete phase, so a late-stage document still can't vault the
checklist gate. Also verified the asymmetry is intentional and safe: a generic
re-validation call without `allow_advance=True` can push back but can never
silently advance a student — only the explicit upload path opts into advancing.
Confirmed deleting an uploaded document correctly rolls the phase back once its
evidence disappears.

**3. Starting a project with no idea.** Vague/empty input ("I don't have an idea
yet") with a low-confidence hallucinated phase jump is rejected by the confidence
threshold, independent of the push-back gate. Completely unparsable LLM output
(no JSON at all) falls back safely to "stay, zero confidence" instead of crashing.
Pushed further: fed the classifier a wildly out-of-range phase number (12, then 9)
to see what happens to a brand-new, no-evidence session and to a fully-finished
one — see "Bug found & fixed" below.

**4. Project already 2 weeks in (professor task), Review Mode check-in.** Built a
guidance session with 2 weeks of real progress (Phase 0 & 1 done, Phase 2
partial — matching "professor already shared documents"). Confirmed Review Mode
correctly mirrors phase state and shows the real checklist snapshot. Then tried to
break it: fed a confident phase-5 classification while Phase 2 was still
incomplete — see "Bug found & fixed" below. Also checked Review Mode opened with
no guidance session linked at all (no `review_source_session_id`) — it falls back
to its own stored progress and still gates correctly.

## Bugs found & fixed

1. **Review Mode had no push-back gate at all.** `chat_service.py` only ran the
   gate `if mode == "guidance"`. A confident phase jump in Review Mode flowed
   through completely ungated, regardless of real checklist evidence. **Fixed**:
   widened the gate to `mode in ("guidance", "review")`, sourcing the checklist
   evidence from the linked guidance session (`review_source_session`) when one
   is provided, falling back to the review session's own stored progress
   otherwise. (`chat_service.py:230-256`)

2. **Out-of-range hallucinated phase id crashed Guidance Mode once a project was
   100% complete.** If every phase was fully evidenced (`oldest_incomplete is
   None`) and the classifier still returned an out-of-range phase (e.g. 9), the
   gate had nothing to clamp against, and a later checklist-indexing line
   (`review_prog["phases"][phase_id]["points"]`) threw `IndexError: list index
   out of range` — a real 500 for the student. **Fixed**: `phase_id` is now
   clamped into `[0, 5]` immediately after `resolve_active_phase`, before any
   indexing happens. (`chat_service.py:225-233`)

3. **`/chat` (non-streaming) returned the wrong checklist in Review Mode.**
   `process_chat` built `reviewProgress`/`phaseProgress` from the local
   review-mode session's own state, which is never populated with checklist
   data in Review Mode (only `current_phase`/`phase_history`/`phase_exit_met`
   get mirrored from the source guidance session, never `review_progress`).
   The streaming endpoint (`process_chat_stream`) already had the correct
   fix for its `done` event — `process_chat` didn't. Confirmed live: a
   review-mode chat turn returned Phase 0 as 0/4 incomplete even though the
   real guidance session had it fully evidenced (4/4). The frontend
   (`chat-shell-base.tsx:405/419`) blindly applies whatever `reviewProgress`
   the chat response carries to the sidebar, so this would visibly corrupt
   the checklist UI after every Review Mode message. **Fixed**: mirrored the
   streaming endpoint's existing `review_payload_session` pattern into
   `process_chat`. (`chat_service.py:478-485`)

## Live API verification

Started the real backend (`uvicorn main:app`) and hit it with real HTTP
requests + the real configured LLM, isolated under `verify-*` / `*-report-*`
project and session ids so it doesn't collide with real data:

- **Scenario 1 (software dev)**: real `/chat` call claiming the app was fully
  built and deployed. Live classifier returned `phase=5, confidence=1.0`. Log:
  `Pushing back session verify-sw-session (mode=guidance) to oldest incomplete
  phase: 0 (LLM resolved 5)`. Response `phaseProgress.current = 0`. Confirmed.
- **Scenario 3 (no idea yet)**: real `/chat` call with "I don't have an idea
  yet" — no error, `phaseProgress.current = 0`.
- **Scenario 2 (bridge + upload)**: created a real session, uploaded a real
  artifact via `POST /projects/{id}/artifacts` worded to evidence Phase 2 & 3
  while Phase 0 was untouched. Confirmed via direct sqlite read (bypassing the
  API entirely) that `current_phase` stayed `0` throughout — never skipped
  ahead. **Operational finding, not a logic bug**: the background AI
  re-validation this upload triggers made a real call to NVIDIA's API that
  exceeded the hardcoded 90s `requests` timeout (`review_validation_service.py:53`)
  and was still unresolved after 4+ minutes of polling (eventually killed
  along with the test server, outcome never observed). Two other background
  validations (from scenarios 1 & 3) did hit and log that same 90s timeout.
  Worth knowing: under real load/latency, a student's checklist may silently
  fail to update after upload with zero user-facing indication — the gate
  itself stays safe (never advances on a failure), but the "this should
  auto-advance you" promise can quietly never happen.
- **Scenario 4 (2-weeks-in + Review Mode)**: built a real guidance session via
  2 real chat turns (Phase 0 fully evidenced, then legitimately advanced to
  Phase 1). Pointed a Review Mode session at it via `reviewSourceSessionId`
  and sent "I think we are completely done... can you confirm we are
  finished?". Live classifier returned `phase=5, confidence=0.9`. Response
  `phaseProgress.current = 1` — correctly gated to the real guidance session's
  oldest incomplete phase, not the hallucinated "done" claim. This is bug #1
  above, confirmed fixed against a live LLM call, not just a mock. Also
  surfaced bug #3 above (wrong `reviewProgress` field), fixed, and reverified
  live afterward — second real call showed `phase0 completed=True (4/4)`,
  `phase1 completed=False (0/4)`, matching the real guidance session exactly.

## Known gaps / non-issues

- None remaining open in the push-back/gate logic itself. The out-of-range
  phase id case is clamped (escalated from "document only" once live testing
  implied it could matter, then confirmed via direct reproduction that it was
  a crash, not cosmetic).
- The background-validation 90s timeout under real API latency (see Scenario 2
  above) is a separate operational/UX concern, not a push-back logic bug —
  flagged for awareness, not fixed as part of this task.

## Re-running

```
cd backend
python -m pytest tests/test_pushback_scenarios.py -v   # this report's tests
python -m pytest tests/ -v                              # full backend suite
```
