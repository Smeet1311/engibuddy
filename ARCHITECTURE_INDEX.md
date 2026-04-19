# 🏗️ EngiBuddy Flow Architecture - Complete Index

## 📚 Documentation Files (Start Here!)

### **For Quick Understanding:**
1. **[FLOW_AT_A_GLANCE.md](FLOW_AT_A_GLANCE.md)** ⭐ **START HERE**
   - 7-step flow explanation
   - One-sentence role descriptions
   - Full conversation example
   - Best for: Quick overview (5 min read)

2. **[FLOW_QUICK_REFERENCE.md](FLOW_QUICK_REFERENCE.md)** ⭐ **REFERENCE CARD**
   - File interaction table
   - Request/response structure
   - Architecture diagram
   - Best for: Quick lookup (3 min read)

### **For Deep Understanding:**
3. **[FLOW_ARCHITECTURE.md](FLOW_ARCHITECTURE.md)** ⭐ **DETAILED GUIDE**
   - Complete system flow diagram
   - File-by-file breakdown
   - Data flow table
   - Dependencies graph
   - Beginner-to-advanced explanation
   - Best for: Full comprehension (15 min read)

---

## 🔄 The 7-Step Flow (TL;DR)

```
1️⃣  Frontend sends message
2️⃣  Backend loads config (API key, model, base URL)
3️⃣  Classify phase (LLM detects: Empathize? Conceive? Design? etc.)
4️⃣  Resolve phase (apply sticky-state rules)
5️⃣  Retrieve knowledge base (RAG: keyword matching + scoring)
6️⃣  Build system prompt (BASE + PHASE + RAG)
7️⃣  Call OpenAI (with hardened error handling)
    └─ Return response to frontend
```

---

## 📂 File Structure

```
backend/
├── main.py                 🚀 HTTP server & orchestration
├── config.py              ⚙️ LLM configuration management
├── system_prompt.py       🧠 Prompts & phase classification logic
└── rag.py                 📚 Knowledge base retrieval

data/
└── knowledge/
    ├── tools-library.md            (6-phase tools, coaching paths)
    ├── coaching-rules.md           (EngiBuddy philosophy)
    ├── problem-categories.md       (student problem taxonomy)
    ├── hybrid-framework.md         (PBL framework details)
    └── sample-project-template.md  (example project)

.env                       🔐 API credentials (OPENAI_API_KEY, etc.)
```

---

## 🎯 Each File's Role

| File | Responsibility | Key Functions |
|------|---|---|
| **main.py** | HTTP server, request routing, orchestration | `/chat` endpoint, `_llm_chat_completion()` |
| **config.py** | API credential management, validation | `get_llm_config()` returns LLMConfig |
| **system_prompt.py** | Prompt definitions, phase logic | `classify_phase()`, `resolve_active_phase()`, `build_system_prompt()` |
| **rag.py** | Knowledge base retrieval | `retrieve_context()` scores & returns passages |

---

## 💡 How It Works (Simple Version)

```python
# User sends: "How do I interview users?"

# 1. Load credentials
config = get_llm_config()  # config.py

# 2. Classify phase
classification = classify_phase(
    user_message="How do I interview...",
    llm_call=_llm_chat_completion
)  # system_prompt.py + calls LLM

# 3. Resolve phase (sticky-state)
phase_id = resolve_active_phase(classification)  # system_prompt.py

# 4. Get knowledge base
rag_context = retrieve_context(
    user_message="How do I interview...",
    phase_id=0  # Empathize
)  # rag.py

# 5. Build prompt
system_prompt = build_system_prompt(phase_id)  # system_prompt.py
system_prompt += f"\n\nReference context:\n{rag_context}"

# 6. Call LLM
response = _llm_chat_completion(
    base_url=config.base_url,
    api_key=config.api_key,
    model=config.model,
    system=system_prompt,
    messages=[{role: "user", content: user_message}]
)  # main.py

# 7. Return response
return {
    "assistantMessage": response,
    "classification": classification,
    "phaseProgress": get_phase_progress(session)
}
```

---

## 🔗 Data Flow Direction

```
Frontend
   ↓
main.py ← receives HTTP POST /chat
   ├→ config.py ← reads .env
   ├→ system_prompt.py ← calls LLM 3 times
   │   ├→ _llm_chat_completion() → OpenAI API
   │   ├→ _llm_chat_completion() → OpenAI API (different prompt)
   │   └─ Returns {phase, confidence, ...}
   ├→ rag.py ← reads data/knowledge/*.md
   │   └─ Returns knowledge base excerpt
   └→ Returns HTTP 200 JSON
       ↓
Frontend ← displays response + updates sidebar
```

---

## 📊 Request-Response Cycle

### **Request (Frontend → Backend)**
```json
POST /chat
{
  "userMessage": "How do I interview users?",
  "sessionId": "student-123",
  "conversationHistory": [...]
}
```

### **Response (Backend → Frontend)**
```json
{
  "assistantMessage": "Who are the people you can realistically talk to...",
  "classification": {
    "phase": 0,
    "phase_name": "Empathize",
    "confidence": 0.97,
    "transition": "stay",
    "reason": "Question about user interviews..."
  },
  "phaseProgress": {
    "phases": [
      {"id": 0, "name": "Empathize", "active": true, "visited": true},
      {"id": 1, "name": "Conceive", "active": false, "visited": false},
      ...
    ],
    "current": 0
  }
}
```

---

## 🔐 Error Handling

**_llm_chat_completion() is hardened:**

```python
def _llm_chat_completion(...):
    """
    Defensively calls OpenAI API with comprehensive error handling.
    
    Validates:
    ✓ HTTP response status (resp.ok)
    ✓ JSON structure (choices[], message, content)
    ✓ Content type (string or list)
    ✓ Empty responses
    ✓ Network errors
    
    Returns:
    - Actual content if successful
    - Fallback message if ANY error
    """
    
    try:
        resp = requests.post(...)
        
        if not resp.ok:
            logger.error(...)
            return "I could not generate a response..."
        
        data = resp.json()  # May raise: JSONDecodeError
        choices = data.get("choices")
        
        if not choices or len(choices) == 0:
            logger.error(...)
            return "I could not generate a response..."
        
        message = choices[0].get("message")
        if not message:
            logger.error(...)
            return "I could not generate a response..."
        
        content = message.get("content")
        
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            return "\n".join(...).strip()
        
        # Content is neither string nor list
        return "I could not generate a response..."
        
    except requests.RequestException:
        logger.error(...)
        return "I could not generate a response..."
    except Exception:
        logger.error(...)
        return "I could not generate a response..."
```

→ **Result: No endpoint crashes, always returns gracefully** ✓

---

## ⚙️ Configuration

**config.py reads from .env:**

```ini
# .env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

**Then validates:**

```python
config = get_llm_config()
# Raises ValueError if OPENAI_API_KEY is missing/empty
# Returns LLMConfig object with all three values
```

---

## 🧠 RAG (Retrieval-Augmented Generation)

**How RAG works:**

1. **Input:** `user_message="How do I interview users?"`, `phase_id=0`

2. **Read files:** All .txt and .md from `data/knowledge/`
   - tools-library.md
   - coaching-rules.md
   - problem-categories.md
   - hybrid-framework.md
   - sample-project-template.md

3. **Score each file:**
   ```
   Phase name match ("Empathize"):    +10 per occurrence
   Phase keywords ["interview", "user"]: +2 per occurrence
   Query words ["interview"]:          +0.5 per occurrence
   ```

4. **Return:** Top 2 passages (≤500 chars each) OR empty string if no matches

5. **Integration:** Prepend context to system prompt
   ```
   system_prompt = BASE_PERSONALITY + PHASE_PROMPTS[phase]
   if rag_context:
       system_prompt += "\n\n--- Reference context:\n" + rag_context + "\n---"
   ```

---

## 📈 Phase Progression

**Sticky-State Logic (prevents phase jumping):**

```python
def resolve_active_phase(classification, previous_phase, threshold=0.35):
    confidence = classification.get("confidence", 0.0)
    transition = classification.get("transition", "stay")
    proposed_phase = classification.get("phase", previous_phase)
    
    # Rule 1: Low confidence → stay
    if confidence < threshold and transition != "stay":
        return previous_phase
    
    # Rule 2: Explicit stay → stay
    if transition == "stay":
        return previous_phase
    
    # Rule 3: High confidence + advance/retreat → trust it
    return proposed_phase
```

**Example progression:**
```
Message 1: "I need to build something"
  → classify_phase(): {phase: 0, confidence: 0.87}
  → resolve_active_phase(): EMPATHIZE (phase 0)

Message 2: "I've interviewed 5 users"
  → classify_phase(): {phase: 1, confidence: 0.89}
  → resolve_active_phase(): CONCEIVE (phase 1) ✓ moved!

Message 3: "Can I still refine my problem?"
  → classify_phase(): {phase: 0, confidence: 0.45}
  → resolve_active_phase(): CONCEIVE (stays, confidence too low)

Message 4: "I need to go back to empathize"
  → classify_phase(): {phase: 0, confidence: 0.92, transition: "retreat"}
  → resolve_active_phase(): EMPATHIZE (phase 0) ✓ explicit retreat
```

---

## 🎓 Example Full Conversation Flow

```
STUDENT: "I want to build an app to help seniors stay active"

[Backend processes]
├─ Phase: EMPATHIZE (phase 0) ← focuses on user discovery
├─ RAG: Retrieves tools-library.md about Phase 0 tools
├─ System Prompt: BASE + PHASE_EMPATHIZE + RAG content
└─ Response: "Who is one senior person you know who..."

────────────────────────────────────────────────────────

STUDENT: "My grandmother, she feels isolated at home"

[Backend processes]
├─ Phase: EMPATHIZE (phase 0) ← still discovering
├─ RAG: Retrieves coaching-rules.md about empathy
├─ System Prompt: BASE + PHASE_EMPATHIZE + RAG content
└─ Response: "What does she wish she could do more often?"

────────────────────────────────────────────────────────

STUDENT: "She wants daily calls with family"

[Backend processes]
├─ Phase: EMPATHIZE (phase 0) ← still in discovery
├─ RAG: Still retrieving empathize-phase content
├─ System Prompt: BASE + PHASE_EMPATHIZE + RAG content
└─ Response: "That's a specific need. Have you asked..."

────────────────────────────────────────────────────────

STUDENT: "Yes. I interviewed 3 seniors, they all want..."

[Backend processes]
├─ Phase: CONCEIVE (phase 1) ← ADVANCED! (confidence 0.88)
├─ RAG: Retrieves tools-library.md about Phase 1
│   (problem statements, scope, success criteria)
├─ System Prompt: BASE + PHASE_CONCEIVE + RAG content
└─ Response: "Now let's write this down. What's the..."

────────────────────────────────────────────────────────
```

---

## 📞 Need Help? Reference:

| Question | File to Read |
|----------|--------------|
| "What is the 7-step flow?" | [FLOW_AT_A_GLANCE.md](FLOW_AT_A_GLANCE.md) |
| "How do files interact?" | [FLOW_QUICK_REFERENCE.md](FLOW_QUICK_REFERENCE.md) |
| "Show me the full architecture" | [FLOW_ARCHITECTURE.md](FLOW_ARCHITECTURE.md) |
| "What does config.py do?" | Line 2 of any file above |
| "How does RAG work?" | See RAG section above |
| "What about error handling?" | See Error Handling section above |
| "How are phases managed?" | See Phase Progression section above |

---

## ✅ Verification Checklist

- [x] Backend is running on `http://127.0.0.1:8000`
- [x] `/health` endpoint responds (Server is up)
- [x] `/chat` endpoint accepts requests
- [x] Config loads from `.env`
- [x] Phase classification works
- [x] RAG retrieves from `data/knowledge/`
- [x] System prompt combines BASE + PHASE + RAG
- [x] OpenAI API is called correctly
- [x] Error handling returns fallback (no crashes)
- [x] Response JSON is properly formatted
- [x] Frontend displays message + sidebar updates
- [x] Conversation history is preserved across messages

**Status: ✅ PRODUCTION READY**

---

## 🎯 Big Picture

**EngiBuddy is a Socratic coaching bot powered by:**

1. **LLM (OpenAI GPT-4o-mini)** — Generates conversational responses
2. **PBL Framework (6 phases)** — Structures the coaching journey
3. **RAG (knowledge base)** — Grounds responses in course content
4. **Session Management** — Remembers student progress
5. **Hardened API calls** — Never crashes, always provides fallback

**From a student's perspective:**
- Type a question
- Get a Socratic response
- See your phase progress
- Continue learning

**From a developer's perspective:**
- `main.py` orchestrates everything
- Each file has one clear responsibility
- Error handling is comprehensive
- Adding new knowledge is just adding `.md` files
- Extending is modular and safe

---

**Welcome to EngiBuddy! 🎓**
