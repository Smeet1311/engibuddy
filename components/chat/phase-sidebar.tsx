'use client'

type PhaseItem = {
  id: number
  name: string
  active: boolean
  visited: boolean
  completed: boolean
}

interface PhaseSidebarProps {
  phases: PhaseItem[]
}

function PhaseStatusIcon({ phase }: { phase: PhaseItem }) {
  if (phase.active) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-300 bg-blue-500/20">
        <span className="h-2 w-2 rounded-full bg-blue-300" />
      </span>
    )
  }

  if (phase.completed) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-slate-950">
        ✓
      </span>
    )
  }

  if (phase.visited) {
    return <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
  }

  return <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
}

export function PhaseSidebar({ phases }: PhaseSidebarProps) {
  return (
    <aside className="w-72 border-r border-slate-800 bg-slate-900/80 p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Project Phases</h2>
        <p className="mt-1 text-xs text-slate-500">Auto-detected from each question</p>
      </div>

      <nav className="space-y-2">
        {phases.map((phase) => (
          <div
            key={phase.id}
            className={`flex items-center gap-3 rounded-md border px-3 py-2 transition ${
              phase.active
                ? 'border-blue-500/60 bg-blue-500/10'
                : 'border-slate-800 bg-slate-900'
            }`}
          >
            <PhaseStatusIcon phase={phase} />
            <div className="min-w-0">
              <p className={`text-sm ${phase.active ? 'text-blue-200' : 'text-slate-300'}`}>
                {phase.id}. {phase.name}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                {phase.active ? 'Current phase' : phase.completed ? 'Completed' : phase.visited ? 'Visited' : 'Not started'}
              </p>
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
