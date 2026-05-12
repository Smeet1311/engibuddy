# Review Mode

This document explains how Review Mode works now, how it connects to Guidance Mode, and how automatic AI validation keeps checklist progress up to date.

## What Review Mode Is For

Review Mode is the analysis screen for a project session. It shows whether each checklist point for the six project phases has been satisfied based on the evidence collected during Guidance Mode.

Review Mode is now read-only. It does not let the user manually toggle checklist points. The checklist is updated only by automatic AI validation.

## What Changed

The app now has a shared progress model between Guidance and Review:

- Guidance Mode captures the conversation and updates the current phase.
- After every Guidance response, the backend automatically runs AI validation against the session evidence.
- The AI validation updates the checklist progress stored in the session.
- Review Mode reads that same stored progress and displays the current checklist state.

So Review Mode no longer depends on manual checkbox updates. It only reflects what the AI has inferred from the session evidence.

## Shared Source of Truth

Both modes use the same session state stored in SQLite.

The important pieces are:

- `backend/db.py` - stores session rows, messages, and project artifacts
- `backend/services/session_service.py` - reads and writes session state
- `backend/review_mode.py` - defines the checklist structure and completion rules
- `backend/services/chat_service.py` - runs Guidance chat and triggers automatic validation

The shared session record contains:

- `phase_history` - phases visited so far
- `current_phase` - current active phase
- `phase_exit_met` - phases considered completed
- `review_progress` - checklist completion data and evidence
- `project_id` - project grouping for sessions and artifacts

That stored `review_progress` is the bridge between Guidance and Review.

## How Guidance Mode Works With AI Validation

When the user sends a message in Guidance Mode:

1. The frontend sends the message to `POST /chat`.
2. The backend generates the assistant reply.
3. The backend saves the user message and assistant response in SQLite.
4. The backend automatically runs review validation for that session.
5. The validation engine checks the chat history and project artifacts against the checklist.
6. The backend saves the updated checklist results into the session.
7. The next Review Mode load reads the updated state from the same session.

This means Guidance Mode is the place where evidence is produced, and Review Mode is the place where that evidence is summarized.

## How Review Validation Works

Automatic validation is implemented in:

- `backend/services/review_validation_service.py`
- `backend/services/session_service.py`

The validation flow is:

- The backend loads the session messages for the current session.
- The backend loads project artifacts linked to the same `project_id`.
- The backend sends the evidence to OpenAI with a strict checklist-evaluation prompt.
- The AI returns structured JSON with completion status and evidence for each checklist point.
- The backend normalizes the result and persists it back into `review_progress`.

The checklist points themselves are defined in `backend/review_mode.py`.

## Checklist Rules

The checklist is organized into six phases:

1. Empathize
2. Conceive
3. Design
4. Implement
5. Test/Revise
6. Operate

Each phase contains multiple checklist points. A phase is considered completed only when all of its points are completed.

That rule is enforced by the backend, not by the frontend.

## Where the Data Is Stored

### SQLite session database

By default, all session data is stored in:

- `backend/engibuddy_sessions.db`

The path can be overridden with:

- `ENGIBUDDY_SESSION_DB`

### Stored records

The database stores:

- Sessions
- Messages
- Project artifacts
- Review progress

### Project artifacts

Artifacts are stored separately from chat messages so Review Mode can use both:

- conversation evidence
- structured project evidence

Artifacts are managed through `backend/services/artifact_service.py` and `backend/db.py`.

## What Review Mode Displays

Review Mode loads the saved session state and renders:

- the checklist summary
- phase completion counts
- per-point completion state
- evidence-backed progress from the last automatic validation

Because checklist toggles were removed, Review Mode is now a display and analysis view only.

## What You Should Expect In Practice

### In Guidance Mode

- You ask questions about the project procedure.
- The assistant answers.
- The session is updated.
- AI validation runs automatically after each answer.
- The review progress moves forward step by step.

### In Review Mode

- You open a session from the sidebar.
- The app loads the saved checklist progress.
- You can inspect which phase points are completed.
- You can see what the AI has already inferred from the Guidance session.

## Important Design Decision

There is now one shared progress tracker instead of separate Guidance and Review logic.

That keeps the system consistent:

- Guidance produces evidence.
- AI interprets evidence.
- Review shows the interpreted result.

This avoids duplicate state and keeps both modes synchronized.

## Files To Know

- `backend/main.py` - API routes
- `backend/services/chat_service.py` - chat orchestration and automatic validation trigger
- `backend/services/session_service.py` - shared session persistence
- `backend/services/review_validation_service.py` - AI checklist evaluator
- `backend/review_mode.py` - checklist definitions and completion logic
- `components/chat/shared/chat-shell-base.tsx` - shared frontend shell
- `components/chat/review/review-checklist.tsx` - read-only review UI

## Short Summary

Guidance Mode is where the project conversation happens. Review Mode is where the evidence is checked. Automatic AI validation runs after every Guidance response and stores the result in shared session state so Review Mode can always show the current checklist progress.
