# EngiBuddy Flow Architecture & File Interactions

## 📊 Complete System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React/Next.js)                        │
│                          app/page.tsx, components/                          │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ HTTP POST /chat
                                   │ {userMessage, sessionId, ...}
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND ENTRY POINT                                  │
│                     backend/main.py → FastAPI app                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. LOAD CONFIGURATION                                                       │
│     ├─ from config import get_llm_config()                                  │
│     ├─ Reads: OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL                 │
│     └─ Returns: LLMConfig(api_key, base_url, model)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STEP 1: SESSION MANAGEMENT                               │
│                     backend/main.py → _get_session()                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  SESSIONS = {                                                                │
│    "session-id-1": SessionState(                                             │
│      phase_history: [0, 1, 2, ...],                                          │
│      current_phase: 2,                                                       │
│      phase_exit_met: {0, 1}                                                  │
│    ),                                                                        │
│    ...                                                                       │
│  }                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│              STEP 2: PHASE CLASSIFICATION                                   │
│    backend/system_prompt.py → classify_phase()                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Input:                                                                      │
│    • user_message: "How do I interview users?"                              │
│    • history: [{role: "user", content: "..."}, ...]                         │
│    • current_phase: 0                                                        │
│    • llm_call: function to call LLM                                          │
│                                                                              │
│  Process:                                                                    │
│    1. Prepare prompt with PHASE_CLASSIFIER_PROMPT                           │
│    2. Call _llm_chat_completion() with:                                     │
│       - system: PHASE_CLASSIFIER_PROMPT (from system_prompt.py)             │
│       - messages: [{role: "user", content: classification_request}]         │
│    3. LLM returns JSON: {phase, confidence, transition, reason}             │
│                                                                              │
│  Output: classification = {                                                  │
│    "phase": 0,                                                               │
│    "phase_name": "Empathize",                                                │
│    "confidence": 0.97,                                                       │
│    "transition": "stay",                                                     │
│    "reason": "Question about user interviews..."                             │
│  }                                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│         STEP 3: RESOLVE ACTIVE PHASE (Sticky-State Logic)                   │
│    backend/system_prompt.py → resolve_active_phase()                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Input:                                                                      │
│    • classification: {phase, confidence, ...}                               │
│    • previous_phase: 0 (from SessionState)                                  │
│    • confidence_threshold: 0.35                                              │
│                                                                              │
│  Rules:                                                                      │
│    IF confidence < 0.35 THEN stay in current phase                          │
│    ELSE use proposed phase from classification                               │
│                                                                              │
│  Output: phase_id = 0 (Empathize) ✓                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│           STEP 4: RETRIEVE KNOWLEDGE BASE CONTEXT (RAG)                     │
│              backend/rag.py → retrieve_context()                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Input:                                                                      │
│    • user_message: "How do I interview users effectively?"                  │
│    • phase_id: 0 (Empathize)                                                │
│                                                                              │
│  Process:                                                                    │
│    1. Load files from data/knowledge/*.{txt,md}                             │
│       ├─ tools-library.md                                                    │
│       ├─ coaching-rules.md                                                   │
│       ├─ problem-categories.md                                               │
│       ├─ hybrid-framework.md                                                 │
│       └─ sample-project-template.md                                          │
│                                                                              │
│    2. Score each file by relevance:                                          │
│       • High (×10): Does phase name "Empathize" appear?                     │
│       • Medium (×2): Do phase keywords appear?                              │
│         ["empathize", "user", "interview", "observation", ...]              │
│       • Low (×0.5): Do user query words appear?                             │
│         ["interview", "users", "effectively", ...]                          │
│                                                                              │
│    3. Sort by score, return top 2 passages (≤500 chars each)                │
│                                                                              │
│  Output: rag_context = """                                                   │
│    # PBL Student Problem Categories                                          │
│    EngiBuddy diagnoses student challenges...                                │
│    ## 1. SCOPE & PLANNING ISSUES                                             │
│    ### Unclear or Overly Broad Scope                                         │
│    ...                                                                       │
│  """  (988 characters)                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│           STEP 5: BUILD SYSTEM PROMPT WITH RAG CONTEXT                      │
│    backend/system_prompt.py → build_system_prompt()                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  BASE SYSTEM PROMPT:                                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ BASE_PERSONALITY (from system_prompt.py)                             │   │
│  │                                                                      │   │
│  │ "You are EngiBuddy, a Socratic coach..."                            │   │
│  │ "MAX 150 WORDS per response"                                         │   │
│  │ "Anti-Fabrication Rule: CRITICAL"                                   │   │
│  │ "Phase Transition Rule: explicit announcements"                     │   │
│  │ Size: ~2KB                                                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  +                                                                           │
│                                                                              │
│  PHASE-SPECIFIC PROMPT:                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ PHASE_PROMPTS[0] = PHASE_EMPATHIZE (from system_prompt.py)            │   │
│  │                                                                      │   │
│  │ "Goal: understand users and real problem before defining solution"  │   │
│  │ "Enforcement:"                                                       │   │
│  │ "  - Reject problem statements not backed by user data"             │   │
│  │ "  - If student says 'I already know users want X' ask for proof"   │   │
│  │ "  - Minimum: one real conversation documented"                     │   │
│  │ "Exit gate: one user observation + pain point + How-Might-We"       │   │
│  │ Size: ~2.5KB                                                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  +                                                                           │
│                                                                              │
│  RAG CONTEXT (Optional):                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ "--- Reference context from knowledge base: ---"                     │   │
│  │                                                                      │   │
│  │ "# PBL Student Problem Categories"                                  │   │
│  │ "Eng­iBuddy diagnoses student challenges..."                        │   │
│  │ "[Retrieved: problem-categories.md, 988 chars]"                      │   │
│  │                                                                      │   │
│  │ "Use the above context to inform your coaching..."                  │   │
│  │ Size: ~1KB                                                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  FINAL SYSTEM PROMPT = 2KB + 2.5KB + 1KB = ~5.5KB total ✓                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│         STEP 6: CALL LLM WITH HARDENED WRAPPER                             │
│    backend/main.py → _llm_chat_completion()                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Input Payload:                                                              │
│  {                                                                           │
│    "model": "gpt-4o-mini",                                                  │
│    "messages": [                                                             │
│      {                                                                       │
│        "role": "system",                                                     │
│        "content": "[BASE_PERSONALITY + PHASE_EMPATHIZE + RAG_CONTEXT]"      │
│      },                                                                      │
│      {                                                                       │
│        "role": "user",                                                       │
│        "content": "How do I interview users effectively?"                   │
│      }                                                                       │
│    ],                                                                        │
│    "temperature": 0.6,                                                       │
│    "max_tokens": 1024                                                       │
│  }                                                                           │
│                                                                              │
│  API Call:                                                                   │
│    POST https://api.openai.com/v1/chat/completions                         │
│    Headers: {                                                                │
│      "Authorization": "Bearer sk-...",                                       │
│      "Content-Type": "application/json"                                      │
│    }                                                                         │
│                                                                              │
│  Error Handling (HARDENED):                                                  │
│    ✓ Check resp.ok (HTTP status 200-299)                                    │
│    ✓ Try-except for JSON decode errors                                      │
│    ✓ Validate choices array exists and non-empty                            │
│    ✓ Check message dict is non-null                                         │
│    ✓ Handle content as string OR list of parts                              │
│    ✓ Return fallback: "I could not generate a response..."                  │
│    ✓ Log all errors for debugging                                           │
│                                                                              │
│  Success Response:                                                           │
│  {                                                                           │
│    "choices": [{                                                             │
│      "message": {                                                            │
│        "role": "assistant",                                                  │
│        "content": "Who are the people you can realistically talk to..."     │
│      }                                                                       │
│    }]                                                                        │
│  }                                                                           │
│                                                                              │
│  Output: assistant_message = "Who are the people..." (extracted content)    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│            STEP 7: BUILD RESPONSE & RETURN TO FRONTEND                      │
│              backend/main.py → /chat endpoint returns                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  HTTP Response (JSON):                                                       │
│  {                                                                           │
│    "assistantMessage": "Who are the people you can realistically...",       │
│    "classification": {                                                       │
│      "phase": 0,                                                             │
│      "phase_name": "Empathize",                                              │
│      "confidence": 0.97,                                                     │
│      "transition": "stay",                                                   │
│      "reason": "Question about user interviews..."                          │
│    },                                                                        │
│    "phaseProgress": {                                                        │
│      "phases": [                                                             │
│        {"id": 0, "name": "Empathize", "active": true, ...},                 │
│        {"id": 1, "name": "Conceive", "active": false, ...},                 │
│        ...                                                                   │
│      ],                                                                      │
│      "current": 0                                                            │
│    }                                                                         │
│  }                                                                           │
│                                                                              │
│  HTTP Status: 200 OK                                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND UPDATES UI                                │
│                    app/page.tsx, components/                                │
│                                                                              │
│  Updates:                                                                    │
│    ✓ Display assistantMessage in chat window                                │
│    ✓ Update sidebar with phaseProgress                                      │
│    ✓ Show current phase (active highlight)                                  │
│    ✓ Show completed phases (checkmarks)                                     │
│    ✓ Allow student to continue conversation                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
                        [Cycle repeats on next message]
```

---

## 📁 File-by-File Breakdown

### **Frontend Files**

```
app/
├── page.tsx                    # Main chat interface
├── layout.tsx                  # Page layout, metadata
├── globals.css                 # Global styles
└── api/
    └── chat/                   # (Optional client-side chat proxy)

components/
├── chat/
│   ├── chat-shell.tsx          # Main chat container
│   ├── chat-window.tsx         # Message display area
│   ├── chat-input.tsx          # User input form
│   └── phase-sidebar.tsx       # 6-phase progress sidebar
├── project/                    # Project management UI
└── ui/                         # Reusable UI components
```

**Frontend Flow:**
```
User types message → chat-input.tsx 
    ↓
Frontend calls: POST /chat (via fetch/axios)
    ↓
Awaits JSON response
    ↓
chat-window.tsx displays assistantMessage
    ↓
phase-sidebar.tsx updates with phaseProgress
```

---

### **Backend Files**

#### **1. `backend/main.py` — FastAPI Server & HTTP Endpoint**

```python
# What it does:
├── Imports all dependencies and modules
├── Loads .env environment variables
├── Creates FastAPI app with CORS middleware
├── Defines ChatMessage & ChatRequest Pydantic models
├── Manages SESSIONS dict (in-memory session state)
├── Implements @app.get("/health") ← health check
├── Implements @app.post("/chat") ← MAIN ENDPOINT
│   ├── Validates userMessage
│   ├── Calls get_llm_config() from config.py
│   ├── Gets session state from _get_session()
│   ├── Calls classify_phase() from system_prompt.py
│   ├── Calls resolve_active_phase() from system_prompt.py
│   ├── Calls retrieve_context() from rag.py
│   ├── Calls build_system_prompt() from system_prompt.py
│   ├── Calls _llm_chat_completion() (hardened wrapper)
│   └── Returns {assistantMessage, classification, phaseProgress}
│
└── Implements _llm_chat_completion() ← HARDENED LLM WRAPPER
    ├── Builds OpenAI API payload
    ├── Makes HTTP POST to OpenAI
    ├── Validates resp.ok
    ├── Defensively parses JSON
    ├── Handles content as string or list
    ├── Returns fallback on any error
    └── Logs all issues
```

**Key Responsibility:** HTTP interface, request/response routing, orchestration

---

#### **2. `backend/config.py` — Configuration Management**

```python
# What it does:
├── Defines LLMConfig dataclass
│   ├── api_key: str
│   ├── base_url: str
│   └── model: str
│
└── Implements get_llm_config() function
    ├── Reads OPENAI_API_KEY from environment
    ├── Reads OPENAI_BASE_URL (default: https://api.openai.com/v1)
    ├── Reads OPENAI_MODEL (default: gpt-4o-mini)
    ├── Validates api_key is not empty (raises ValueError if missing)
    └── Returns LLMConfig(api_key, base_url, model)
```

**Key Responsibility:** Centralized credential management, validation, type safety

**Used by:** `main.py` (calls `get_llm_config()` in `/chat` endpoint)

---

#### **3. `backend/system_prompt.py` — Prompts & Phase Logic**

```python
# What it does:
├── Defines BASE_PERSONALITY (global coaching rules)
│   ├── "You are EngiBuddy, a Socratic coach..."
│   ├── MAX 150 WORDS format rule
│   ├── Anti-Fabrication rule
│   ├── Phase Transition rule
│   └── Non-Negotiable behaviors (diagnose before prescribe)
│
├── Defines PHASE_CLASSIFIER_PROMPT (LLM instructions for phase detection)
│   ├── Sticky-state rule explanations
│   ├── Phase signals (keywords per phase)
│   └── JSON output format spec
│
├── Defines PHASE_EMPATHIZE (phase 0 specific rules)
├── Defines PHASE_CONCEIVE (phase 1 specific rules)
├── Defines PHASE_DESIGN (phase 2 specific rules)
├── Defines PHASE_IMPLEMENT (phase 3 specific rules)
├── Defines PHASE_TEST_REVISE (phase 4 specific rules)
├── Defines PHASE_OPERATE (phase 5 specific rules)
│
├── Defines PHASE_PROMPTS dict {0: PHASE_EMPATHIZE, 1: PHASE_CONCEIVE, ...}
├── Defines PHASE_NAMES dict {0: "Empathize", 1: "Conceive", ...}
│
├── Implements build_system_prompt(phase_id: int) → str
│   └── Returns: BASE_PERSONALITY + PHASE_PROMPTS[phase_id]
│
├── Implements classify_phase(user_message, history, current_phase, llm_call)
│   ├── Prepares PHASE_CLASSIFIER_PROMPT with context
│   ├── Calls llm_call(system, messages) to get LLM classification
│   ├── Parses JSON response
│   ├── Applies sticky-state rules (low conf → stay)
│   ├── Prevents phase skipping (can only advance by 1)
│   └── Returns {phase, phase_name, confidence, transition, reason}
│
├── Implements resolve_active_phase(classification, previous_phase, threshold)
│   ├── Checks confidence >= threshold
│   ├── Applies sticky-state logic
│   └── Returns final phase_id to use
│
└── Implements get_phase_progress(session) → dict
    ├── Iterates through all 6 phases
    ├── For each: {id, name, active, visited, completed}
    └── Returns sidebar state for frontend
```

**Key Responsibility:** Prompt engineering, phase classification logic, sticky-state rules

**Used by:** `main.py` (calls `classify_phase()`, `resolve_active_phase()`, `build_system_prompt()`, `get_phase_progress()`)

---

#### **4. `backend/rag.py` — Retrieval-Augmented Generation**

```python
# What it does:
├── Defines PHASE_NAMES_MAP {0: "Empathize", 1: "Conceive", ...}
│
├── Defines PHASE_KEYWORDS dict
│   ├── 0: ["empathize", "user", "interview", "observation", ...]
│   ├── 1: ["conceive", "problem statement", "scope", ...]
│   ├── 2: ["design", "research", "architecture", "technology", ...]
│   ├── 3: ["implement", "build", "code", "debug", ...]
│   ├── 4: ["test", "revise", "validation", "criterion", ...]
│   └── 5: ["operate", "deploy", "demo", "presentation", ...]
│
└── Implements retrieve_context(user_message: str, phase_id: int) → str
    ├── Finds data/knowledge/ directory (relative to backend/)
    ├── Globs all *.txt and *.md files
    ├── For each file:
    │   ├── Reads full content
    │   ├── Scores by relevance:
    │   │   • Phase name match: +10.0 per occurrence
    │   │   • Phase keywords: +2.0 per occurrence
    │   │   • User query words: +0.5 per occurrence (len>2)
    │   └── Stores (score, filename, content) tuple
    ├── Sorts by score descending
    ├── Returns top 2 passages (≤500 chars each)
    ├── Trims to word boundary and adds "..."
    ├── Logs retrieved files with scores
    └── Returns empty string if no matches found
```

**Key Responsibility:** Knowledge base retrieval, keyword scoring, context extraction

**Used by:** `main.py` (calls `retrieve_context()` before building final system prompt)

---

## 📊 Data Flow: Student Query → Response

```
1. FRONTEND sends:
   POST /chat
   {
     "userMessage": "How do I interview users?",
     "sessionId": "student-session-42",
     "conversationHistory": [...]
   }

2. BACKEND receives in main.py:@app.post("/chat")
   ├─ Validate userMessage exists
   ├─ Load config via config.py:get_llm_config()
   │  └─ Returns LLMConfig with api_key, base_url, model
   │
   ├─ Get session via _get_session(session_id)
   │  └─ Returns SessionState(phase_history, current_phase, ...)
   │
   ├─ STEP 1: Phase Classification
   │  └─ Call system_prompt.py:classify_phase()
   │     ├─ system param = PHASE_CLASSIFIER_PROMPT
   │     ├─ messages param = classification request
   │     ├─ llm_call param = _llm_chat_completion (hardened)
   │     └─ Returns {phase: 0, confidence: 0.99, ...}
   │
   ├─ STEP 2: Resolve Phase (sticky-state)
   │  └─ Call system_prompt.py:resolve_active_phase()
   │     └─ Returns phase_id = 0 (Empathize) ✓
   │
   ├─ STEP 3: RAG Context Retrieval
   │  └─ Call rag.py:retrieve_context(user_message, phase_id=0)
   │     ├─ Reads data/knowledge/*.md files
   │     ├─ Scores by "empathize", "interview", "user", etc.
   │     └─ Returns top 2 passages (988 chars)
   │
   ├─ STEP 4: Build System Prompt
   │  └─ Call system_prompt.py:build_system_prompt(phase_id=0)
   │     ├─ BASE_PERSONALITY
   │     ├─ + PHASE_EMPATHIZE
   │     ├─ + RAG context (if found)
   │     └─ Returns full system prompt (~5.5KB)
   │
   ├─ STEP 5: Final LLM Call
   │  └─ Call _llm_chat_completion():
   │     ├─ model = "gpt-4o-mini"
   │     ├─ system = [full system prompt from STEP 4]
   │     ├─ messages = [history + current user message]
   │     ├─ POST to https://api.openai.com/v1/chat/completions
   │     ├─ Validate HTTP response (hardened!)
   │     ├─ Parse JSON defensively
   │     └─ Return content OR fallback
   │
   └─ STEP 6: Return Response
      └─ Return {
           "assistantMessage": "Who are the people...",
           "classification": {...},
           "phaseProgress": {...}
         }
         HTTP 200 OK

3. FRONTEND receives JSON response
   ├─ Display assistantMessage in chat window
   ├─ Update sidebar with phaseProgress
   └─ Ready for next student message
```

---

## 🔄 File Dependencies Graph

```
                            browser
                              │
                              ↓
                      ┌───────────────┐
                      │ FRONTEND      │
                      │ (React/Next)  │
                      └───────┬───────┘
                              │
                    HTTP POST /chat (JSON)
                              │
                      ┌───────↓────────────┐
                      │   main.py          │
                      │   @app.post/chat   │
                      └───────┬──────────┬─┬──────┐
                              │          │  │      │
            ┌─────────────────┘          │  │      │
            │                            │  │      │
            ↓                            │  │      │
     ┌──────────────┐                   │  │      │
     │ config.py    │                   │  │      │
     │ get_llm_     │                   │  │      │
     │ config()     │                   │  │      │
     └──────────────┘                   │  │      │
                                        │  │      │
            ┌───────────────────────────┘  │      │
            │                              │      │
            ↓                              │      │
     ┌─────────────────┐                  │      │
     │ system_prompt   │                  │      │
     │ .py             │◄─────────────────┘      │
     │                 │                         │
     │ • classify_     │                         │
     │   phase()       │                         │
     │ • resolve_      │                         │
     │   active_phase()├─────────────────────────┤
     │ • build_system_ │                         │
     │   prompt()      │                         │
     │ • get_phase_    │                         │
     │   progress()    │                         │
     └─────────────────┘                         │
                                                 │
            ┌────────────────────────────────────┘
            │
            ↓
     ┌──────────────┐
     │ rag.py       │
     │ retrieve_    │
     │ context()────┐
     └──────────────┘│
                     │
                     └──→ data/knowledge/*.md files
                         (tools-library.md,
                          coaching-rules.md,
                          problem-categories.md,
                          hybrid-framework.md,
                          sample-project-template.md)

Key Flow:
main.py calls → config.py (get config)
main.py calls → system_prompt.py (classify, resolve, build)
main.py calls → rag.py (retrieve context)
main.py calls → _llm_chat_completion (use API)
rag.py reads from → data/knowledge/ (markdown files)
```

---

## 📝 Example: Full Conversation Lifecycle

```
STUDENT SESSION START
│
├─ Browser loads app/page.tsx
├─ Displays 6-phase sidebar (all not-yet-visited)
├─ Chat window ready for input
│
├─ Student types: "I need to build a health tracking app but I don't know where to start"
│  └─ Frontend collects: userMessage, sessionId
│
├─ POST /chat with message
│  └─ backend/main.py receives request
│
├─ LOAD CONFIG
│  └─ config.py:get_llm_config()
│     └─ Returns {api_key: "sk-...", base_url: "...", model: "gpt-4o-mini"}
│
├─ CLASSIFY PHASE
│  └─ system_prompt.py:classify_phase(
│       user_message="I need to build...",
│       history=[],
│       current_phase=0,  ← first message, assume phase 0
│       llm_call=_llm_chat_completion
│     )
│     └─ LLM analyzes: mentions "need", "build", "don't know" → likely EMPATHIZE
│     └─ Returns {phase: 0, confidence: 0.87, transition: "stay", ...}
│
├─ RESOLVE PHASE
│  └─ resolve_active_phase(
│       classification={..., confidence: 0.87},
│       previous_phase=0,
│       confidence_threshold=0.35
│     )
│     └─ 0.87 > 0.35, so accept phase 0
│     └─ Returns phase_id = 0 ✓
│     └─ Update SessionState.current_phase = 0
│
├─ RETRIEVE RAG CONTEXT
│  └─ rag.py:retrieve_context(
│       user_message="I need to build a health tracking app...",
│       phase_id=0  ← Empathize
│     )
│     └─ Loads files from data/knowledge/
│     └─ Scores "tools-library.md" high (contains "Empathize")
│     └─ Scores "coaching-rules.md" medium (process guidance)
│     └─ Returns top 2 passages:
│        """
│        # Phase 0: EMPATHIZE
│        Goal: Understand users and the real problem...
│        Tool 0.1: USER DISCOVERY GUIDE
│        Opening Question: "Who is the actual person struggling..."
│        [... 988 chars total ...]
│        """
│
├─ BUILD SYSTEM PROMPT
│  └─ system_prompt.py:build_system_prompt(phase_id=0)
│     └─ BASE_PERSONALITY (2KB)
│        + PHASE_EMPATHIZE (2.5KB)
│        + RAG context (1KB)
│     └─ Returns combined prompt (5.5KB)
│
├─ CALL OPENAI
│  └─ main.py:_llm_chat_completion(
│       base_url="https://api.openai.com/v1",
│       api_key="sk-...",
│       model="gpt-4o-mini",
│       system=[5.5KB combined prompt],
│       messages=[
│         {role:"user", content:"I need to build a health tracking app..."}
│       ],
│       temperature=0.6,
│       max_tokens=1024
│     )
│     └─ POST→ OpenAI API
│     └─ Receive response (200 OK)
│     └─ Parse JSON defensively ✓
│     └─ Extract content: "Who are the actual people who need..."
│     └─ Return assistant_message
│
├─ RETURN RESPONSE
│  └─ HTTP 200 OK with:
│     {
│       "assistantMessage": "Who are the actual people who need a health tracking app? ...",
│       "classification": {
│         "phase": 0,
│         "phase_name": "Empathize",
│         "confidence": 0.87,
│         ...
│       },
│       "phaseProgress": {
│         "phases": [
│           {"id": 0, "name": "Empathize", "active": true, "visited": true},
│           {"id": 1, "name": "Conceive", "active": false, "visited": false},
│           ...
│         ]
│       }
│     }
│
├─ FRONTEND UPDATES
│  └─ chat-window.tsx displays response
│  └─ phase-sidebar.tsx highlights Phase 0 as active
│  └─ Student can type next message
│
└─ CYCLE REPEATS...
   (Later messages preserve conversation history & phase state)
```

---

## 🎯 Summary: Who Does What

| File | Purpose | Called By | Calls |
|------|---------|-----------|-------|
| **main.py** | HTTP server, orchestration | Browser | config, system_prompt, rag, _llm_chat_completion |
| **config.py** | Credential management | main.py | (reads env vars) |
| **system_prompt.py** | Prompts, phase logic | main.py | (no calls, returns data) |
| **rag.py** | Knowledge retrieval | main.py | (reads files, no API calls) |
| **data/knowledge/** | Knowledge base content | rag.py | (files read only) |

---

This is the complete architecture! Every student message flows through this system. 🎓
