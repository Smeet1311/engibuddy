# EngiBuddy

**EngiBuddy** is an AI-powered structured thinking companion for STEM/engineering Project-Based Learning (PBL). It's not a generic answer bot—it's a coaching system that scaffolds student reasoning, asks clarifying questions first, detects what stage of a project students are in, and recommends the next step.

## What Makes EngiBuddy Different

Instead of providing direct answers, EngiBuddy:
- 🎯 **Detects your project phase** using the Hybrid 6-phase or Barak 5-phase PBL frameworks
- 🤔 **Asks clarifying questions first** to understand your thinking
- 📋 **Provides scaffolds & templates** tailored to your current phase
- 🎓 **Coaches, not answers** — guides you toward the solution
- 💾 **Remembers your project context** across conversations

## Supported Frameworks

### Hybrid 6-Phase Model
1. **Empathize** — Define the problem and understand user needs
2. **Conceive** — Generate ideas and explore possibilities
3. **Design** — Plan the solution in detail
4. **Implement** — Build the prototype or solution
5. **Test/Revise** — Validate and iterate
6. **Operate** — Deploy and maintain

### Barak 5-Phase Model (Optional)
1. **Problem Identification** — Understand the challenge
2. **Investigation & Research** — Gather information
3. **Planning & Design** — Create a blueprint
4. **Construction & Testing** — Build and test
5. **Evaluation & Reflection** — Assess and learn

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Prisma + SQLite
- **AI Integration:** OpenAI API (placeholder, to be added)
- **Knowledge Base:** Chroma vector store (placeholder, to be added)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone & install dependencies:**
   ```bash
   cd d:\engibuddy
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your OpenAI API key
   ```

3. **Initialize the database:**
   ```bash
   npm run db:push
   ```
   
   Or, if you want to create a migration:
   ```bash
   npm run db:migrate
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Management

- **View data in Prisma Studio:**
  ```bash
  npm run db:studio
  ```

- **Reset database (warning: deletes all data):**
  ```bash
  npm run db:reset
  ```

## Project Structure

```
engibuddy/
├── app/                    # Next.js App Router (pages & layouts)
├── components/             # Reusable React components
├── lib/
│   ├── ai/                # AI orchestration (phase-detector, chat logic)
│   ├── rag/               # RAG retriever & embeddings
│   ├── db/                # Database helpers & queries
│   ├── prompts/           # System prompts & prompt templates
│   ├── frameworks/        # PBL framework implementations
│   └── tools/             # Utility functions & helpers
├── types/                 # TypeScript type definitions
├── data/
│   └── knowledge/         # Knowledge base files (research, guides)
├── prisma/
│   └── schema.prisma      # Database schema
└── public/                # Static assets
```

## Key Modules (Coming Soon)

The following modules will be built in Prompt 2, Prompt 3, and Prompt 4:

### Prompt 2: Phase Detection & Framework Engine
- **`lib/ai/phase-detector.ts`** — Analyzes user input to detect current PBL phase
- **`lib/frameworks/hybrid-framework.ts`** — Implements 6-phase coaching logic
- **`lib/frameworks/barak-framework.ts`** — Implements 5-phase alternative model
- **`lib/ai/project-memory.ts`** — Maintains project context across sessions

### Prompt 3: Chat & Scaffolding
- **`lib/ai/chat-orchestrator.ts`** — Routes messages through phase detection & coaching
- **`lib/ai/coaching-strategies.ts`** — Different question patterns per framework
- **`lib/ai/artifact-generator.ts`** — Creates phase-specific templates & checklists

### Prompt 4: RAG & Knowledge Integration
- **`lib/rag/rag-retriever.ts`** — Retrieves relevant knowledge for student context
- **`lib/prompts/engibuddy-system-prompt.ts`** — Master system prompt with RAG context
- **`data/knowledge/`** — Research papers, guides, best practices (populated)

## Development Roadmap

| Prompt | Focus | Output |
|--------|-------|--------|
| **This (Foundation)** | Project setup, schema, folder structure | Runnable Next.js app with DB configured |
| **Prompt 2** | Framework logic & phase detection | Phase detector, project memory, framework engines |
| **Prompt 3** | Chat UI & coaching strategies | Chat interface, message handler, scaffolding |
| **Prompt 4** | RAG + OpenAI integration | Knowledge base, embeddings, full chat flow |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Sync Prisma schema to database |
| `npm run db:migrate` | Create and run a database migration |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset database (deletes all data) |

## Environment Variables

Create a `.env.local` file from `.env.example`:

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=sk_your_key_here
CHROMA_PATH="./data/chroma"
```

## Contributing

This is an MVP in active development. The architecture is designed to be extensible for:
- Multi-user support
- Custom frameworks
- Additional AI integrations
- Community knowledge bases

## License

MIT

---

**Questions?** Check the [docs](./docs) or open an issue.
