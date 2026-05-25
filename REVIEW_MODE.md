# Review Mode

Review Mode is the evidence-checking and planning workspace for an EngiBuddy project. It helps the user inspect what has already been covered in Guidance Mode, see which checklist points are complete, add project documents as evidence, and ask a separate Review chat how to finish the current phase.

## Current Layout

Review Mode uses a two-column layout:

- Left column: Review Control Panel.
- Right column: independent Review Chat and Review tools.

The control panel remains visible while the user discusses missing evidence or next steps with the Review chat.

## Independent Review Chat

Review Chat is separate from Guidance Chat.

If the selected Guidance session is:

- `session-abc`

Review Chat uses:

- `review-session-abc`

This means Review Mode can have its own discussion history without mixing messages into the Guidance conversation. The Review chat still receives the selected Guidance session as its evidence source through `reviewSourceSessionId`.

Hidden `review-*` sessions are filtered out of the normal sidebar session list.

## Relationship To Guidance Mode

Guidance Mode is where the user works through the project process. It creates the main evidence trail:

- chat messages
- phase history
- current active phase
- project artifacts
- checklist validation results

After Guidance responses, the backend can run automatic Review validation. The result is stored in the source Guidance session as `review_progress`.

Review Mode reads that same `review_progress` from the selected Guidance session and displays it in the checklist.

## What The Review Control Panel Shows

The control panel is project-manager oriented. Users do not manually toggle checklist items complete; completion still comes from automatic evidence validation.

It shows:

- total completed checklist points
- active phase status
- confidence level for the active phase
- phase goal and required outputs
- next recommended action
- completed and missing points for the active phase
- evidence snippets from automatic validation
- points already discussed during Guidance
- actionable missing items
- uploaded Review documents

The checklist points are defined in:

- `backend/review_mode.py`

The user can act from the left column:

- ask Review Chat about a specific checklist item
- ask for scaffolded Help on a missing item
- re-run Review validation

The **Help** button beside Actionable Missing Items asks Review Chat for RAG-grounded scaffolding. It uses the Review Help Guidance knowledge file to give close examples, targeted questions, and evidence suggestions without producing a complete final answer for the user.

The left column also includes an **Added Review Documents** window. This is read-only and shows the documents uploaded through the **Add Review Documents** button in the right-column toolbar.

## Review Chat Behavior

Review Chat answers questions such as:

- what has already been completed
- what evidence is missing
- how to continue the active phase
- how to make success criteria measurable
- which documents or observations would improve validation

The Review chat prompt includes:

- Review Mode instructions from `backend/system_prompt.py`
- the current checklist snapshot from the selected Guidance session
- RAG context retrieved with `mode="review"`

Review Chat should not mark checklist points complete by itself. It explains what evidence is needed so automatic validation can recognize progress.

## Define Criteria With RAG

The **Define Criteria With RAG** button sends a Review Chat message asking the assistant to use the RAG knowledge base and current project evidence to define measurable success criteria for the active phase.

It is a shortcut for asking:

- what good criteria should look like
- what thresholds or pass/fail conditions are needed
- what evidence the user should collect
- how those criteria will later support Review validation

It does not directly edit the checklist. It gives the user criteria guidance through chat.

## Review Documents

The **Add Review Documents** button lets the user upload text-based project evidence. Supported frontend file types include:

- `.txt`
- `.md`
- `.markdown`
- `.csv`
- `.json`
- `.log`

Uploaded documents are stored as project artifacts with:

- `artifactType: review_document`
- the current project id
- the active phase id
- the file text as artifact content

Project artifacts are stored in SQLite and managed through:

- `backend/db.py`
- `backend/services/artifact_service.py`
- `POST /projects/{project_id}/artifacts`
- `PATCH /projects/{project_id}/artifacts/{artifact_id}`

After upload, Review validation is triggered for the selected Guidance source session through:

- `POST /sessions/{session_id}/review/validate`

## RAG Sources

Review Mode does not currently have a separate Review-only RAG folder.

The retriever is shared by Guidance and Review:

- `backend/rag.py`

Global RAG knowledge files are loaded from:

- `data/knowledge/`

The retriever reads `.md` and `.txt` files in that folder.

Review Help guidance is stored in:

- `data/knowledge/review-help-guidance.md`

Project-specific artifacts, including uploaded Review documents, are indexed from the SQLite `project_artifacts` table and searched alongside the global knowledge.

Review Mode passes:

- `mode="review"`

to `retrieve_context(...)`. That changes retrieval behavior, including a smaller default top-k than Guidance Mode.

## Validation Flow

Automatic validation is implemented in:

- `backend/services/review_validation_service.py`
- `backend/services/session_service.py`

The validation process:

1. Load messages from the selected Guidance source session.
2. Load project artifacts for the same `project_id`.
3. Send that evidence to the checklist evaluator.
4. Require structured JSON output.
5. Normalize completion status and evidence for every checklist point.
6. Save the result into the source session's `review_progress`.

Uploaded Review documents count as first-class evidence during validation unless they are marked `not_relevant`.

## Important Files

- `backend/main.py` - API routes for chat, artifacts, sessions, and validation.
- `backend/db.py` - SQLite sessions, messages, project artifacts, and session listing.
- `backend/rag.py` - shared Guidance/Review RAG retrieval.
- `backend/review_mode.py` - checklist definitions and completion rules.
- `backend/services/chat_service.py` - Guidance and Review chat orchestration.
- `backend/services/session_service.py` - session state and automatic validation.
- `backend/services/review_validation_service.py` - checklist evaluator.
- `components/chat/shared/chat-shell-base.tsx` - Guidance/Review shell, independent Review session handling, Review tools.
- `components/chat/review/review-checklist.tsx` - Review control panel UI.

## Short Summary

Guidance Mode produces the main project evidence. Review Mode inspects that evidence with a PM-style control panel and provides a separate Review Chat for planning next steps. Review Chat has its own message history, uses Review-specific RAG retrieval, and can use uploaded project documents to improve checklist validation.
