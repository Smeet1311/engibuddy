'use client'

import type { ReactNode } from 'react'
import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  FileText,
  HelpCircle,
  RefreshCw,
  Target,
  Trash2,
} from 'lucide-react'

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

type PhaseProgressItem = {
  id: number
  name: string
  active: boolean
  visited: boolean
  completed: boolean
}

export type ReviewArtifact = {
  id: number
  artifact_type: string
  title: string
  phase_id: number | null
  content: string
  relevance?: 'unknown' | 'relevant' | 'not_relevant'
  created_at?: string
  updated_at?: string
}

interface ReviewChecklistProps {
  reviewProgress: ReviewProgress | null
  phases?: PhaseProgressItem[]
  artifacts?: ReviewArtifact[]
  layout?: 'wide' | 'column'
  isValidating?: boolean
  onAskAboutPoint?: (phase: ReviewPhase, point: ReviewPoint) => void
  onHelpWithPoint?: (phase: ReviewPhase, point: ReviewPoint) => void
  onRerunValidation?: () => void
  onDeleteArtifact?: (artifactId: number) => void
}

const RELEVANCE_LABELS = {
  unknown: 'Unknown',
  relevant: 'Relevant',
  not_relevant: 'Not relevant',
}

export function ReviewChecklist({
  reviewProgress,
  phases = [],
  artifacts = [],
  layout = 'wide',
  isValidating = false,
  onAskAboutPoint,
  onHelpWithPoint,
  onRerunValidation,
  onDeleteArtifact,
}: ReviewChecklistProps) {
  const isColumn = layout === 'column'

  if (!reviewProgress) {
    return (
      <section className={isColumn ? 'h-full overflow-y-auto bg-slate-50 px-5 py-5' : 'border-b border-gray-200 bg-slate-50 px-8 py-5'}>
        <p className="text-sm text-slate-500">No review progress yet. Start a Guidance chat to begin.</p>
      </section>
    )
  }

  const activePhaseId =
    phases.find((phase) => phase.active)?.id ??
    reviewProgress.phases.find((phase) => !phase.completed)?.id ??
    reviewProgress.phases[reviewProgress.phases.length - 1]?.id ??
    0
  const activePhase = reviewProgress.phases.find((phase) => phase.id === activePhaseId) ?? reviewProgress.phases[0]
  const activeMissingPoints = activePhase?.points.filter((point) => !point.completed) ?? []
  const status = getPhaseStatus(activePhase, phases)
  const confidence = getConfidence(activePhase)
  const overviewPhases = reviewProgress.phases.filter(
    (phase) => phase.id === activePhase?.id || (phase.id < (activePhase?.id ?? 0) && phase.completed)
  )

  return (
    <section className={isColumn ? 'h-full overflow-y-auto bg-slate-50 px-5 py-5' : 'max-h-[44vh] overflow-y-auto border-b border-gray-200 bg-slate-50 px-8 py-5'}>
      <div className={`mb-4 flex gap-4 ${isColumn ? 'flex-col' : 'items-center justify-between'}`}>
        <div className="flex items-center gap-2 text-slate-800">
          <ClipboardCheck className="h-4 w-4" />
          <h2 className="text-sm font-semibold">Review Control Panel</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold text-slate-600">
            {reviewProgress.summary.completedPoints}/{reviewProgress.summary.totalPoints} completed ({reviewProgress.summary.percent}%)
          </p>
          {onRerunValidation && (
            <button
              type="button"
              onClick={onRerunValidation}
              disabled={isValidating}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? 'animate-spin' : ''}`} />
              Re-run
            </button>
          )}
        </div>
      </div>

      <div className={`grid gap-3 ${isColumn ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
        <PanelBlock title="Phase Status" icon={<Target className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Metric label="Status" value={status} tone={status === 'Complete' ? 'green' : status === 'Blocked' ? 'red' : 'blue'} />
            <Metric label="Confidence" value={confidence} tone={confidence === 'High' ? 'green' : confidence === 'Weak' ? 'amber' : 'blue'} />
            <Metric label="Completion" value={`${activePhase?.completedCount ?? 0}/${activePhase?.totalCount ?? 0}`} />
            <Metric label="Last updated" value="Latest validation" />
          </div>
        </PanelBlock>

        <PanelBlock title="Evidence Map" icon={<CheckCircle2 className="h-4 w-4" />}>
          <EvidenceMap phase={activePhase} onAskAboutPoint={onAskAboutPoint} />
        </PanelBlock>
      </div>

      <PanelBlock title="All Phase Important Points" icon={<Target className="h-4 w-4" />} className="mt-3">
        {overviewPhases.length === 0 ? (
          <p className="text-xs leading-5 text-slate-500">No completed previous phases are available yet.</p>
        ) : (
          <div className="space-y-2">
            {overviewPhases.map((phase) => {
            const importantPoints = getImportantPhasePoints(phase)
            return (
              <div key={phase.id} className="rounded-md border border-slate-200 bg-white px-3 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-slate-900">
                    {phase.id}. {phase.name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      phase.completed
                        ? 'bg-emerald-100 text-emerald-700'
                        : phase.completedCount > 0
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {phase.completedCount}/{phase.totalCount}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {importantPoints.map((point) => (
                    <div key={point.id} className="flex items-start gap-2">
                      {point.completed ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      )}
                      <div className="min-w-0">
                        <p className={`text-xs leading-5 ${point.completed ? 'text-slate-700' : 'text-slate-500'}`}>
                          {point.label}
                        </p>
                        {point.evidence && <p className="line-clamp-2 text-[11px] leading-4 text-slate-500">{point.evidence}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
            })}
          </div>
        )}
      </PanelBlock>

      <PanelBlock title="Actionable Missing Items" icon={<ClipboardCheck className="h-4 w-4" />} className="mt-3">
        {activeMissingPoints.length === 0 ? (
          <p className="text-xs leading-5 text-slate-500">No missing checklist items for the active phase.</p>
        ) : (
          <div className="space-y-2">
            {activeMissingPoints.map((point) => (
              <div key={point.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                <p className="min-w-0 text-xs leading-5 text-slate-700">{point.label}</p>
                <div className="flex shrink-0 items-center gap-1.5">
                  {onHelpWithPoint && (
                    <button
                      type="button"
                      onClick={() => onHelpWithPoint(activePhase, point)}
                      className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Help
                    </button>
                  )}
                  {onAskAboutPoint && (
                    <button
                      type="button"
                      onClick={() => onAskAboutPoint(activePhase, point)}
                      className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      Ask
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelBlock>

      <PanelBlock title="Added Review Documents" icon={<FileText className="h-4 w-4" />} className="mt-3">
        <AddedDocumentsWindow artifacts={artifacts} onDeleteArtifact={onDeleteArtifact} />
      </PanelBlock>
    </section>
  )
}

function EvidenceMap({
  phase,
  onAskAboutPoint,
}: {
  phase: ReviewPhase | undefined
  onAskAboutPoint?: (phase: ReviewPhase, point: ReviewPoint) => void
}) {
  if (!phase) {
    return <p className="text-xs leading-5 text-slate-500">No active phase evidence is available.</p>
  }

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
      {phase.points.map((point) => {
        const source = getEvidenceSource(point)
        const strength = getEvidenceStrength(point)
        return (
          <div key={point.id} className="rounded-md border border-slate-200 bg-white px-3 py-2">
            <div className="flex items-start gap-2">
              {point.completed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-xs font-semibold leading-5 text-slate-800">{point.label}</p>
                  <EvidenceBadge label={strength} />
                </div>
                <p className="text-[11px] leading-5 text-slate-500">Source: {source}</p>
                {point.evidence && <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{point.evidence}</p>}
              </div>
              {onAskAboutPoint && (
                <button
                  type="button"
                  onClick={() => onAskAboutPoint(phase, point)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                  title="Ask Review Chat"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AddedDocumentsWindow({
  artifacts,
  onDeleteArtifact,
}: {
  artifacts: ReviewArtifact[]
  onDeleteArtifact?: (artifactId: number) => void
}) {
  const reviewDocuments = artifacts.filter((artifact) => artifact.artifact_type === 'review_document')

  if (reviewDocuments.length === 0) {
    return <p className="text-xs leading-5 text-slate-500">No documents added yet. Use "Add Documents" above.</p>
  }

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
      {reviewDocuments.map((artifact) => (
        <div key={artifact.id} className="rounded-md border border-slate-200 bg-white px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">{artifact.title}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {artifact.phase_id === null ? 'Auto-detected' : `Phase ${artifact.phase_id}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                {artifact.relevance ? RELEVANCE_LABELS[artifact.relevance] : 'Unknown'}
              </span>
              {onDeleteArtifact && (
                <button
                  type="button"
                  onClick={() => onDeleteArtifact(artifact.id)}
                  title="Remove document and undo its criteria"
                  className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{artifact.content}</p>
        </div>
      ))}
    </div>
  )
}

function PanelBlock({
  title,
  icon,
  className = '',
  children,
}: {
  title: string
  icon: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={`rounded-md border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center gap-2 text-slate-800">
        {icon}
        <h3 className="text-xs font-semibold uppercase tracking-normal text-slate-600">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'slate' | 'blue' | 'green' | 'amber' | 'red' }) {
  const toneClass = {
    slate: 'bg-slate-50 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  }[tone]

  return (
    <div className={`rounded-md px-3 py-2 ${toneClass}`}>
      <p className="text-[11px] font-medium opacity-80">{label}</p>
      <p className="mt-1 text-xs font-semibold">{value}</p>
    </div>
  )
}

function EvidenceBadge({ label }: { label: 'Strong' | 'Partial' | 'Missing' }) {
  const className =
    label === 'Strong'
      ? 'bg-emerald-100 text-emerald-700'
      : label === 'Partial'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-amber-100 text-amber-700'

  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}>{label}</span>
}

function getPhaseStatus(phase: ReviewPhase | undefined, phaseProgress: PhaseProgressItem[]) {
  if (!phase) return 'Not started'
  const phaseState = phaseProgress.find((item) => item.id === phase.id)
  if (phase.completed) return 'Complete'
  if (phase.completedCount > 0) return 'In progress'
  if (phaseState?.active && phase.totalCount > 0) return 'Blocked'
  if (phaseState?.visited || phaseState?.active) return 'Ready for review'
  return 'Not started'
}

function getConfidence(phase: ReviewPhase | undefined) {
  if (!phase || phase.totalCount === 0) return 'Weak'
  const evidenceCount = phase.points.filter((point) => point.evidence.trim()).length
  if (phase.completed && evidenceCount === phase.totalCount) return 'High'
  if (evidenceCount > 0 || phase.completedCount > 0) return 'Partial'
  return 'Weak'
}

function getEvidenceSource(point: ReviewPoint) {
  const evidence = point.evidence.toLowerCase()
  if (!point.evidence.trim()) return 'Missing'
  if (evidence.includes('artifact') || evidence.includes('document') || evidence.includes('uploaded') || evidence.includes('file')) {
    return 'Uploaded document'
  }
  if (evidence.includes('note')) return 'Review note'
  return 'Guidance discussion'
}

function getEvidenceStrength(point: ReviewPoint): 'Strong' | 'Partial' | 'Missing' {
  if (point.completed && point.evidence.trim().length > 20) return 'Strong'
  if (point.evidence.trim()) return 'Partial'
  return 'Missing'
}

function getImportantPhasePoints(phase: ReviewPhase) {
  const completedWithEvidence = phase.points.filter((point) => point.completed && point.evidence.trim())
  const missing = phase.points.filter((point) => !point.completed)
  const completedWithoutEvidence = phase.points.filter((point) => point.completed && !point.evidence.trim())
  const selected = [...completedWithEvidence, ...missing, ...completedWithoutEvidence]

  return selected.slice(0, 3)
}
