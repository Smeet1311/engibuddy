# EngiBuddy

**EngiBuddy** is an AI-powered structured thinking companion for STEM/engineering Project-Based Learning (PBL). It's not a generic answer bot — it's a coaching system that scaffolds student reasoning, asks clarifying questions first, detects what stage of a project students are in, recommends the next step, and **pushes back** when a student claims progress the evidence doesn't support.

## Feedback & Survey

After you've run EngiBuddy locally and tried it out, please share your feedback here:

👉 **[Student Feedback Survey](https://docs.google.com/forms/d/e/1FAIpQLScjShUoPAgi3Tw1-4zfxmvchqIRDS0aws3uy8FRl64PXzfuIw/viewform?usp=publish-editor)**

👉 **[Teacher Feedback Survey](https://docs.google.com/forms/d/e/1FAIpQLScHt-t8fY3RScZ2wbs8HyBe0z6ru9GXe4Ew64eRp6xeyrza4w/viewform?usp=publish-editor)**

This helps us improve the coaching prompts, the push-back gate, and Review Mode based on real testing.

## What Makes EngiBuddy Different

- 🎯 **Detects your project phase** using the Hybrid 6-phase PBL framework with confidence-based sticky-state transitions
- 🛑 **Pushes back on unsupported jumps** — a confident "I'm done!" claim can't skip an unaddressed earlier phase
- 🤔 **Asks clarifying questions first** to understand your thinking
- 📋 **Provides scaffolds & templates** tailored to your current phase (with RAG-retrieved context)
- 🎓 **Coaches, not answers** — guides you toward the solution via an LLM call, not a direct solve
- 🧐 **Reviews your evidence** in a separate Review Mode workspace, checklist-style
- 💾 **Remembers your project context** across conversations (SQLite-backed session state)

## Supported Framework

### Hybrid 6-Phase Model ✅
1. **Empathize** — Define the problem and understand user needs
2. **Conceive** — Generate ideas and explore possibilities
3. **Design** — Plan the solution in detail
4. **Implement** — Build the prototype or solution
5. **Test/Revise** — Validate and iterate
6. **Operate** — Deploy and maintain

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** FastAPI (Python) + Uvicorn
- **AI Integration:** OpenAI-compatible API (works with OpenAI or any OpenAI-compatible endpoint, e.g. NVIDIA NIM)
- **Retrieval:** Keyword-based RAG from `data/knowledge/`
- **LLM Config:** Centralized via `backend/config.py`
- **Session State:** SQLite-backed phase tracking
- **Error Handling:** Hardened HTTP validation, defensive JSON parsing

## Dual Mode Architecture

EngiBuddy runs in two modes, each with its own route and shell component:

| Mode | Route | Shell Component |
|------|-------|-----------------|
| Guidance Mode | `/guidance` | `components/chat/guidance/guidance-shell.tsx` |
| Review Mode | `/review` | `components/chat/review/review-shell.tsx` |

**Shared Components:**
- `components/chat/shared/chat-shell-base.tsx` — Base UI logic, sends `mode` field to backend
- `backend/services/chat_service.py` — `process_chat()` receives `mode` parameter and runs the push-back gate
- `backend/main.py` — `/chat` endpoint accepts `mode: str` in request body

**Development Guidelines:**
- To add Guidance features → edit inside `components/chat/guidance/` and `backend/`
- To add Review features → edit inside `components/chat/review/` and `backend/`
- Never put mode-specific logic in shared files

## Push-Back Mechanism

The push-back mechanism stops a student (or a confused/over-confident LLM phase classification) from skipping ahead in the 6-phase framework without real evidence.

**How it works:**
1. Every chat turn, the LLM classifies the user's message into a phase with a confidence score.
2. `compute_recommended_phase` checks the project's stored checklist evidence and always returns the **earliest incomplete phase** — a late-stage claim ("the app is built and deployed") cannot vault an unaddressed earlier phase (e.g. missing problem statement).
3. Low-confidence or unparsable LLM phase guesses fall back safely to "stay in current phase, zero confidence" instead of crashing or jumping.
4. The gate runs for **both** `guidance` and `review` modes — Review Mode chat is gated against the linked Guidance session's real checklist progress, not just its own.
5. Only one explicit path is allowed to *advance* a student automatically: project artifact upload (`allow_advance=True`). A generic chat re-validation can push back, but can never silently advance someone.
6. Deleting an artifact that was the only evidence for a phase rolls that phase's completion back.

**Where it lives:**
- `backend/services/chat_service.py` — gate entry point (`mode in ("guidance", "review")`)
- `backend/services/session_service.py` — `compute_recommended_phase`, automatic Review validation
- `backend/services/review_validation_service.py` — checklist evaluator
- `backend/review_mode.py` — checklist point definitions per phase
- `backend/tests/test_pushback_scenarios.py` — 14 adversarial QA tests (mocked LLM) covering 4 scenarios: software dev claim-skip, bridge-build doc upload, "no idea yet" vague input, and a 2-weeks-in Review Mode check-in
- `backend/tests/PUSHBACK_TEST_REPORT.md` — full QA report, including live-server verification against a real LLM

## Quick Start

### Prerequisites
- Node.js 18+ & npm
- Python 3.9+
- An OpenAI-compatible API key (OpenAI, or any compatible provider — set in `.env`)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Smeet1311/engibuddy.git
   cd engibuddy
   git checkout feature/push-back-mechanism
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with the following values (copy as-is to run with the NVIDIA NIM backend):
   ```env
   # OpenAI-compatible API (used for /api/chat)
   OPENAI_API_KEY=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
   OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1
   OPENAI_MODEL=meta/llama-3.3-70b-instruct
   RAG_EMBEDDING_PROVIDER=openai
   RAG_EMBEDDING_API_KEY=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
   RAG_EMBEDDING_BASE_URL=https://integrate.api.nvidia.com/v1
   OPENAI_EMBEDDING_MODEL=nvidia/llama-nemotron-embed-1b-v2
   RAG_TOP_K=3
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

3. **Install frontend dependencies (repo root):**
   ```bash
   npm install
   ```

4. **Install backend dependencies:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate        # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

5. **Start the backend (FastAPI)** — in one terminal:
   ```bash
   cd backend
   source venv/bin/activate        # if not already active
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   - Backend: [http://localhost:8000](http://localhost:8000)
   - API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

6. **Start the frontend (Next.js)** — in a second terminal, from the repo root:
   ```bash
   npm run dev
   ```
   - Frontend: [http://localhost:3000](http://localhost:3000)

   By default the frontend calls `http://localhost:8000`. To point it at a different backend, set `NEXT_PUBLIC_API_BASE_URL` in `.env` before starting Next.js.

7. **Open the app:** go to `http://localhost:3000`, pick **Guidance** or **Review** mode, and start chatting.

## Testing the Push-Back Mechanism Locally

With the backend virtualenv active:

```bash
cd backend
python -m pytest tests/test_pushback_scenarios.py -v
```

This runs all 14 mocked-LLM adversarial tests covering the 4 scenarios above. Read `backend/tests/PUSHBACK_TEST_REPORT.md` for the full scenario walkthroughs and bugs found/fixed during QA, including live-server verification against a real LLM.

Run the full backend test suite:
```bash
cd backend
python -m pytest tests/ -v
```

### Manual test walkthrough (Guidance Mode)
1. Start a new project at `/guidance` and send a vague first message ("I don't have an idea yet"). Confirm it stays in Phase 0 (Empathize) rather than jumping ahead.
2. Without addressing Phase 0, claim in chat that the project is fully built and deployed. Confirm the assistant pushes back and keeps you on the earliest incomplete phase.
3. Upload a project artifact (via Review Mode's **Add Review Documents**) that evidences a later phase while Phase 0 is still unaddressed. Confirm the recommended phase still doesn't skip Phase 0.
4. Delete that artifact and re-validate. Confirm the phase rolls back once its evidence disappears.

### Manual test walkthrough (Review Mode)
1. From `/guidance`, build up a session with some real progress (e.g. complete Phase 0 and 1 evidence).
2. Switch to `/review` for that session and confirm the checklist mirrors the real Guidance progress.
3. In Review Chat, try to push past an incomplete phase with a confident claim — confirm Review Mode's gate (sourced from the linked Guidance session) blocks it the same way Guidance Mode does.

Done testing? Please fill out the **[Student Feedback Survey](https://docs.google.com/forms/d/e/1FAIpQLScjShUoPAgi3Tw1-4zfxmvchqIRDS0aws3uy8FRl64PXzfuIw/viewform?usp=publish-editor)** or the **[Teacher Feedback Survey](https://docs.google.com/forms/d/e/1FAIpQLScHt-t8fY3RScZ2wbs8HyBe0z6ru9GXe4Ew64eRp6xeyrza4w/viewform?usp=publish-editor)** — see [Feedback & Survey](#feedback--survey) above.

## Project Structure

```
engibuddy/
├── app/                            # Next.js App Router
│   ├── page.tsx                   # Landing page — mode selector (Guidance / Review)
│   ├── layout.tsx                 # Root layout
│   ├── chat-provider.tsx          # Chat context provider
│   ├── globals.css                # Global styles
│   ├── guidance/page.tsx          # Guidance Mode route → renders GuidanceShell
│   └── review/page.tsx            # Review Mode route → renders ReviewShell
│
├── components/chat/
│   ├── shared/chat-shell-base.tsx   # Shared base shell (mode-aware, used by both modes)
│   ├── guidance/guidance-shell.tsx  # Guidance Mode shell
│   ├── review/
│   │   ├── review-shell.tsx         # Review Mode shell
│   │   └── review-checklist.tsx     # Review control panel UI
│   ├── chat-window.tsx
│   ├── chat-input.tsx
│   ├── chat-history.tsx
│   ├── phase-stepper.tsx
│   └── rag-bar.tsx
│
├── backend/
│   ├── main.py                    # FastAPI app — routes for chat, artifacts, sessions, validation
│   ├── config.py
│   ├── system_prompt.py
│   ├── rag.py
│   ├── db.py
│   ├── review_mode.py             # Review checklist definitions and completion rules
│   ├── observability.py
│   ├── services/
│   │   ├── chat_service.py        # process_chat() — mode-aware, runs push-back gate
│   │   ├── session_service.py     # session state, compute_recommended_phase, auto-validation
│   │   ├── artifact_service.py
│   │   └── review_validation_service.py  # checklist evaluator
│   └── tests/
│       ├── test_chatbot.py
│       ├── test_rag_retrieval.py
│       ├── test_phase_guardrails.py
│       ├── test_push_back.py
│       ├── test_pushback_scenarios.py     # 14 adversarial push-back QA tests
│       └── PUSHBACK_TEST_REPORT.md        # Full push-back QA report
│
├── data/knowledge/                # RAG knowledge base
├── docs/                          # Architecture docs
├── REVIEW_MODE.md                 # Review Mode design & validation flow
├── package.json
├── .env / .env.example
└── README.md
```

## How It Works

### 1. Frontend (Next.js + React)
- User lands on `app/page.tsx` and selects a mode (Guidance or Review)
- Each mode has its own route (`/guidance`, `/review`) and shell component
- The shared base shell (`chat-shell-base.tsx`) sends the message plus a `mode` field to the FastAPI `/chat` endpoint directly

### 2. Backend (FastAPI + LLM)
- **Config (`config.py`):** Loads LLM credentials from `.env`, validates setup
- **Phase Detection (`system_prompt.py`):**
  - Calls the LLM to classify the user's message into one of 6 phases
  - Implements sticky-state: confidence < 35% → stay in current phase
  - Prevents erratic phase jumping (max 1-phase advance per message)
- **Push-Back Gate (`chat_service.py` + `session_service.py`):**
  - Runs for both `guidance` and `review` modes
  - Compares the classified phase against real checklist evidence (`compute_recommended_phase`)
  - Always recommends the earliest incomplete phase, never trusts a confident claim alone
  - Only artifact upload can auto-advance; everything else can only push back or hold
- **RAG (`rag.py`):**
  - Splits `data/knowledge/` into small chunks
  - Embeds chunks with deterministic local vectors by default for stable demo/test runs
  - Stores vectors in SQLite and retrieves phase-aware top chunks by cosine similarity
  - Searches project artifacts alongside the global KB when a `projectId` is present
- **LLM Call (`main.py`):**
  - Hardened HTTP validation (checks `resp.ok` before parsing)
  - Defensive JSON parsing (validates `choices[]`, `message`, `content` fields)
  - Fallback response on any error instead of crashing
  - Comprehensive error logging

### 3. Session Memory
- SQLite tracks per-session state in `backend/engibuddy_sessions.db` by default:
  - `phase_history`, `current_phase`, `phase_exit_met`, `project_id`, `review_progress`
- Set `ENGIBUDDY_SESSION_DB` to override the database file path.

### 4. Review Mode
- Independent Review Chat per Guidance session (`review-<sessionId>`)
- Reads `review_progress` written automatically after Guidance turns, plus manual re-validation
- See `REVIEW_MODE.md` for the full design and validation flow

## Environment Variables

Create a `.env` file from `.env.example`:

```env
# OpenAI-compatible API (used for /api/chat)
OPENAI_API_KEY=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
OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1
OPENAI_MODEL=meta/llama-3.3-70b-instruct

# RAG Embedding Configuration
RAG_EMBEDDING_PROVIDER=openai
RAG_EMBEDDING_API_KEY=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
RAG_EMBEDDING_BASE_URL=https://integrate.api.nvidia.com/v1
OPENAI_EMBEDDING_MODEL=nvidia/llama-nemotron-embed-1b-v2
RAG_TOP_K=3

# Frontend API base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Optional: Override SQLite session database path
ENGIBUDDY_SESSION_DB=backend/engibuddy_sessions.db
```

The app raises `ValueError` on startup if `OPENAI_API_KEY` is missing.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js frontend (port 3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `uvicorn main:app --reload` (from `backend/`) | Start FastAPI backend (port 8000) |
| `python -m pytest tests/ -v` (from `backend/`) | Run all backend tests |
| `python -m pytest tests/test_pushback_scenarios.py -v` (from `backend/`) | Run push-back mechanism QA tests |

## Architecture Overview

For detailed information, see the [docs/](./docs) folder:

- **[ARCHITECTURE_INDEX.md](./docs/ARCHITECTURE_INDEX.md)** — Entry point with all architecture docs
- **[FLOW_AT_A_GLANCE.md](./docs/FLOW_AT_A_GLANCE.md)** — Quick 7-step flow + conversation examples
- **[FLOW_QUICK_REFERENCE.md](./docs/FLOW_QUICK_REFERENCE.md)** — Quick reference cards & phase diagrams
- **[FLOW_ARCHITECTURE.md](./docs/FLOW_ARCHITECTURE.md)** — Detailed system architecture with ASCII diagrams
- **[PROJECT_GRAPH.md](./docs/PROJECT_GRAPH.md)** — Project/session/artifact data graph
- **[RAG_TEST_RESULTS.md](./docs/RAG_TEST_RESULTS.md)** — Test results & RAG validation notes
- **[REVIEW_MODE.md](./REVIEW_MODE.md)** — Review Mode design & validation flow
- **[backend/tests/PUSHBACK_TEST_REPORT.md](./backend/tests/PUSHBACK_TEST_REPORT.md)** — Push-back mechanism QA report

## Features ✅

- ✅ **LLM Integration** — Hardened wrapper with defensive JSON parsing & HTTP validation
- ✅ **Phase Detection** — 6-phase PBL framework with confidence-based sticky-state transitions
- ✅ **Push-Back Mechanism** — Gates both Guidance and Review modes against real checklist evidence
- ✅ **RAG Pipeline** — Keyword-based retrieval from knowledge base, context-injected prompts
- ✅ **Error Resilience** — Fallback returns instead of crashes; comprehensive logging
- ✅ **Session Memory** — Persists phase history, current phase, completed phases, and project context in SQLite
- ✅ **Dual Mode Architecture** — Guidance and Review modes with separate routes, shells, and file ownership
- ✅ **Mode-Aware Backend** — `/chat` endpoint receives `mode` field, passes it through `process_chat()` and the push-back gate

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

MIT
