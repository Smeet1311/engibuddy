# EngiBuddy Flow - At-A-Glance

## The 7-Step Flow (Student Message → Bot Response)

```
STEP 1: FRONTEND SENDS MESSAGE
├─ User types in chat-input.tsx
├─ Creates JSON: {userMessage, sessionId, conversationHistory}
└─ POST to http://localhost:8000/chat

STEP 2: BACKEND LOADS CONFIG
├─ main.py receives request
├─ Calls: config.get_llm_config()
│  └─ Reads .env: OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL
└─ Returns: LLMConfig object with credentials

STEP 3: CLASSIFY PHASE (What is student doing?)
├─ main.py calls: system_prompt.classify_phase()
├─ Which calls: _llm_chat_completion(
│                 system=PHASE_CLASSIFIER_PROMPT,
│                 messages=[classification_request]
│              )
├─ LLM analyzes user message
└─ Returns: {phase: 0, confidence: 0.97, transition: "stay", ...}

STEP 4: RESOLVE PHASE (Apply sticky-state logic)
├─ main.py calls: system_prompt.resolve_active_phase()
├─ Rule: if confidence < 0.35, stay in current phase
├─ Otherwise, use proposed phase
└─ Returns: phase_id (0-5)

STEP 5: RETRIEVE KNOWLEDGE BASE (RAG)
├─ main.py calls: rag.retrieve_context(
│                   user_message="How do I interview users?",
│                   phase_id=0
│                )
├─ rag.py reads all files from data/knowledge/
├─ Scores each file:
│  │  Phase name "empathize": +10 per match
│  │  Phase keywords ["interview", "user"]: +2 per match
│  └─ User query words ["interview"]: +0.5 per match
├─ Returns top 2 passages (≤500 chars)
└─ Result: ~988 character excerpt from problem-categories.md

STEP 6: BUILD SYSTEM PROMPT
├─ main.py calls: system_prompt.build_system_prompt(phase_id=0)
├─ Returns: BASE_PERSONALITY + PHASE_EMPATHIZE + RAG_CONTEXT
├─ Total size: ~5.5 KB
└─ This prompt guides what the LLM will respond with

STEP 7: CALL OPENAI & RETURN RESPONSE
├─ main.py calls: _llm_chat_completion(
│                   base_url="https://api.openai.com/v1",
│                   api_key="sk-...",
│                   model="gpt-4o-mini",
│                   system=[5.5KB prompt from STEP 6],
│                   messages=[{role: "user", content: "How do I..."}],
│                   temperature=0.6,
│                   max_tokens=1024
│                )
├─ Hardened error handling:
│  ├─ Validates HTTP 200 response
│  ├─ Defensively parses JSON
│  ├─ Checks choices[], message, content exist
│  └─ Returns fallback if anything fails
├─ OpenAI returns: {"choices":[{"message":{"content":"..."}}]}
├─ _llm_chat_completion returns: "Who are the people..."
├─ main.py also calls: system_prompt.get_phase_progress()
│  └─ Returns sidebar state {phases: [...], current: 0}
└─ Returns HTTP 200 with JSON:
   {
     "assistantMessage": "Who are the people...",
     "classification": {phase: 0, confidence: 0.97, ...},
     "phaseProgress": {phases: [...], current: 0}
   }

STEP 8: FRONTEND UPDATES UI
├─ chat-window.tsx displays assistantMessage
├─ phase-sidebar.tsx highlights current phase
└─ Ready for next message!
```

---

## File Roles (One Sentence Each)

| File | Role |
|------|------|
| **main.py** | HTTP server that orchestrates all steps, calls other modules, returns responses |
| **config.py** | Reads and validates API credentials from environment |
| **system_prompt.py** | Stores all prompts (BASE, 6 phases) and implements phase logic (classify, resolve, build) |
| **rag.py** | Reads knowledge base files, scores by relevance, returns top passages |
| **data/knowledge/** | Markdown files with tools, coaching rules, problem categories, examples |
| **.env** | Environment variables: OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL |

---

## What Each Component Does

### Frontend
- Collects user input in chat-input.tsx
- Sends POST request with message + session ID
- Receives JSON response
- Displays message in chat-window.tsx
- Updates 6-phase sidebar with phaseProgress

### Backend (main.py)
- Receives HTTP request
- Loads config, manages sessions
- Orchestrates: classify → resolve → retrieve RAG → build prompt → call LLM
- Returns JSON response

### Config (config.py)
- Reads OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL
- Validates API key exists
- Returns LLMConfig object

### Prompts (system_prompt.py)
- Has BASE_PERSONALITY (shared rules for all phases)
- Has PHASE_EMPATHIZE, PHASE_CONCEIVE, etc. (phase-specific rules)
- classify_phase(): Uses LLM to detect which phase student is in
- resolve_active_phase(): Applies sticky-state rules
- build_system_prompt(): Combines BASE + PHASE + optional RAG
- get_phase_progress(): Returns sidebar state

### RAG (rag.py)
- Reads all files from data/knowledge/
- Scores files by relevance (phase name, keywords, query)
- Returns top 2 passages (max 500 chars each)
- Empty string if no matches (safe fallback)

### Knowledge Base (data/knowledge/)
- tools-library.md: 6-phase tools, coaching paths
- coaching-rules.md: EngiBuddy philosophy
- problem-categories.md: Student problem taxonomy
- hybrid-framework.md: Framework details
- sample-project-template.md: Example project

### API Wrapper (_llm_chat_completion in main.py)
- Builds OpenAI API payload
- Makes HTTP POST to https://api.openai.com/v1/chat/completions
- Validates HTTP response (checks 200 status)
- Defensively parses JSON (checks choices, message, content)
- Handles content as string OR list of parts
- Returns fallback on ANY error
- Logs all issues

---

## Example: Full Conversation

```
┌─────────────────────────────────────────────────────────────────┐
│ STUDENT MESSAGE 1: "I'm building a health tracking app"        │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ main.py /chat endpoint receives request                          │
│ └─ config.py: api_key = "sk-..."                               │
│ └─ system_prompt.classify_phase():                              │
│    "Building", "app" → probably EMPATHIZE or CONCEIVE          │
│    LLM returns: {phase: 0, confidence: 0.92}                   │
│ └─ resolve_active_phase():                                      │
│    First message, default to EMPATHIZE                          │
│    0.92 > 0.35, so accept phase 0                              │
│ └─ rag.retrieve_context("I'm building a health...", phase 0): │
│    Keyword "building", "app" → matches design files            │
│    But phase 0 (Empathize) → prefer "empathize", "user"       │
│    Returns: tools-library.md excerpt about Phase 0             │
│ └─ build_system_prompt(0):                                      │
│    BASE_PERSONALITY + PHASE_EMPATHIZE + RAG content            │
│ └─ _llm_chat_completion():                                      │
│    Calls OpenAI with system prompt                              │
│    Returns: "Who are the actual people who need this?"         │
│ └─ get_phase_progress():                                        │
│    {phases: [{id:0, active:true, visited:true}, ...], ...}    │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND DISPLAYS:                                               │
│ Chat: Bot: "Who are the actual people who need this?"          │
│ Sidebar: Phase 0 (Empathize) highlighted ✓                     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STUDENT MESSAGE 2: "My friends who want to track their fitness" │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ main.py /chat endpoint receives request + conversation history  │
│ └─ Session remembered: current_phase = 0 (Empathize)           │
│ └─ classify_phase() with conversation context:                  │
│    Student said "my friends", "track", "fitness"               │
│    Still in Phase 0 (Empathize)                                 │
│    Returns: {phase: 0, confidence: 0.95, transition: "stay"}   │
│ └─ resolve_active_phase():                                      │
│    0.95 > 0.35 and transition="stay", so stay in phase 0      │
│ └─ rag.retrieve_context("My friends who want...", phase 0):    │
│    Keywords "friends" (user), "track" (requirement)            │
│    But phase 0 → prefer "empathize", "user", "interview"       │
│    Returns: tools-library.md excerpt about user discovery      │
│ └─ build_system_prompt(0):                                      │
│    Same as before + conversation history context               │
│ └─ _llm_chat_completion():                                      │
│    OpenAI sees: conversation history + current message          │
│    Returns: "Can you tell me one specific friend..."           │
│ └─ phaseProgress: still phase 0 ✓                              │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND DISPLAYS:                                               │
│ Chat: Bot: "Can you tell me one specific friend..."            │
│ Sidebar: Still Phase 0 (Empathize) ✓                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
        ... (conversation continues) ...
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ STUDENT MESSAGE N: "I've interviewed 5 friends, here's the..."  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ main.py /chat endpoint:                                          │
│ └─ classify_phase():                                             │
│    "interviewed", "here's the problem"                           │
│    Signals: ready to move from Empathize to Conceive            │
│    LLM returns: {phase: 1, confidence: 0.89, ...}              │
│ └─ resolve_active_phase():                                      │
│    previous_phase = 0, proposed = 1                             │
│    1 = 0 + 1 (allowed advance), confidence high                 │
│    Returns: phase_id = 1 ✓                                      │
│ └─ Update SessionState.current_phase = 1                        │
│ └─ rag.retrieve_context("I've interviewed...", phase 1):        │
│    Phase 1 = Conceive, look for problem statement, scope        │
│    Returns: tools-library.md excerpt about scope interrogation  │
│ └─ build_system_prompt(1):                                      │
│    BASE_PERSONALITY + PHASE_CONCEIVE + RAG content              │
│ └─ _llm_chat_completion():                                      │
│    New system prompt guides toward problem statement            │
│    Returns: "Let's sharpen your problem statement..."           │
│ └─ phaseProgress: phase 1 now active ✓                          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND DISPLAYS:                                               │
│ Chat: Bot: "Let's sharpen your problem statement..."            │
│ Sidebar: Phase 1 (Conceive) now highlighted ✓                  │
│           Phase 0 (Empathize) marked as visited ✓              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Insight: System Prompt Evolution

As student progresses, the LLM system prompt changes:

```
Phase 0 (Empathize):
  BASE_PERSONALITY (150 words max, Socratic, anti-fabrication)
  + PHASE_EMPATHIZE (goal: understand users, enforcement rules)
  + RAG (knowledge about user interviews, empathy)
  = Coaching focused on USER DISCOVERY

Phase 1 (Conceive):
  BASE_PERSONALITY (same)
  + PHASE_CONCEIVE (goal: define problem, scope, criteria)
  + RAG (knowledge about problem statements, scope)
  = Coaching focused on PROBLEM DEFINITION

Phase 2 (Design):
  BASE_PERSONALITY (same)
  + PHASE_DESIGN (goal: research, arch, planning)
  + RAG (knowledge about design decisions, WBS, tech choices)
  = Coaching focused on PLANNING & DESIGN

... and so on through Phase 5 (Operate)
```

The same LLM model (GPT-4o-mini) produces different coaching based on which phase it's in! ✓

---

## Summary

**Everything flows through main.py:**

1. Request arrives
2. Load config (credentials)
3. Classify phase (what is student doing?)
4. Resolve phase (apply rules)
5. Retrieve RAG (knowledge base)
6. Build system prompt (BASE + PHASE + RAG)
7. Call OpenAI (with hardened error handling)
8. Return response

**Each file has ONE job:**
- **config.py** → credentials
- **system_prompt.py** → prompts & phase logic
- **rag.py** → knowledge retrieval
- **main.py** → orchestration

**This design is:**
- ✓ Maintainable (easy to change prompts, config, or knowledge)
- ✓ Safe (hardened error handling, graceful fallbacks)
- ✓ Modular (each file can be tested independently)
- ✓ Extensible (easy to add new phases, tools, or knowledge)
