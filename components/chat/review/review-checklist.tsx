'use client'

import { CheckCircle2, Circle, ClipboardCheck } from 'lucide-react'

type ReviewPoint = {
  id: string
  label: string
  completed: boolean
  evidence: string
}

type ReviewPhase = {
  id: number
  name: string
  points: ReviewPoint[]
  completed: boolean
  completedCount: number
  totalCount: number
}

type ReviewSummary = {
  completedPoints: number
  totalPoints: number
  percent: number
}

type ReviewProgress = {
  phases: ReviewPhase[]
  summary: ReviewSummary
}

interface ReviewChecklistProps {
  reviewProgress: ReviewProgress | null
}

export function ReviewChecklist({ reviewProgress }: ReviewChecklistProps) {
  if (!reviewProgress) {
    return (
      <section className="border-b border-gray-200 bg-slate-50 px-8 py-5">
        <p className="text-sm text-slate-500">Review checklist is loading...</p>
      </section>
    )
  }

  return (
    <section className="border-b border-gray-200 bg-slate-50 px-8 py-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-800">
          <ClipboardCheck className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Review Checklist (Empathize to Operate)</h2>
        </div>
        <p className="text-xs font-semibold text-slate-600">
          {reviewProgress.summary.completedPoints}/{reviewProgress.summary.totalPoints} completed ({reviewProgress.summary.percent}%)
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reviewProgress.phases.map((phase) => (
          <div key={phase.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {phase.id}. {phase.name}
              </h3>
              <span
                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                  phase.completed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {phase.completedCount}/{phase.totalCount}
              </span>
            </div>

            <ul className="space-y-2">
              {phase.points.map((point) => (
                <li key={point.id} className="flex items-start gap-2">
                  <span className="mt-0.5" aria-hidden="true">
                    {point.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-400" />
                    )}
                  </span>
                  <span className={`text-xs leading-5 ${point.completed ? 'text-slate-700' : 'text-slate-500'}`}>
                    {point.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
