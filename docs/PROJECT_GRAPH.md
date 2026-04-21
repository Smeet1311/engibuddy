# EngiBuddy Project Graph

This graph maps the current repository at a practical engineering level: runtime flow, core files, persisted state, and external dependencies.

## Runtime Flow

```mermaid
flowchart LR
    User[Student] --> Page[app/page.tsx]
    Page --> Shell[components/chat/chat-shell.tsx]
    Shell --> Window[components/chat/chat-window.tsx]
    Shell --> Input[components/chat/chat-input.tsx]
    Shell --> Sidebar[components/chat/phase-sidebar.tsx]

    Input --> Shell
    Shell -->|POST /chat| API[backend/main.py]

    API --> Config[backend/config.py]
    API --> DB[backend/db.py]
    API --> Prompts[backend/system_prompt.py]
    API --> RAG[backend/rag.py]

    Config --> Env[.env]
    DB --> SQLite[(backend/engibuddy_sessions.db)]
    Prompts -->|classification + coaching calls| OpenAI[OpenAI-compatible API]
    RAG --> Knowledge[data/knowledge/*.md]
    API -->|assistantMessage + classification + phaseProgress| Shell
    Shell --> Window
    Shell --> Sidebar
```

## Backend Call Graph

```mermaid
flowchart TD
    Chat[chat req: ChatRequest] --> Validate[validate userMessage]
    Validate --> LoadConfig[get_llm_config]
    LoadConfig --> SessionLoad[_get_session]
    SessionLoad --> DBLoad[load_or_create_session]

    DBLoad --> Classify[classify_phase]
    Classify --> LLMClassify[_llm_chat_completion]
    LLMClassify --> Resolve[resolve_active_phase]

    Resolve --> MarkCompleted[mark completed phases on advance]
    MarkCompleted --> Retrieve[retrieve_context]
    Retrieve --> BuildPrompt[build_system_prompt]
    BuildPrompt --> LLMRespond[_llm_chat_completion]
    LLMRespond --> Save[_save_session]
    Save --> DBSave[save_session]
    DBSave --> Progress[get_phase_progress]
    Progress --> Response[JSON response]
```

## Frontend State Graph

```mermaid
stateDiagram-v2
    [*] --> Ready
    Ready --> Sending: user submits message
    Sending --> Updating: backend returns ok
    Sending --> Error: fetch fails or backend non-2xx
    Updating --> Ready: append assistant message, phase progress, classification
    Error --> Ready: append red backend error bubble
```

## Data Shapes

```mermaid
erDiagram
    SESSION {
        string id PK
        string project_id
        int current_phase
        text phase_history
        text phase_exit_met
        string created_at
        string updated_at
    }

    CHAT_RESPONSE {
        string assistantMessage
        object classification
        object phaseProgress
    }

    CLASSIFICATION {
        int phase
        string phase_name
        float confidence
        string transition
        string reason
    }

    PHASE_PROGRESS {
        int current
        list phases
    }

    SESSION ||--|| PHASE_PROGRESS : builds
    CHAT_RESPONSE ||--|| CLASSIFICATION : includes
    CHAT_RESPONSE ||--|| PHASE_PROGRESS : includes
```

## File Responsibility Map

```mermaid
flowchart TB
    subgraph Frontend
        App[app/page.tsx<br/>Mounts chat shell]
        Layout[app/layout.tsx<br/>Metadata and root layout]
        ChatShell[chat-shell.tsx<br/>Session ID, API call, state]
        ChatWindow[chat-window.tsx<br/>Messages, loading, errors]
        ChatInput[chat-input.tsx<br/>Textarea and submit]
        PhaseSidebar[phase-sidebar.tsx<br/>Visited/completed/current phases]
    end

    subgraph Backend
        Main[main.py<br/>FastAPI app and orchestration]
        DBPy[db.py<br/>SQLite session persistence]
        ConfigPy[config.py<br/>LLM env config]
        PromptPy[system_prompt.py<br/>Phase prompts and classifier]
        RagPy[rag.py<br/>Keyword retrieval]
    end

    subgraph Content
        Knowledge[data/knowledge<br/>PBL reference markdown]
        Docs[docs<br/>Architecture notes]
        Readme[README.md<br/>Setup and config]
    end

    App --> ChatShell
    ChatShell --> ChatWindow
    ChatShell --> ChatInput
    ChatShell --> PhaseSidebar
    ChatShell --> Main
    Main --> DBPy
    Main --> ConfigPy
    Main --> PromptPy
    Main --> RagPy
    RagPy --> Knowledge
    Readme --> Docs
```

## High-Value Change Points

- To adjust phase behavior, start in `backend/system_prompt.py`.
- To change persistence, start in `backend/db.py`, then check `_get_session` and `_save_session` in `backend/main.py`.
- To change the chat request/response UI, start in `components/chat/chat-shell.tsx`.
- To change phase journey visuals, start in `components/chat/phase-sidebar.tsx`.
- To add course knowledge, add or edit Markdown files in `data/knowledge/`.
