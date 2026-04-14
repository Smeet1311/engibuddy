# EngiBuddy Backend Architecture (Prompt 2)

Complete implementation of EngiBuddy's core coaching logic and orchestration system.

## What Was Built

### Core Components

**1. Phase Detection & Framework Logic**
- Heuristic phase detection using keywords, project state, and conversation signals
- Support for Hybrid 6-phase and Barak 5-phase frameworks
- Problem categorization (unclear-scope, missing-research, etc.)
- Confidence scoring and supporting evidence

**2. Project Memory Management**
- Load/save project profiles with full metadata
- Track phases, milestones, blockers, technologies
- In-memory metadata cache (TODO: extend to Prisma in Prompt 4)
- Project summary generation for coaching context

**3. Coaching Strategies**
- 6 core coaching principles encoded as rules
- Socratic questioning, diagnosis-first, incremental guidance
- Scope narrowing, quality practices encouragement
- Coaching mode selection (diagnostic/scaffolding/validation)

**4. Tool Registry (15 MVP Tools)**
- Each tool is phase-specific and problem-targeted
- Template-based: scaffolding, artifact generation, validation
- Tools span entire PBL lifecycle (scope → implementation → reflection)
- Helper functions to suggest tools by phase or problem

**5. Artifact Generator**
- 8 structured markdown templates (problem statement, WBS, test plan, etc.)
- Templates include guidance and placeholders
- Artifact tracking with phase and type metadata
- Ready for students to fill in with actual project content

**6. System Prompt Builder**
- Master system prompt with role, principles, and phase context
- Enforces structured coaching (no answer-dumping)
- Embed framework-specific and phase-specific guidance
- TODO: RAG knowledge integration point identified

**7. Chat Orchestrator**
- Single entry point for all chat processing
- 10-step orchestration pipeline:
  1. Load project context
  2. Detect phase + problems
  3. Update phase if changed
  4. Build student state
  5. Select coaching mode
  6. Suggest tools
  7. Build LLM context
  8. Call LLM (placeholder)
  9. Generate artifacts
  10. Return structured response
- Saves messages and artifacts to database

**8. API Endpoint**
- `POST /api/chat` - Main chat interface
- `GET /api/chat/history` - Retrieve conversation history
- Full error handling and validation
- Persists to Prisma database

### File Structure

```
lib/
├── ai/
│   ├── phase-detector.ts        # Heuristic phase detection
│   ├── project-memory.ts        # Project context management
│   ├── coaching-strategies.ts  # Behavior rules & coaching modes
│   └── chat-orchestrator.ts    # Main orchestration engine
├── frameworks/
│   ├── hybrid-framework.ts      # 6-phase framework definition
│   └── barak-framework.ts       # 5-phase framework definition
├── prompts/
│   └── engibuddy-system-prompt.ts # System prompt builder
├── tools/
│   ├── tool-registry.ts         # 15 MVP tools
│   ├── artifact-generator.ts    # Markdown artifact templates
│   └── helpers.ts               # Utility functions
├── db/
│   └── prisma.ts                # Database client
app/
└── api/
    └── chat/
        └── route.ts             # POST /api/chat endpoint
types/
└── index.ts                     # Comprehensive TypeScript definitions
```

## Key Design Decisions

### Phase Detection
- **Heuristic approach**: Keyword patterns + project state + conversation signals
- **Per-framework keywords**: Different words for Hybrid vs. Barak
- **Confidence scoring**: 0-1 scale for reliability measure
- **Problem category detection**: Identifies specific types of stuck-ness

### Coaching Philosophy Encoded
1. **Ask before solving** — Socratic questions first
2. **Diagnose root cause** — Diagnostic questions to understand
3. **Small next steps** — Incremental guidance, not full solutions
4. **Encourage quality** — Testing, documentation, reflection
5. **Respect constraints** — Budget, time, materials, skill
6. **Engineering mindset** — Proper terminology, best practices

### Tool Design
- **15 tools covering entire lifecycle** — From problem definition to reflection
- **Declarative definitions** — Easy to add/modify tools
- **Markdown templates** — Students fill in content themselves
- **Phase + problem mapping** — Suggest tools relevant to situation
- **Type classification** — diagnosis, scaffolding, generation, validation

### Artifact Generation
- **8 template types** — Problem statement, WBS, test plan, retrospective, etc.
- **Placeholder approach** — Templates with blanks for students to complete
- **Phase-aware** — Different artifacts highlighted at different phases
- **Database persistence** — Artifacts saved for reference

### Architecture for RAG & LLM
- **Placeholder implementation** — `callLLM()` function ready for OpenAI
- **Knowledge context point** — RAG retrieval integrated at orchestration level
- **System prompt flexibility** — Can embed knowledge directly or reference it
- **Modular design** — Can swap implementations without changing architecture

## How It Works

### The 10-Step Orchestration Flow

1. **Load Project** — Get/create project profile
2. **Detect Phase** — Analyze message to find current phase + problems
3. **Update State** — Save detected phase back to project
4. **Build Student State** — Track progress, challenges, tools used
5. **Select Mode** — Choose diagnostic/scaffolding/validation coaching
6. **Suggest Tools** — Find relevant tools by phase × problem
7. **Build Context** — Assemble system prompt + project context + history
8. **Call LLM** — Placeholder for OpenAI integration (Prompt 4)
9. **Generate Artifacts** — Create templates for current phase
10. **Return Response** — Structured response with message + metadata

### Example Flow

```
User: "I'm not sure what to build"
↓
Phase detector: Probably "empathize", problem: "unclear-scope"
↓
Coaching mode: "diagnostic" (need to understand)
↓
Tools suggested: Scope Interrogator, Problem Statement Generator
↓
System prompt: "You're in Empathize phase, student is confused about scope"
↓
LLM generates: First, asks clarifying questions about stakeholders
↓
Artifacts generated: Problem Statement template
↓
Response:
  - Message: [Socratic questions about problem]
  - Phase: empathize
  - Tool: scope-interrogator
  - NextStep: "Write down one sentence: 'I'm solving X for Y'"
  - Artifacts: [Problem Statement template]
```

## Type System

All types are in `types/index.ts`:
- `ProjectProfile` — Full project state (title, domain, goal, constraints, etc.)
- `Phase` — Union of Hybrid + Barak phases
- `PhaseDetectionResult` — Phase + confidence + problems + evidence
- `StudentState` — Current progress (messages, artifacts, blockers)
- `ChatRequest/Response` — API contract
- `ToolDefinition` — Tool structure with invoke function
- `Artifact` — Template artifacts with metadata
- `PhaseDefinition` — Framework phase configuration
- `LLMContext` — Everything needed for LLM prompt

## Integration Points

### For Prompt 3 (Frontend)
- Import and call `orchestrateChat()`
- Display `ChatResponse` with message + tool + artifacts
- Build UI around phase progress and tool suggestions
- Create forms for artifact input

### For Prompt 4 (RAG + OpenAI)
1. **RAG Integration**
   - In `chat-orchestrator.ts`: Call Chroma to retrieve knowledge
   - In `phase-detector.ts`: Use similarity for better phase matching
   - In system prompt: Embed retrieved context

2. **OpenAI Integration**
   - Replace `callLLM()` placeholder with actual API call
   - Format system + user messages for OpenAI
   - Handle streaming (optional)
   - Implement token counting and limits

3. **Database Schema Extension**
   - Extend Prisma schema for all `ProjectProfile` fields
   - Move in-memory metadata to database
   - Add conversation metrics (clarity, depth, quality)

## Testing Approach

All functions are designed to be independently testable:

```typescript
// Test phase detection
const result = detectPhase(message, projectProfile, recentContext)
expect(result.detectedPhase).toBe('design')
expect(result.confidence).toBeGreaterThan(0.7)

// Test tool suggestion
const tools = getToolsForPhase('design')
expect(tools).toContain(wbsWizard)

// Test artifact generation
const artifact = await generateArtifact('wbs', projectId, 'design')
expect(artifact.type).toBe('wbs')
expect(artifact.content).toContain('Phase 1')

// Test orchestration
const response = await orchestrateChat(chatRequest)
expect(response.detectedPhase).toBeDefined()
expect(response.assistantMessage).toBeTruthy()
```

## Code Quality Notes

- **Strong TypeScript** — All functions fully typed, no `any` except where necessary
- **Pure functions** — Most functions don't have side effects (testable)
- **Modular design** — Each module has a single responsibility
- **TODO markers** — Clear notes for Prompt 4 integration points
- **Error handling** — Try-catch blocks around database operations
- **Logging** — console.error for debugging (can enhance in Prompt 4)

## MVP Scope

This Prompt 2 implementation:
- ✅ Complete backend architecture
- ✅ Phase detection and coaching logic
- ✅ 15 guided tools with templates
- ✅ Artifact generation
- ✅ Chat orchestration
- ✅ API endpoint
- ✅ Prisma database integration
- ❌ No UI (Prompt 3)
- ❌ No OpenAI integration (Prompt 4)
- ❌ No RAG (Prompt 4)

## Performance Considerations

- Phase detection uses simple string.includes() (fast)
- Tool suggestion is array filtering (fast)
- Artifact generation creates markdown strings (fast)
- LLM call will be the bottleneck (expected, async)
- Database saves are async (non-blocking)

## Security Considerations

- Validates projectId/sessionId in API
- Sanitizes database input via Prisma
- Limits conversation history to last N messages
- Error messages don't leak internal details
- TODO: Add rate limiting (Prompt 4)
- TODO: Add authentication (future)

---

**Status:** Backend architecture complete and ready for Prompt 3 (Frontend UI)
