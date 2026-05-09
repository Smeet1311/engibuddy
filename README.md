# EngiBuddy

**EngiBuddy** is an AI-powered structured thinking companion for STEM/engineering Project-Based Learning (PBL). It's not a generic answer bot—it's a coaching system that scaffolds student reasoning, asks clarifying questions first, detects what stage of a project students are in, and recommends the next step.

## What Makes EngiBuddy Different

Instead of providing direct answers, EngiBuddy:
- 🎯 **Detects your project phase** using the Hybrid 6-phase PBL framework with confidence-based sticky-state transitions
- 🤔 **Asks clarifying questions first** to understand your thinking
- 📋 **Provides scaffolds & templates** tailored to your current phase (with RAG-retrieved context)
- 🎓 **Coaches, not answers** — guides you toward the solution via OpenAI GPT-4o-mini
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
- **AI Integration:** OpenAI API (GPT-4o-mini) ✅
- **Retrieval:** Keyword-based RAG from `data/knowledge/` ✅
- **LLM Config:** Centralized via `backend/config.py` ✅
- **Session State:** SQLite-backed phase tracking ✅
- **Error Handling:** Hardened HTTP validation, defensive JSON parsing ✅

## Dual Mode Architecture

EngiBuddy runs in two modes, each with its own route and shell component:

| Mode | Route | Shell Component | Managed By |
|------|-------|-----------------|------------|
| Guidance Mode | `/guidance` | `components/chat/guidance/guidance-shell.tsx` | Smeet |
| Review Mode | `/review` | `components/chat/review/review-shell.tsx` | Teammate |

**Shared Components:**
- `components/chat/shared/chat-shell-base.tsx` — Base UI logic, sends `mode` field to backend
- `backend/services/chat_service.py` — `process_chat()` receives `mode` parameter
- `backend/main.py` — `/chat` endpoint accepts `mode: str` in request body

**Development Guidelines:**
- To add Guidance features → edit inside `components/chat/guidance/` and `backend/`
- To add Review features → edit inside `components/chat/review/` and `backend/`
- Never put mode-specific logic in shared files

## Quick Start

### Prerequisites
- Node.js 18+ & npm
- Python 3.9+
- OpenAI API key (set in `.env`)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Smeet1311/engibuddy.git
   cd engibuddy
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add:
   # OPENAI_API_KEY=sk_your_key_here
   # OPENAI_BASE_URL=https://api.openai.com/v1
   # OPENAI_MODEL=gpt-4o-mini
   ```

3. **Install frontend dependencies:**
   ```bash
   npm install
   ```

4. **Install backend dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

5. **Start the backend (FastAPI):**
   ```bash
   cd backend
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   Backend runs on [http://localhost:8000](http://localhost:8000)
   API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

6. **Start the frontend (Next.js) in a new terminal:**
   ```bash
   npm run dev
   ```
   Frontend runs on [http://localhost:3000](http://localhost:3000)

   By default, the frontend calls `http://localhost:8000`. To point it at a
   deployed backend, set `NEXT_PUBLIC_API_BASE_URL` before starting Next.js:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.example.com
   ```

## Project Structure

```
engibuddy/
├── app/                            # Next.js App Router
│   ├── page.tsx                   # Landing page — mode selector (Guidance / Review)
│   ├── layout.tsx                 # Root layout
│   ├── globals.css                # Global styles
│   ├── guidance/
│   │   └── page.tsx               # Guidance Mode route → renders GuidanceShell
│   └── review/
│       └── page.tsx               # Review Mode route → renders ReviewShell
│
├── components/
│   └── chat/
│       ├── shared/
│       │   └── chat-shell-base.tsx  # Shared base shell (mode-aware, used by both modes)
│       ├── guidance/
│       │   └── guidance-shell.tsx   # Guidance Mode shell (managed by Smeet)
│       ├── review/
│       │   └── review-shell.tsx     # Review Mode shell (managed by teammate)
│       ├── chat-window.tsx
│       ├── chat-input.tsx
│       ├── chat-history.tsx
│       ├── phase-stepper.tsx
│       └── rag-bar.tsx
│
├── backend/
│   ├── main.py                    # FastAPI app — /chat accepts mode field
│   ├── config.py
│   ├── system_prompt.py
│   ├── rag.py
│   ├── db.py
│   ├── observability.py
│   ├── services/
│   │   ├── chat_service.py        # process_chat() — mode-aware
│   │   ├── session_service.py
│   │   └── artifact_service.py
│   └── tests/
│       ├── test_chatbot.py
│       └── test_rag_retrieval.py
│
├── data/knowledge/                # RAG knowledge base
├── docs/                          # Architecture docs
├── package.json
├── .env / .env.example
└── README.md
```

## How It Works

### 1. **Frontend** (Next.js + React)
- User lands on `app/page.tsx` and selects a mode (Guidance or Review)
- Each mode has its own route (`/guidance`, `/review`) and shell component
- The shared base shell (`chat-shell-base.tsx`) sends the message plus a `mode` field to the FastAPI `/chat` endpoint directly

### 2. **Backend** (FastAPI + OpenAI)
- **Config (`config.py`):** Loads LLM credentials from `.env`, validates setup
- **Phase Detection (`system_prompt.py`):**
  - Calls OpenAI to classify the user's message into one of 6 phases
  - Implements sticky-state: confidence < 35% → stay in current phase
  - Prevents erratic phase jumping (max 1-phase advance per message)
- **RAG (`rag.py`):**
  - Splits `data/knowledge/` into small chunks
  - Embeds chunks with deterministic local vectors by default for stable submission/demo runs
  - Stores vectors in SQLite and retrieves phase-aware top chunks by cosine similarity
  - Re-ranks with weighted phase phrases and query keywords
  - Searches project artifacts alongside the global KB when a `projectId` is present
  - Returns context plus source metadata for UI/debugging
- **System Prompt Generation:**
  - BASE_PERSONALITY (Socratic method, 150 words max)
  - Phase-specific coaching rules (~2.5KB per phase)
  - RAG context (if retrieved)
  - All prepended before calling OpenAI
- **LLM Call (`main.py`):**
  - Hardened HTTP validation (checks `resp.ok` before parsing)
  - Defensive JSON parsing (validates choices[], message, content fields)
  - Fallback response on ANY error: "I could not generate a response right now..."
  - Comprehensive error logging

### 3. **Session Memory**
- SQLite tracks per-session state in `backend/engibuddy_sessions.db` by default:
  - `phase_history`: List of visited phases
  - `current_phase`: Active phase (sticky-state enforced)
  - `phase_exit_met`: Completed phases for the sidebar
  - `project_id`: Project identifier passed by the frontend
- Set `ENGIBUDDY_SESSION_DB` to override the database file path.

### 4. **Knowledge Base (RAG)**
Organized by 6-phase framework:
- **Phase 0 (Empathize):** User discovery, observation techniques
- **Phase 1 (Conceive):** Problem scoping, brainstorming
- **Phase 2 (Design):** Architecture, technology comparison, planning
- **Phase 3 (Implement):** Coding, debugging, testing strategies
- **Phase 4 (Test/Revise):** Validation, acceptance criteria
- **Phase 5 (Operate):** Deployment, presentation, reflection

The retriever is phase-aware: a Design request searches Design-tagged and generic chunks, not unrelated Operate/Test chunks. Project artifacts can be added with `POST /projects/{project_id}/artifacts` and are retrieved with the global KB for that project.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js frontend (port 3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `uvicorn backend.main:app --reload` | Start FastAPI backend (port 8000) |

## Testing

**Backend tests** (verify RAG + chatbot):
```bash
cd backend/tests
python test_chatbot.py        # Test all 6 phases
python test_rag_retrieval.py  # Verify RAG context retrieval
```

## Environment Variables

Create a `.env` file from `.env.example`:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk_your_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

# RAG Configuration
# For the PJBL submission, keep this local so RAG is stable and warning-free.
RAG_EMBEDDING_PROVIDER=local
RAG_TOP_K=3

# Future scale-up after submission:
# Use these only with a provider that supports OpenAI embeddings.
# OPENAI_EMBEDDING_MODEL=text-embedding-3-small
# RAG_EMBEDDING_PROVIDER=openai

# Optional: Use a different OpenAI-compatible endpoint
# OPENAI_BASE_URL=https://your-custom-endpoint.com/v1

# Optional: Point the Next.js UI at a deployed backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Optional: Override SQLite session database path
ENGIBUDDY_SESSION_DB=backend/engibuddy_sessions.db
```

**All variables are required.** The app will raise `ValueError` if `OPENAI_API_KEY` is missing.

## Architecture Overview

For detailed information, see the [docs/](./docs) folder:

- **[ARCHITECTURE_INDEX.md](./docs/ARCHITECTURE_INDEX.md)** — Entry point with all architecture docs
- **[FLOW_AT_A_GLANCE.md](./docs/FLOW_AT_A_GLANCE.md)** — Quick 7-step flow + conversation examples
- **[FLOW_QUICK_REFERENCE.md](./docs/FLOW_QUICK_REFERENCE.md)** — Quick reference cards & phase diagrams
- **[FLOW_ARCHITECTURE.md](./docs/FLOW_ARCHITECTURE.md)** — Detailed system architecture with ASCII diagrams
- **[RAG_TEST_RESULTS.md](./docs/RAG_TEST_RESULTS.md)** — Test results & RAG validation notes

## Features ✅

- ✅ **OpenAI Integration** — Hardened LLM wrapper with defensive JSON parsing & HTTP validation
- ✅ **Phase Detection** — 6-phase PBL framework with confidence-based sticky-state transitions
- ✅ **RAG Pipeline** — Keyword-based retrieval from knowledge base, context-injected prompts
- ✅ **Error Resilience** — Fallback returns instead of crashes; comprehensive logging
- ✅ **Session Memory** — Persists phase history, current phase, completed phases, and project context in SQLite
- ✅ **Dual Mode Architecture** — Guidance and Review modes with separate routes, shells, and file ownership
- ✅ **Mode-Aware Backend** — `/chat` endpoint receives `mode` field, passes it through `process_chat()` and logging
- ✅ **Professional Structure** — Clean directory layout with docs/, backend/tests/

## Contributing

EngiBuddy is actively developed. To contribute:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

MIT
