# EngiBuddy Files & Flow - Quick Reference

## 📦 Project Structure Overview

```
engibuddy/
│
├── 📁 app/                          ← FRONTEND (React/Next.js)
│   ├── page.tsx                     Main chat UI
│   ├── layout.tsx                   Page structure
│   ├── globals.css                  Styling
│   └── api/
│
├── 📁 components/                   ← UI COMPONENTS
│   ├── chat/
│   │   ├── chat-shell.tsx           Container
│   │   ├── chat-window.tsx          Message display
│   │   ├── chat-input.tsx           Input form
│   │   └── phase-sidebar.tsx        6-phase progress
│   └── ui/                          Reusable components
│
├── 📁 backend/                      ← FASTAPI BACKEND
│   ├── main.py                      ★ HTTP SERVER & ORCHESTRATION
│   ├── config.py                    ★ LLM CONFIGURATION
│   ├── system_prompt.py             ★ PROMPTS & PHASE LOGIC
│   ├── rag.py                       ★ KNOWLEDGE RETRIEVAL
│   └── requirements.txt
│
├── 📁 data/
│   └── knowledge/                   ← KNOWLEDGE BASE
│       ├── tools-library.md         6-phase tools & coaching
│       ├── coaching-rules.md        EngiBuddy coaching guidelines
│       ├── problem-categories.md    Student problem taxonomy
│       ├── hybrid-framework.md      PBL framework details
│       └── sample-project-template.md  Example project walkthrough
│
├── 📁 public/                       Assets (images, fonts, etc.)
├── .env                             ENVIRONMENT (OPENAI_API_KEY, etc.)
├── package.json                     Frontend dependencies
├── tsconfig.json                    TypeScript config
├── tailwind.config.ts               Tailwind CSS config
└── next.config.js                   Next.js config
```

---

## 🔄 Data Flow Table

| Step | Component | Function | Input | Output | Purpose |
|------|-----------|----------|-------|--------|---------|
| 1️⃣ | Browser | User types message | None | JSON payload | Collect student input |
| 2️⃣ | Frontend | POST /chat | userMessage, sessionId | HTTP request | Send to backend |
| 3️⃣ | main.py | /chat endpoint | Request body | LLMConfig, SessionState | Receive & validate |
| 4️⃣ | config.py | get_llm_config() | ENV vars | LLMConfig object | Load API credentials |
| 5️⃣ | system_prompt.py | classify_phase() | message, history, phase | {phase, confidence, ...} | Detect student phase |
| 6️⃣ | system_prompt.py | resolve_active_phase() | classification, previous_phase | phase_id (0-5) | Apply sticky-state logic |
| 7️⃣ | rag.py | retrieve_context() | user_message, phase_id | Context string (1KB) | Fetch knowledge base |
| 8️⃣ | system_prompt.py | build_system_prompt() | phase_id | System prompt (5.5KB) | Combine BASE + PHASE + RAG |
| 9️⃣ | main.py | _llm_chat_completion() | system, messages, config | response string | Call OpenAI API |
| 🔟 | OpenAI API | /chat/completions | payload | {choices[...]} | Generate response |
| 1️⃣1️⃣ | main.py | /chat endpoint | All above | JSON response | Return to frontend |
| 1️⃣2️⃣ | Frontend | Display response | JSON | UI update | Show message & sidebar |

---

## 🎯 File Interaction Map

### **main.py — The Orchestrator**
```
Calls:
  ├─ config.get_llm_config()       → Get API credentials
  ├─ system_prompt.classify_phase()  → Detect phase
  ├─ system_prompt.resolve_active_phase() → Apply rules
  ├─ rag.retrieve_context()        → Get knowledge
  ├─ system_prompt.build_system_prompt() → Build prompt
  ├─ _llm_chat_completion()        → Call OpenAI
  └─ system_prompt.get_phase_progress() → Sidebar state

Returns to Frontend:
  {
    "assistantMessage": "...",
    "classification": {...},
    "phaseProgress": {...}
  }
```

### **config.py — The Gatekeeper**
```
Reads from: .env file
  • OPENAI_API_KEY (required)
  • OPENAI_BASE_URL (optional, default: https://api.openai.com/v1)
  • OPENAI_MODEL (optional, default: gpt-4o-mini)

Validates:
  ✓ API key is not empty
  ✓ Base URL is valid
  ✓ Model name is present

Returns: LLMConfig(api_key, base_url, model)

Used by: main.py (in /chat endpoint)
```

### **system_prompt.py — The Brain**
```
Defines:
  ├─ BASE_PERSONALITY (global rules)
  ├─ PHASE_CLASSIFIER_PROMPT (for phase detection)
  ├─ PHASE_EMPATHIZE (phase 0 rules)
  ├─ PHASE_CONCEIVE (phase 1 rules)
  ├─ PHASE_DESIGN (phase 2 rules)
  ├─ PHASE_IMPLEMENT (phase 3 rules)
  ├─ PHASE_TEST_REVISE (phase 4 rules)
  └─ PHASE_OPERATE (phase 5 rules)

Implements:
  ├─ classify_phase() → Detects which phase student is in
  ├─ resolve_active_phase() → Applies sticky-state & validation rules
  ├─ build_system_prompt() → Combines BASE + PHASE (+RAG)
  └─ get_phase_progress() → Returns sidebar state

Used by: main.py (multiple functions called)
```

### **rag.py — The Knowledge Librarian**
```
Reads from: data/knowledge/*.{txt,md}
  • tools-library.md
  • coaching-rules.md
  • problem-categories.md
  • hybrid-framework.md
  • sample-project-template.md

Scoring Algorithm:
  Phase name match (e.g., "Empathize"): +10 each
  Phase keywords (e.g., "interview", "user"): +2 each
  User query words (e.g., "how", "users"): +0.5 each

Returns:
  Top 2 passages, max 500 chars each
  OR empty string if no matches

Used by: main.py (in /chat endpoint)
```

### **data/knowledge/ — The Content Library**
```
Files (all .txt and .md supported):
  
  tools-library.md
    └─ Contains: 6-phase tools, coaching paths, exit signals
       Used by: RAG when phase keywords match
  
  coaching-rules.md
    └─ Contains: EngiBuddy coaching philosophy & practices
       Used by: RAG when "coaching", "rules", "approach" mentioned
  
  problem-categories.md
    └─ Contains: Student problem taxonomy & diagnostics
       Used by: RAG when "problem", "scope", "planning" mentioned
  
  hybrid-framework.md
    └─ Contains: Detailed PBL framework explanation
       Used by: RAG for framework-related questions
  
  sample-project-template.md
    └─ Contains: Example student project walkthrough
       Used by: RAG when phase-specific examples needed
```

---

## 🔗 Request-Response Cycle

### **Request (Frontend → Backend)**
```
POST http://localhost:8000/chat

Headers:
  Content-Type: application/json

Body:
{
  "userMessage": "How do I interview users?",
  "sessionId": "student-123",
  "projectId": "health-tracker-app",
  "conversationHistory": [
    {
      "role": "user",
      "content": "I'm building a health tracking app"
    },
    {
      "role": "assistant",
      "content": "Tell me more about your users..."
    }
  ]
}
```

### **Response (Backend → Frontend)**
```
HTTP 200 OK

Headers:
  Content-Type: application/json
  CORS headers (allow frontend domain)

Body:
{
  "assistantMessage": "Who are the specific people you've identified that need this? Can you tell me about one real conversation you had?",
  
  "classification": {
    "phase": 0,
    "phase_name": "Empathize",
    "confidence": 0.97,
    "transition": "stay",
    "reason": "Question about user interviews belongs to Empathize phase"
  },
  
  "phaseProgress": {
    "phases": [
      {
        "id": 0,
        "name": "Empathize",
        "active": true,
        "visited": true,
        "completed": false
      },
      {
        "id": 1,
        "name": "Conceive",
        "active": false,
        "visited": false,
        "completed": false
      },
      ... (phases 2-5)
    ],
    "current": 0
  }
}
```

---

## ⚙️ System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    BROWSER / FRONTEND                          │
│  (React/Next.js: app/, components/)                           │
│  Sends: userMessage, sessionId, history                       │
│  Receives: assistantMessage, classification, phaseProgress    │
└───────────────────────────┬──────────────────────────────────┘
                            │
                   HTTP POST /chat
                            │
┌───────────────────────────↓──────────────────────────────────────┐
│                 BACKEND / FastAPI (main.py)                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. Load Configuration                                  │    │
│  │    config.py → get_llm_config()                        │    │
│  │    Returns: LLMConfig(api_key, base_url, model)        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                     │
│  ┌─────────────────────────↓─────────────────────────────────┐  │
│  │ 2. Session State                                           │  │
│  │    SESSIONS[session_id] → SessionState(phase_history,    │  │
│  │                                       current_phase)     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────↓─────────────────────────────────┐  │
│  │ 3. Phase Classification (get LLM decision)                │  │
│  │    system_prompt.py → classify_phase()                     │  │
│  │    Calls: _llm_chat_completion(PHASE_CLASSIFIER_PROMPT)    │  │
│  │    Returns: {phase, confidence, transition, reason}       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────↓─────────────────────────────────┐  │
│  │ 4. Resolve Phase (apply sticky-state)                     │  │
│  │    system_prompt.py → resolve_active_phase()              │  │
│  │    Rule: confidence < 0.35 → stay in current phase        │  │
│  │    Returns: final phase_id (0-5)                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────↓─────────────────────────────────┐  │
│  │ 5. RAG: Retrieve Knowledge Base Context                    │  │
│  │    rag.py → retrieve_context()                             │  │
│  │    Reads: data/knowledge/*.md files                        │  │
│  │    Scores: by phase keywords + user query words            │  │
│  │    Returns: top 2 passages (1KB total)                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────↓─────────────────────────────────┐  │
│  │ 6. Build System Prompt                                     │  │
│  │    system_prompt.py → build_system_prompt()                │  │
│  │    Combines: BASE_PERSONALITY                              │  │
│  │             + PHASE_PROMPTS[phase_id]                      │  │
│  │             + RAG context (if found)                       │  │
│  │    Returns: final system prompt (5.5KB)                    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────↓─────────────────────────────────┐  │
│  │ 7. Call LLM (with hardened wrapper)                       │  │
│  │    main.py → _llm_chat_completion()                        │  │
│  │    POST: https://api.openai.com/v1/chat/completions       │  │
│  │    Payload: {model, messages: [system, user], ...}        │  │
│  │    Error handling: ✓ Validates HTTP ✓ Parses JSON         │  │
│  │                   ✓ Handles edge cases ✓ Returns fallback  │  │
│  │    Returns: assistant response text                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────↓─────────────────────────────────┐  │
│  │ 8. Return Response                                         │  │
│  │    Format: JSON with assistantMessage, classification,    │  │
│  │           phaseProgress                                    │  │
│  │    Status: HTTP 200 OK (even with fallback responses)      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                            │
                   HTTP 200 / JSON
                            │
┌───────────────────────────↓──────────────────────────────────┐
│                    BROWSER / FRONTEND                        │
│  Updates: chat-window.tsx (display message)                 │
│           phase-sidebar.tsx (update phase display)          │
│  Ready for: next student input                              │
└────────────────────────────────────────────────────────────┘
```

---

## 📋 Checklist: How Files Work Together

- [x] **config.py** loads environment variables on startup
- [x] **main.py** calls `config.get_llm_config()` to get credentials
- [x] **main.py** calls `system_prompt.classify_phase()` which calls LLM
- [x] **system_prompt.py** contains all prompts (BASE, PHASE-SPECIFIC)
- [x] **main.py** calls `system_prompt.resolve_active_phase()` to apply rules
- [x] **main.py** calls `rag.retrieve_context()` to get knowledge
- [x] **rag.py** reads and scores files from `data/knowledge/`
- [x] **main.py** calls `system_prompt.build_system_prompt()` to combine all
- [x] **main.py** calls `_llm_chat_completion()` with final system prompt
- [x] **_llm_chat_completion()** handles all errors with fallbacks
- [x] **main.py** returns complete JSON to frontend
- [x] **Frontend** displays response and updates UI

---

## Key Takeaway

**One Student Message Journey:**

```
Student types → main.py receives
  ↓
config.py provides API credentials
  ↓
system_prompt.py classifies phase
  ↓
rag.py retrieves knowledge base content
  ↓
system_prompt.py combines everything into system prompt
  ↓
_llm_chat_completion() calls OpenAI + handles errors
  ↓
main.py returns response
  ↓
Frontend displays + updates sidebar
  ↓
Ready for next message!
```

Every file has a specific job. They work together seamlessly. ✓
