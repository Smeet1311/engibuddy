'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChatShellBase } from '../shared/chat-shell-base'
import { ReviewChecklistPanel } from './review-checklist-panel'
import { ReviewDebtBanner } from './review-debt-banner'
import { ReviewGateDialog } from './review-gate-dialog'
import { ReviewUpload } from './review-upload'
import type { ReviewAnalysis, ReviewStatus } from './review-types'

const REVIEW_WELCOME =
  'Welcome to Review Mode. Upload your phase document or use the checklist on the right. I will help you see what is missing against the rubric — you can still move between phases freely.'

const PHASE_NAMES = ['Empathize', 'Conceive', 'Design', 'Implement', 'Test/Revise', 'Operate']
const PROJECT_ID = 'local-project'
const STORAGE_KEY = 'engibuddy-review-completed'

type CompletedByPhase = Record<number, string[]>

function loadCompleted(): CompletedByPhase {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as CompletedByPhase
  } catch {
    return {}
  }
}

function saveCompleted(data: CompletedByPhase) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function ReviewShell() {
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')
  const [completedByPhase, setCompletedByPhase] = useState<CompletedByPhase>({})
  const [activePhaseId, setActivePhaseId] = useState(0)
  const [status, setStatus] = useState<ReviewStatus | null>(null)
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)
  const [pendingPhaseId, setPendingPhaseId] = useState<number | null>(null)
  const [debts, setDebts] = useState<{ phaseId: number; phaseName: string; missingCount: number }[]>([])

  useEffect(() => {
    setCompletedByPhase(loadCompleted())
  }, [])

  const completedIds = completedByPhase[activePhaseId] ?? []

  const fetchStatus = useCallback(
    async (phaseId: number, ids: string[]) => {
      const params = new URLSearchParams({
        phase_id: String(phaseId),
        completed: ids.join(','),
      })
      const response = await fetch(`${apiBaseUrl}/review/status?${params}`)
      if (!response.ok) return
      const data = (await response.json()) as ReviewStatus
      setStatus(data)
    },
    [apiBaseUrl]
  )

  useEffect(() => {
    void fetchStatus(activePhaseId, completedIds)
  }, [activePhaseId, completedIds, fetchStatus])

  useEffect(() => {
    let cancelled = false
    const loadDebts = async () => {
      const items: { phaseId: number; phaseName: string; missingCount: number }[] = []
      for (let id = 0; id < PHASE_NAMES.length; id += 1) {
        if (id === activePhaseId) continue
        const params = new URLSearchParams({
          phase_id: String(id),
          completed: (completedByPhase[id] ?? []).join(','),
        })
        const response = await fetch(`${apiBaseUrl}/review/status?${params}`)
        if (!response.ok) continue
        const data = (await response.json()) as ReviewStatus
        if (data.missingCount > 0) {
          items.push({ phaseId: data.phaseId, phaseName: data.phaseName, missingCount: data.missingCount })
        }
      }
      if (!cancelled) setDebts(items)
    }
    void loadDebts()
    return () => {
      cancelled = true
    }
  }, [activePhaseId, apiBaseUrl, completedByPhase])

  const persistCompleted = useCallback((phaseId: number, ids: string[]) => {
    setCompletedByPhase((prev) => {
      const next = { ...prev, [phaseId]: ids }
      saveCompleted(next)
      return next
    })
  }, [])

  const handleToggleCriterion = useCallback(
    (criterionId: string) => {
      const set = new Set(completedIds)
      if (set.has(criterionId)) set.delete(criterionId)
      else set.add(criterionId)
      persistCompleted(activePhaseId, Array.from(set))
    },
    [activePhaseId, completedIds, persistCompleted]
  )

  const handleAnalyze = useCallback(
    async (file: File, content: string) => {
      setIsAnalyzing(true)
      try {
        const response = await fetch(`${apiBaseUrl}/review/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: PROJECT_ID,
            phaseId: activePhaseId,
            title: file.name,
            content,
            saveArtifact: true,
          }),
        })
        if (!response.ok) {
          throw new Error('Analysis failed. Is the backend running?')
        }
        const data = await response.json()
        setAnalysis(data.analysis as ReviewAnalysis)
        setStatus(data.status as ReviewStatus)
        const metIds = (data.analysis?.items ?? [])
          .filter((item: { met: boolean }) => item.met)
          .map((item: { id: string }) => item.id)
        if (metIds.length) {
          persistCompleted(activePhaseId, Array.from(new Set([...completedIds, ...metIds])))
        }
      } finally {
        setIsAnalyzing(false)
      }
    },
    [activePhaseId, apiBaseUrl, completedIds, persistCompleted]
  )

  const applyPhaseChange = useCallback((phaseId: number) => {
    setActivePhaseId(phaseId)
    setAnalysis(null)
    setGateOpen(false)
    setPendingPhaseId(null)
  }, [])

  const handlePhaseChangeAttempt = useCallback(
    (targetPhaseId: number, currentPhaseId: number) => {
      if (targetPhaseId === currentPhaseId) return true
      const missing = status?.missing ?? []
      if (missing.length > 0) {
        setPendingPhaseId(targetPhaseId)
        setGateOpen(true)
        return false
      }
      applyPhaseChange(targetPhaseId)
      return true
    },
    [applyPhaseChange, status?.missing]
  )

  const sidePanel = (
    <div className="flex h-full flex-col gap-4">
      <ReviewUpload isAnalyzing={isAnalyzing} onAnalyze={handleAnalyze} />
      <div className="min-h-[280px] flex-1">
        <ReviewChecklistPanel
          status={status}
          analysis={analysis}
          isLoading={isAnalyzing}
          onToggleCriterion={handleToggleCriterion}
        />
      </div>
    </div>
  )

  return (
    <>
      <ChatShellBase
        mode="review"
        welcomeMessage={REVIEW_WELCOME}
        sidePanel={sidePanel}
        activePhaseId={activePhaseId}
        onActivePhaseIdChange={setActivePhaseId}
        topBanner={<ReviewDebtBanner debts={debts} onGoToPhase={applyPhaseChange} />}
        enablePhaseNavigation
        freePhaseNavigation
        onPhaseChangeAttempt={handlePhaseChangeAttempt}
        inputPlaceholder="Ask about rubric items or your upload…"
      />
      <ReviewGateDialog
        open={gateOpen}
        missingLabels={(status?.missing ?? []).map((item) => item.label)}
        targetPhaseName={PHASE_NAMES[pendingPhaseId ?? activePhaseId] ?? 'next phase'}
        onStay={() => {
          setGateOpen(false)
          setPendingPhaseId(null)
        }}
        onProceed={() => {
          if (pendingPhaseId !== null) {
            applyPhaseChange(pendingPhaseId)
          }
        }}
      />
    </>
  )
}
