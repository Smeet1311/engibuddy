# EngiBuddy

**EngiBuddy** is an AI-powered structured thinking companion for STEM/engineering Project-Based Learning (PBL). It's not a generic answer bot—it's a coaching system that scaffolds student reasoning, asks clarifying questions first, detects what stage of a project students are in, and recommends the next step.

## What Makes EngiBuddy Different

Instead of providing direct answers, EngiBuddy:
- 🎯 **Detects your project phase** using the Hybrid 6-phase PBL framework with confidence-based sticky-state transitions
- 🤔 **Asks clarifying questions first** to understand your thinking
- 📋 **Provides scaffolds & templates** tailored to your current phase (with RAG-retrieved context)
- 🎓 **Coaches, not answers** — guides you toward the solution via OpenAI GPT-4o-mini
- 💾 **Remembers your project context** across conversations (in-memory session state)

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
- **Session State:** In-memory dictionary with phase tracking ✅
- **Error Handling:** Hardened HTTP validation, defensive JSON parsing ✅

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

## Project Structure

```
engibuddy/
├── app/                       # Next.js App Router (frontend)
│   ├── page.tsx              # Home page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── api/chat/             # API route (connects to backend)
│
├── components/
│   └── chat/                 # Chat UI components
│       ├── chat-shell.tsx    # Main chat container
│       ├── chat-window.tsx   # Message display
│       ├── chat-input.tsx    # User input form
│       └── phase-sidebar.tsx # Phase progress tracker
│
├── backend/                  # FastAPI backend (Python)
│   ├── main.py              # FastAPI app, /chat endpoint
│   ├── config.py            # LLM config (API key, model, base URL)
│   ├── system_prompt.py     # Phase detection, prompts, phase logic
│   ├── rag.py               # RAG retrieval from knowledge base
│   ├── requirements.txt      # Python dependencies
│   └── tests/               # Backend tests
│       ├── test_chatbot.py          # E2E chatbot tests
│       └── test_rag_retrieval.py    # RAG verification tests
│
├── data/
│   └── knowledge/           # RAG knowledge base
│       ├── tools-library.md              # Tools organized by phase
│       ├── coaching-rules.md             # Coaching patterns
│       ├── problem-categories.md         # Problem types & examples
│       ├── hybrid-framework.md           # Framework definitions
│       ├── sample-project-template.md    # Student project template
│       └── README.md                     # Knowledge base guide
│
├── docs/                    # Architecture & design documentation
│   ├── ARCHITECTURE_INDEX.md             # Entry point (links to all docs)
│   ├── FLOW_AT_A_GLANCE.md               # 7-step flow + conversation examples
│   ├── FLOW_QUICK_REFERENCE.md           # Quick ref cards & diagrams
│   ├── FLOW_ARCHITECTURE.md              # Detailed architecture + flow
│   └── RAG_TEST_RESULTS.md               # Test results & validation notes
│
├── package.json             # Frontend dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.ts       # Tailwind CSS config
├── next.config.js           # Next.js config
├── .env & .env.example      # Environment variables
└── README.md                # This file
```

## How It Works

### 1. **Frontend** (Next.js + React)
- User sends a message via chat UI (`components/chat/`)
- Frontend calls `/api/chat` route which proxies to backend

### 2. **Backend** (FastAPI + OpenAI)
- **Config (`config.py`):** Loads LLM credentials from `.env`, validates setup
- **Phase Detection (`system_prompt.py`):**
  - Calls OpenAI to classify the user's message into one of 6 phases
  - Implements sticky-state: confidence < 35% → stay in current phase
  - Prevents erratic phase jumping (max 1-phase advance per message)
- **RAG (`rag.py`):**
  - Retrieves relevant knowledge from `data/knowledge/` based on:
    - Current phase name (high priority: +10)
    - Phase-specific keywords (+2 each)
    - User query words (+0.5 each)
  - Returns top 2 relevant passages
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
- In-memory dictionary tracks per-session state:
  - `phase_history`: List of visited phases
  - `current_phase`: Active phase (sticky-state enforced)
  - Phase exit signals & confidence scores

### 4. **Knowledge Base (RAG)**
Organized by 6-phase framework:
- **Phase 0 (Empathize):** User discovery, observation techniques
- **Phase 1 (Conceive):** Problem scoping, brainstorming
- **Phase 2 (Design):** Architecture, technology comparison, planning
- **Phase 3 (Implement):** Coding, debugging, testing strategies
- **Phase 4 (Test/Revise):** Validation, acceptance criteria
- **Phase 5 (Operate):** Deployment, presentation, reflection

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

# Optional: Use a different OpenAI-compatible endpoint
# OPENAI_BASE_URL=https://your-custom-endpoint.com/v1
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
- ✅ **Session Memory** — Tracks phase history, current phase, project context
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
