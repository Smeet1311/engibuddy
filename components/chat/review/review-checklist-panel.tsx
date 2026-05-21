'use client'

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ReviewAnalysis, ReviewStatus } from './review-types'

type ReviewChecklistPanelProps = {
  status: ReviewStatus | null
  analysis: ReviewAnalysis | null
  isLoading: boolean
  onToggleCriterion: (criterionId: string) => void
}

export function ReviewChecklistPanel({
  status,
  analysis,
  isLoading,
  onToggleCriterion,
}: ReviewChecklistPanelProps) {
  if (!status) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-900">
        Loading rubric checklist…
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50/80 to-white">
      <div className="border-b border-amber-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Review checklist</p>
        <p className="mt-1 text-sm font-medium text-slate-900">{status.phaseName} phase</p>
        <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            status.onTrack ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'
          }`}
        >
          {status.onTrack ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              On track
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5" />
              In progress · {status.missingCount} open
            </>
          )}
        </div>
      </div>

      <ul className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {status.criteria.map((item) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent px-2 py-2 hover:border-amber-100 hover:bg-white/80">
              <input
                type="checkbox"
                checked={item.completed}
                disabled={isLoading}
                onChange={() => onToggleCriterion(item.id)}
                className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-slate-800">{item.label}</span>
            </label>
            {analysis?.items
              .filter((row) => row.id === item.id)
              .map((row) => (
                <p
                  key={`${row.id}-fb`}
                  className={`ml-8 mt-0.5 text-xs ${row.met ? 'text-green-700' : 'text-amber-800'}`}
                >
                  {row.feedback}
                </p>
              ))}
          </li>
        ))}
      </ul>

      {analysis?.summary && (
        <div className="border-t border-amber-100 px-4 py-3">
          <p className="text-xs font-semibold text-amber-900">Upload review</p>
          <p className="mt-1 text-sm text-slate-700">{analysis.summary}</p>
        </div>
      )}
    </div>
  )
}
