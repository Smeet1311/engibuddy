'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import Link from 'next/link'
import { FileUp, MessageCircle, RotateCw, Sparkles, SquarePen, Trash2 } from 'lucide-react'
import { ChatHistory } from '../chat-history'
import { ChatInput } from '../chat-input'
import { ChatWindow } from '../chat-window'
import { PhaseStepper } from '../phase-stepper'
import { RagBar } from '../rag-bar'
import { ReviewChecklist } from '../review/review-checklist'
import type { ReviewArtifact } from '../review/review-checklist'
import { useChatContext } from '@/app/chat-provider'
import type { ChatMessage, ReviewPhase, ReviewPoint, ReviewProgress } from '@/app/chat-provider'

// Re-export so existing imports from this file keep working
export type ChatMessageType = ChatMessage

type PhaseProgressItem = {
  id: number
  name: string
  active: boolean
  visited: boolean
  completed: boolean
}

type Classification = {
  phase: number
  phase_name: string
  confidence: number
  transition?: 'stay' | 'advance' | 'retreat'
  reason?: string
}

type SessionStatePayload = {
  phaseProgress?: { phases?: PhaseProgressItem[] }
  reviewProgress?: ReviewProgress
}

// ReviewPoint, ReviewPhase, ReviewProgress are imported from @/app/chat-provider

const DEFAULT_PHASES: PhaseProgressItem[] = [
  { id: 0, name: 'Empathize', active: true, visited: true, completed: false },
  { id: 1, name: 'Conceive', active: false, visited: false, completed: false },
  { id: 2, name: 'Design', active: false, visited: false, completed: false },
  { id: 3, name: 'Implement', active: false, visited: false, completed: false },
  { id: 4, name: 'Test/Revise', active: false, visited: false, completed: false },
  { id: 5, name: 'Operate', active: false, visited: false, completed: false },
]

function currentTimestamp() {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m} ${ampm}`
}

type ChatShellBaseProps = {
  mode?: 'guidance' | 'review'
}

export function ChatShellBase({ mode = 'guidance' }: ChatShellBaseProps) {
  const projectId = 'local-project'
  const [sessionId, setSessionId] = useState<string>(() => {
    // For guidance mode, restore the last active session from localStorage so a page
    // refresh lands on the correct session immediately (no flash to a random new one).
    if (typeof window !== 'undefined' && mode === 'guidance') {
      const stored = localStorage.getItem('engibuddy.activeGuidanceSessionId')
      if (stored) return stored
    }
    return `session-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
  })
  const [reviewSourceSessionId, setReviewSourceSessionId] = useState<string | null>(null)
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')
  const isGuidanceMode = mode === 'guidance'
  const welcomeMessage = isGuidanceMode
    ? 'Welcome to EngiBuddy. Tell me what you are building and I will help step-by-step.'
    : 'Review Mode is ready. Ask what is complete, what is missing, or how to finish the current phase.'

  // Messages and loading state live in a context above the route so that a
  // stream that is still in flight survives navigation between modes.
  const chatCtx = useChatContext()
  const messages        = isGuidanceMode ? chatCtx.guidance.messages        : chatCtx.review.messages
  const isLoading       = isGuidanceMode ? chatCtx.guidance.isLoading       : chatCtx.review.isLoading
  const showTypingIndicator = isGuidanceMode ? chatCtx.guidance.showTypingIndicator : chatCtx.review.showTypingIndicator
  const setMessages     = isGuidanceMode ? chatCtx.setGuidanceMessages     : chatCtx.setReviewMessages
  const setIsLoading    = isGuidanceMode ? chatCtx.setGuidanceLoading      : chatCtx.setReviewLoading
  const setShowTypingIndicator = isGuidanceMode ? chatCtx.setGuidanceTyping : chatCtx.setReviewTyping
  const [phases, setPhases] = useState<PhaseProgressItem[]>(DEFAULT_PHASES)
  const [classification, setClassification] = useState<Classification | null>(null)
  const [ragSources, setRagSources] = useState<string[]>([])
  const [ragProvider, setRagProvider] = useState('')
  const [ragPreview, setRagPreview] = useState('')
  const [showRagDebug, setShowRagDebug] = useState(false)
  const [showDebugBar, setShowDebugBar] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('engibuddy.showDebugBar') === 'true'
    }
    return false
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        setShowDebugBar((prev) => {
          const next = !prev
          localStorage.setItem('engibuddy.showDebugBar', String(next))
          return next
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [promptVersion, setPromptVersion] = useState<string | null>(null)
  // reviewProgress lives in context so it survives Guidance ↔ Review navigation.
  const reviewProgress = chatCtx.reviewProgress
  const setReviewProgress = chatCtx.setReviewProgress
  const [reviewArtifacts, setReviewArtifacts] = useState<ReviewArtifact[]>([])
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false)
  const [isValidatingReview, setIsValidatingReview] = useState(false)
  const activePhase = phases.find((phase) => phase.active) ?? phases[0]

  const refreshReviewArtifacts = useCallback(async () => {
    const response = await fetch(`${apiBaseUrl}/projects/${encodeURIComponent(projectId)}/artifacts`)
    if (!response.ok) return
    const data = await response.json()
    setReviewArtifacts(Array.isArray(data?.artifacts) ? data.artifacts : [])
  }, [apiBaseUrl, projectId])

  useEffect(() => {
    if (isGuidanceMode) {
      const bootstrapGuidanceState = async () => {
        try {
          const sessionsResponse = await fetch(`${apiBaseUrl}/sessions?project_id=${encodeURIComponent(projectId)}`)
          if (!sessionsResponse.ok) return
          const sessionsData = await sessionsResponse.json()
          const sessions = Array.isArray(sessionsData?.sessions) ? sessionsData.sessions : []
          if (sessions.length === 0) return

          const storedSessionId = localStorage.getItem('engibuddy.activeGuidanceSessionId')
          const latestSessionId = (storedSessionId ?? sessions[0].sessionId) as string
          if (!latestSessionId) return

          localStorage.setItem('engibuddy.activeGuidanceSessionId', latestSessionId)
          setSessionId(latestSessionId)

          // Always refresh phases from DB — they are local state that resets on remount.
          const stateResponse = await fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(latestSessionId)}/state`)
          if (stateResponse.ok) {
            const stateData = await stateResponse.json()
            if (stateData?.phaseProgress?.phases && Array.isArray(stateData.phaseProgress.phases)) {
              setPhases(stateData.phaseProgress.phases)
            }
          }

          // Only load messages from DB when the context doesn't already have live ones
          // (avoids overwriting a still-running stream when the user navigates back).
          if (messages.length <= 1) {
            const messagesResponse = await fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(latestSessionId)}/messages`)
            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json()
              const restoredMessages = mapMessages(latestSessionId, messagesData?.messages)
              if (restoredMessages.length > 0) {
                setMessages(restoredMessages)
              }
            }
          }
        } catch (error) {
          console.error('Error bootstrapping guidance mode state:', error)
        }
      }
      void bootstrapGuidanceState()
      return
    }

    const bootstrapReviewState = async () => {
      try {
        await refreshReviewArtifacts()
        const sessionsResponse = await fetch(`${apiBaseUrl}/sessions?project_id=${encodeURIComponent(projectId)}`)
        if (!sessionsResponse.ok) {
          throw new Error(`Backend returned ${sessionsResponse.status}`)
        }

        const sessionsData = await sessionsResponse.json()
        const sessions = Array.isArray(sessionsData?.sessions) ? sessionsData.sessions : []

        // Prefer whatever session is currently active in Guidance Mode (stored in
        // localStorage) so both modes stay in sync when the user switches between them.
        const storedGuidanceId = localStorage.getItem('engibuddy.activeGuidanceSessionId')
        const storedIsActive = storedGuidanceId
          ? sessions.some((s: { sessionId: string }) => s.sessionId === storedGuidanceId)
          : false

        if (sessions.length === 0 || (storedGuidanceId && !storedIsActive)) {
          // Active guidance session is brand-new (no messages yet) or no sessions exist.
          // Fetch the real structure from the backend — build_review_progress({}) returns
          // all 24 criteria as unchecked even for a fresh session, giving a proper 0/24
          // dashboard instead of an empty 0/0 placeholder.
          const emptySourceId = storedGuidanceId ?? ''
          if (emptySourceId) {
            setReviewSourceSessionId(emptySourceId)
            setSessionId(reviewSessionIdFor(emptySourceId))
            try {
              const freshResp = await fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(emptySourceId)}/state`)
              if (freshResp.ok) {
                const freshData = await freshResp.json()
                if (freshData?.phaseProgress?.phases && Array.isArray(freshData.phaseProgress.phases)) {
                  setPhases(freshData.phaseProgress.phases)
                }
                setReviewProgress(freshData?.reviewProgress ?? null)
                return
              }
            } catch {
              // fall through to safe defaults below
            }
          }
          setPhases(DEFAULT_PHASES)
          setReviewProgress(null)
          return
        }

        // Use the stored active session if it exists in the list, otherwise fall back
        // to the most recent session that has messages.
        const latestSessionId = (storedIsActive ? storedGuidanceId : sessions[0].sessionId) as string
        if (!latestSessionId) return

        // Always re-hydrate reviewSourceSessionId, sessionId, phases and reviewProgress
        // because they are local state that resets on every route remount.
        const stateResponse = await fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(latestSessionId)}/state`)
        if (!stateResponse.ok) {
          throw new Error(`Backend returned ${stateResponse.status}`)
        }

        const stateData = await stateResponse.json()
        const reviewSessionId = reviewSessionIdFor(latestSessionId)
        setReviewSourceSessionId(latestSessionId)
        setSessionId(reviewSessionId)

        if (stateData?.phaseProgress?.phases && Array.isArray(stateData.phaseProgress.phases)) {
          setPhases(stateData.phaseProgress.phases)
        }
        if (stateData?.reviewProgress) {
          setReviewProgress(stateData.reviewProgress)
        }

        // Only load review chat messages when the context doesn't already have live ones
        // (avoids overwriting a still-running stream when the user navigates back).
        if (messages.length <= 1) {
          const messagesResponse = await fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(reviewSessionId)}/messages`)
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json()
            const restoredMessages = mapMessages(reviewSessionId, messagesData?.messages)
            setMessages(restoredMessages.length > 0 ? restoredMessages : buildWelcomeMessages(welcomeMessage))
          }
        }
      } catch (error) {
        console.error('Error bootstrapping review mode state:', error)
      }
    }

    void bootstrapReviewState()
  }, [apiBaseUrl, isGuidanceMode, projectId, refreshReviewArtifacts, welcomeMessage])

  const resetWelcomeMessage = useCallback(() => {
    setMessages(buildWelcomeMessages(welcomeMessage))
  }, [welcomeMessage])

  const handleNewChat = useCallback(
    (newSessionId: string) => {
      // Always write to localStorage so whichever mode the user navigates to next
      // bootstraps on the correct session.
      localStorage.setItem('engibuddy.activeGuidanceSessionId', newSessionId)
      if (isGuidanceMode) {
        setSessionId(newSessionId)
      } else {
        setReviewSourceSessionId(newSessionId)
        setSessionId(reviewSessionIdFor(newSessionId))
      }
      // Reset UI to Phase 0 immediately so the stepper doesn't show the old session's phase.
      setPhases(DEFAULT_PHASES)
      // Clear review progress — the background fetch below replaces it with the full
      // criteria structure (all items unchecked) within ~100 ms.
      setReviewProgress(null)
      // Reset BOTH modes' messages so whichever mode the user opens next also shows
      // a fresh chat, not the previous session's conversation.
      chatCtx.setGuidanceMessages(buildWelcomeMessages('Welcome to EngiBuddy. Tell me what you are building and I will help step-by-step.'))
      chatCtx.setReviewMessages(buildWelcomeMessages('Review Mode is ready. Ask what is complete, what is missing, or how to finish the current phase.'))
      setHistoryRefreshKey((value) => value + 1)
      // Hydrate with the full criteria structure (all items unchecked) from the DB.
      void fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(newSessionId)}/state`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { reviewProgress?: ReviewProgress; phaseProgress?: { phases?: PhaseProgressItem[] } } | null) => {
          if (!data) return
          if (data.reviewProgress) setReviewProgress(data.reviewProgress)
          if (Array.isArray(data.phaseProgress?.phases)) setPhases(data.phaseProgress.phases)
        })
        .catch(() => {})
    },
    [apiBaseUrl, isGuidanceMode, resetWelcomeMessage]
  )

  const handleSelectSession = useCallback(
    (selectedSessionId: string, sessionMessages: ChatMessageType[], sessionState?: SessionStatePayload) => {
      const nextSessionId = isGuidanceMode ? selectedSessionId : reviewSessionIdFor(selectedSessionId)
      setSessionId(nextSessionId)
      // Always write to localStorage so whichever mode the user navigates to next
      // bootstraps on the correct session.
      localStorage.setItem('engibuddy.activeGuidanceSessionId', selectedSessionId)
      if (!isGuidanceMode) {
        setReviewSourceSessionId(selectedSessionId)
      }

      if (isGuidanceMode) {
        if (sessionMessages.length === 0) {
          resetWelcomeMessage()
        } else {
          setMessages(sessionMessages)
        }
      } else {
        void fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(nextSessionId)}/messages`)
          .then((response) => (response.ok ? response.json() : undefined))
          .then((data) => {
            const restoredMessages = mapMessages(nextSessionId, data?.messages)
            setMessages(restoredMessages.length > 0 ? restoredMessages : buildWelcomeMessages(welcomeMessage))
          })
          .catch(() => setMessages(buildWelcomeMessages(welcomeMessage)))
      }
      const restoredPhases = sessionState?.phaseProgress?.phases
      if (Array.isArray(restoredPhases) && restoredPhases.length === DEFAULT_PHASES.length) {
        setPhases(restoredPhases)
      }
      setReviewProgress(sessionState?.reviewProgress ?? null)
      setClassification((prev) => prev ?? { phase: 0, phase_name: 'Empathize', confidence: 0, transition: 'stay', reason: 'Session restored from saved phase state.' })
      setHistoryRefreshKey((value) => value + 1)
    },
    [apiBaseUrl, isGuidanceMode, resetWelcomeMessage, welcomeMessage]
  )

  const handleSendMessage = useCallback(
    async (message: string) => {
      const userMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: currentTimestamp(),
      }

      const nextHistory = [...messages, userMessage]
      setMessages(nextHistory)
      setIsLoading(true)

      const assistantId = `assistant-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: currentTimestamp() },
      ])
      setShowTypingIndicator(true)

      try {
        const response = await fetch(`${apiBaseUrl}/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            sessionId,
            userMessage: message,
            conversationHistory: nextHistory,
            mode,
            reviewSourceSessionId: isGuidanceMode ? undefined : reviewSourceSessionId,
          }),
        })

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`)
        }

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw) continue
            try {
              const event = JSON.parse(raw)

              if (event.type === 'meta') {
                if (Array.isArray(event.phaseProgress?.phases)) setPhases(event.phaseProgress.phases)
                if (event.reviewProgress) setReviewProgress(event.reviewProgress)
                if (event.classification) setClassification(event.classification)
                setRagSources(Array.isArray(event.ragSources) ? event.ragSources : [])
                setRagProvider(typeof event.ragRetrievalMode === 'string' ? event.ragRetrievalMode : '')
                setRagPreview(typeof event.ragPreview === 'string' ? event.ragPreview : '')
                if (typeof event.promptVersion === 'string') setPromptVersion(event.promptVersion)
              } else if (event.type === 'token') {
                setShowTypingIndicator(false)
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + event.token } : m))
                )
              } else if (event.type === 'done') {
                const doneSessionId = typeof event.sessionId === 'string' && event.sessionId.trim() ? event.sessionId : undefined
                if (doneSessionId) setSessionId(doneSessionId)
                if (event.reviewProgress) setReviewProgress(event.reviewProgress)
                if (Array.isArray(event.phaseProgress?.phases)) setPhases(event.phaseProgress.phases)
                setHistoryRefreshKey((v) => v + 1)
                if (isGuidanceMode && doneSessionId) {
                  setTimeout(() => {
                    void fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(doneSessionId)}/state`)
                      .then((r) => (r.ok ? r.json() : null))
                      .then((data) => {
                        if (data && Array.isArray(data.phaseProgress?.phases)) setPhases(data.phaseProgress.phases)
                      })
                      .catch(() => {})
                  }, 2500)
                }
              } else if (event.type === 'error') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: event.message || 'Error generating response.', status: 'error' as const }
                      : m
                  )
                )
              }
            } catch {
              // malformed SSE line — skip
            }
          }
        }
      } catch (error) {
        console.error('Error sending message:', error)
        setRagSources([])
        setRagProvider('')
        setRagPreview('')
        setShowRagDebug(false)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'Backend error — check your API settings or try again.', status: 'error' as const }
              : m
          )
        )
      } finally {
        setIsLoading(false)
        setShowTypingIndicator(false)
      }
    },
    [apiBaseUrl, isGuidanceMode, messages, mode, projectId, reviewSourceSessionId, sessionId]
  )

  const handleDefineCriteriaWithRag = useCallback(() => {
    const phaseName = activePhase?.name ?? 'current phase'
    void handleSendMessage(
      `Use the RAG knowledge base and my project evidence to help me define measurable success criteria for Phase ${activePhase?.id ?? 1}: ${phaseName}. Show concrete pass/fail thresholds and tell me what evidence I need for Review validation.`
    )
  }, [activePhase, handleSendMessage])

  const refreshReviewState = useCallback(async () => {
    const sourceSessionId = reviewSourceSessionId ?? sessionId
    const stateResponse = await fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(sourceSessionId)}/state`)
    if (!stateResponse.ok) return
    const stateData = await stateResponse.json()
    if (stateData?.phaseProgress?.phases && Array.isArray(stateData.phaseProgress.phases)) {
      setPhases(stateData.phaseProgress.phases)
    }
    if (stateData?.reviewProgress) {
      setReviewProgress(stateData.reviewProgress)
    }
  }, [apiBaseUrl, reviewSourceSessionId, sessionId])

  const rerunReviewValidation = useCallback(async () => {
    const sourceSessionId = reviewSourceSessionId ?? sessionId
    setIsValidatingReview(true)

    // Fast path: show the latest cached state from the DB right away (no LLM wait).
    // Because validation now runs after every guidance message, the DB is already
    // up-to-date in most cases and this instant refresh is all that is needed.
    await refreshReviewState()
    setIsValidatingReview(false)

    // Background deep re-scan: runs the full LLM validation silently and updates the
    // UI when it finishes. The user sees the fast result first; any corrections from
    // the deep scan appear a few seconds later with no spinner blocking the screen.
    fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(sourceSessionId)}/review/validate`, {
      method: 'POST',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { reviewProgress?: unknown; phaseProgress?: { phases?: unknown[] }; recommendedPhase?: number } | null) => {
        if (!data) return
        if (data.reviewProgress) setReviewProgress(data.reviewProgress as ReviewProgress)
        if (Array.isArray(data.phaseProgress?.phases)) setPhases(data.phaseProgress.phases as PhaseProgressItem[])
      })
      .catch(() => {})
  }, [apiBaseUrl, refreshReviewState, reviewSourceSessionId, sessionId])

  const handleUploadReviewDocuments = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      event.target.value = ''
      if (files.length === 0) return

      setIsUploadingEvidence(true)

      // Snapshot state before upload so we can report exactly what changed.
      const completedBefore = (reviewProgress?.phases ?? []).reduce(
        (sum, p) => sum + (p.completedCount ?? 0), 0
      )
      const activePhaseBefore = phases.find((p) => p.active)?.id ?? 0
      const phaseLabels = ['Empathize', 'Conceive', 'Design', 'Implement', 'Test/Revise', 'Operate']

      try {
        const activeGuidanceSessionId =
          typeof window !== 'undefined'
            ? (localStorage.getItem('engibuddy.activeGuidanceSessionId') ?? undefined)
            : undefined

        const detectedPhases: string[] = []

        // Step 1 — upload each file; backend auto-detects phase + fires background validation
        for (const file of files) {
          const content = (await file.text()).trim()
          if (!content) continue

          const resp = await fetch(`${apiBaseUrl}/projects/${encodeURIComponent(projectId)}/artifacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              artifactType: 'review_document',
              title: file.name,
              phaseId: null,
              content,
              sessionId: activeGuidanceSessionId,
            }),
          })

          if (resp.ok) {
            const data = await resp.json() as { detectedPhaseName?: string; detectedPhase?: number }
            if (data.detectedPhaseName) {
              const label = `Phase ${data.detectedPhase ?? '?'} — ${data.detectedPhaseName}`
              if (!detectedPhases.includes(label)) detectedPhases.push(label)
            }
          }
        }

        await refreshReviewArtifacts()

        // Step 2 — show immediate feedback with detected phase
        const phaseInfo = detectedPhases.length > 0
          ? ` Detected as ${detectedPhases.join(' and ')}.`
          : ''
        setMessages((prev) => [
          ...prev,
          {
            id: `upload-${Date.now()}`,
            role: 'assistant' as const,
            content: `Added ${files.length} document${files.length === 1 ? '' : 's'}.${phaseInfo} Running full analysis — updating your checklist and phase tracker now...`,
            timestamp: currentTimestamp(),
          },
        ])

        // Step 3 — run full LLM validation and AWAIT it so the completion message
        // reflects the actual result.  This is the expensive call (~5-10 s) but
        // it gives the user certainty that the analysis is done when the message appears.
        const sourceSessionId = reviewSourceSessionId ?? sessionId
        const validateResp = await fetch(
          `${apiBaseUrl}/sessions/${encodeURIComponent(sourceSessionId)}/review/validate`,
          { method: 'POST' }
        )

        if (validateResp.ok) {
          const vd = await validateResp.json() as {
            reviewProgress?: ReviewProgress
            phaseProgress?: { phases?: PhaseProgressItem[] }
            recommendedPhase?: number
          }

          // Update both the checklist and the phase stepper from validated results
          if (vd.reviewProgress) setReviewProgress(vd.reviewProgress)
          if (Array.isArray(vd.phaseProgress?.phases)) setPhases(vd.phaseProgress!.phases!)

          // Build precise completion message
          const completedAfter = (vd.reviewProgress?.phases ?? []).reduce(
            (sum, p) => sum + (p.completedCount ?? 0), 0
          )
          const newlyTicked = completedAfter - completedBefore
          const activePhaseAfter =
            vd.phaseProgress?.phases?.find((p) => p.active)?.id ?? activePhaseBefore

          let completionMsg = '✓ Analysis complete. '
          if (newlyTicked > 0) {
            completionMsg += `Found evidence for ${newlyTicked} new criteria. `
          } else {
            completionMsg += 'No additional criteria found from this document. '
          }
          if (activePhaseAfter !== activePhaseBefore) {
            completionMsg += `Phase advanced from Phase ${activePhaseBefore} (${phaseLabels[activePhaseBefore] ?? ''}) to Phase ${activePhaseAfter} (${phaseLabels[activePhaseAfter] ?? ''}). `
          } else {
            completionMsg += `Still on Phase ${activePhaseAfter} (${phaseLabels[activePhaseAfter] ?? ''}). `
          }
          completionMsg += 'Your checklist and phase tracker above have been updated.'

          setMessages((prev) => [
            ...prev,
            {
              id: `upload-done-${Date.now()}`,
              role: 'assistant' as const,
              content: completionMsg,
              timestamp: currentTimestamp(),
            },
          ])
        } else {
          // Validation call failed — fall back to a plain DB refresh
          await refreshReviewState()
          setMessages((prev) => [
            ...prev,
            {
              id: `upload-done-${Date.now()}`,
              role: 'assistant' as const,
              content: 'Document added and checklist refreshed.',
              timestamp: currentTimestamp(),
            },
          ])
        }

        setHistoryRefreshKey((value) => value + 1)
      } catch (error) {
        console.error('Error uploading review documents:', error)
        setMessages((prev) => [
          ...prev,
          {
            id: `upload-error-${Date.now()}`,
            role: 'assistant' as const,
            content: 'I could not add that document. Try a text-based file such as .txt, .md, .csv, or .json.',
            status: 'error' as const,
            timestamp: currentTimestamp(),
          },
        ])
      } finally {
        setIsUploadingEvidence(false)
      }
    },
    [
      apiBaseUrl,
      projectId,
      phases,
      reviewProgress,
      reviewSourceSessionId,
      sessionId,
      refreshReviewArtifacts,
      refreshReviewState,
      setReviewProgress,
    ]
  )

  const handleDeleteArtifact = useCallback(
    async (artifactId: number) => {
      const phaseLabels = ['Empathize', 'Conceive', 'Design', 'Implement', 'Test/Revise', 'Operate']
      const completedBefore = (reviewProgress?.phases ?? []).reduce(
        (sum, p) => sum + (p.completedCount ?? 0), 0
      )
      const activePhaseBefore = phases.find((p) => p.active)?.id ?? 0

      const activeGuidanceSessionId =
        typeof window !== 'undefined'
          ? (localStorage.getItem('engibuddy.activeGuidanceSessionId') ?? '')
          : ''

      try {
        const params = activeGuidanceSessionId ? `?session_id=${encodeURIComponent(activeGuidanceSessionId)}` : ''
        const resp = await fetch(
          `${apiBaseUrl}/projects/${encodeURIComponent(projectId)}/artifacts/${artifactId}${params}`,
          { method: 'DELETE' }
        )

        if (!resp.ok) {
          setMessages((prev) => [
            ...prev,
            {
              id: `delete-error-${Date.now()}`,
              role: 'assistant' as const,
              content: 'Could not remove that document. Please try again.',
              status: 'error' as const,
              timestamp: currentTimestamp(),
            },
          ])
          return
        }

        const data = await resp.json() as {
          reviewProgress?: ReviewProgress
          phaseProgress?: { phases?: PhaseProgressItem[] }
        }

        if (data.reviewProgress) setReviewProgress(data.reviewProgress)
        if (Array.isArray(data.phaseProgress?.phases)) setPhases(data.phaseProgress!.phases!)

        await refreshReviewArtifacts()

        // Build message describing what changed
        const completedAfter = (data.reviewProgress?.phases ?? []).reduce(
          (sum, p) => sum + (p.completedCount ?? 0), 0
        )
        const undone = completedBefore - completedAfter
        const activePhaseAfter = data.phaseProgress?.phases?.find((p) => p.active)?.id ?? activePhaseBefore

        let msg = 'Document removed. '
        if (undone > 0) {
          msg += `${undone} criteria have been undone (no longer evidenced by remaining documents or chat). `
        } else {
          msg += 'No criteria were affected — evidence exists elsewhere. '
        }
        if (activePhaseAfter !== activePhaseBefore) {
          msg += `Phase moved back to Phase ${activePhaseAfter} (${phaseLabels[activePhaseAfter] ?? ''}). `
        }
        msg += 'Checklist and phase tracker updated.'

        setMessages((prev) => [
          ...prev,
          {
            id: `delete-done-${Date.now()}`,
            role: 'assistant' as const,
            content: msg,
            timestamp: currentTimestamp(),
          },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `delete-error-${Date.now()}`,
            role: 'assistant' as const,
            content: 'Could not remove that document. Please try again.',
            status: 'error' as const,
            timestamp: currentTimestamp(),
          },
        ])
      }
    },
    [apiBaseUrl, projectId, phases, reviewProgress, refreshReviewArtifacts, setReviewProgress]
  )

  const handleClearAllDocuments = useCallback(async () => {
    if (reviewArtifacts.length === 0) return
    const activeGuidanceSessionId =
      typeof window !== 'undefined'
        ? (localStorage.getItem('engibuddy.activeGuidanceSessionId') ?? '')
        : ''
    const params = activeGuidanceSessionId ? `?session_id=${encodeURIComponent(activeGuidanceSessionId)}` : ''
    // Delete all but the last artifact silently, then use the last deletion's
    // response (which re-validates without any documents) to update state.
    for (let i = 0; i < reviewArtifacts.length - 1; i++) {
      await fetch(`${apiBaseUrl}/projects/${encodeURIComponent(projectId)}/artifacts/${reviewArtifacts[i].id}${params}`, { method: 'DELETE' })
    }
    const last = reviewArtifacts[reviewArtifacts.length - 1]
    const resp = await fetch(`${apiBaseUrl}/projects/${encodeURIComponent(projectId)}/artifacts/${last.id}${params}`, { method: 'DELETE' })
    const data = resp.ok ? await resp.json() as { reviewProgress?: ReviewProgress; phaseProgress?: { phases?: PhaseProgressItem[] } } : {}
    if (data.reviewProgress) setReviewProgress(data.reviewProgress)
    else setReviewProgress(null)
    if (Array.isArray(data.phaseProgress?.phases)) setPhases(data.phaseProgress!.phases!)
    else setPhases((prev) => prev.map((p) => ({ ...p, active: p.id === 0, visited: false, completed: false })))
    await refreshReviewArtifacts()
    setMessages((prev) => [
      ...prev,
      { id: `clear-${Date.now()}`, role: 'assistant' as const, content: 'All documents removed. Checklist reset to 0/24.', timestamp: currentTimestamp() },
    ])
  }, [apiBaseUrl, projectId, reviewArtifacts, refreshReviewArtifacts, setReviewProgress])

  const handleAskAboutReviewPoint = useCallback(
    (phase: ReviewPhase, point: ReviewPoint) => {
      void handleSendMessage(
        `Review this checklist point for Phase ${phase.id}: ${phase.name}: "${point.label}". Tell me what evidence is already available, what is missing, and the next concrete action to finish it.`
      )
    },
    [handleSendMessage]
  )

  const handleHelpWithReviewPoint = useCallback(
    (phase: ReviewPhase, point: ReviewPoint) => {
      void handleSendMessage(
        `Use Review Help Guidance from the RAG knowledge base for Phase ${phase.id}: ${phase.name}. Help me solve this missing checklist task without giving me a finished final answer: "${point.label}". Follow this structure: 1) what this task is checking, 2) what a good answer must contain, 3) a close but partial example, 4) questions I should answer, 5) evidence I should upload or write so Review validation can pass. Be specific to my current project evidence and constraints.`
      )
    },
    [handleSendMessage]
  )

  return (
    <div className="flex h-screen bg-white text-gray-900">
      <ChatHistory
        currentSessionId={isGuidanceMode ? sessionId : reviewSourceSessionId ?? sessionId}
        refreshKey={historyRefreshKey}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PhaseStepper phases={phases} />
        {isGuidanceMode && (
          <>
            {showDebugBar && (
              <RagBar
                classification={classification}
                ragSources={ragSources}
                ragProvider={ragProvider}
                ragPreview={ragPreview}
                showRagDebug={showRagDebug}
                promptVersion={promptVersion}
                onToggleRagDebug={() => setShowRagDebug((value) => !value)}
                onClose={() => {
                  setShowDebugBar(false)
                  localStorage.setItem('engibuddy.showDebugBar', 'false')
                }}
              />
            )}

            <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">EngiBuddy</h1>
              <ModeNav isGuidanceMode={isGuidanceMode} />
            </header>

            <ChatWindow
              messages={messages}
              isLoading={showTypingIndicator}
              emptyTitle="Welcome to EngiBuddy"
              emptyDescription="Start by describing your project or asking a question about your current phase."
            />
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              placeholder="Type your message here..."
            />
          </>
        )}

        {!isGuidanceMode && (
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden border-t border-gray-200 lg:grid-cols-[minmax(360px,42%)_minmax(0,1fr)]">
            <aside className="min-h-0 overflow-hidden border-r border-gray-200 bg-slate-50">
              <ReviewChecklist
                reviewProgress={reviewProgress}
                phases={phases}
                artifacts={reviewArtifacts}
                layout="column"
                isValidating={isValidatingReview}
                onAskAboutPoint={handleAskAboutReviewPoint}
                onHelpWithPoint={handleHelpWithReviewPoint}
                onRerunValidation={rerunReviewValidation}
                onDeleteArtifact={handleDeleteArtifact}
              />
            </aside>

            <section className="flex min-h-0 min-w-0 flex-col bg-white">
              <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-5">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Review Chat</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Independent from Guidance. Uses Review-specific RAG context, configuration, and constraints.
                  </p>
                </div>
                <ModeNav isGuidanceMode={isGuidanceMode} />
              </header>

              <div className="border-b border-gray-200 bg-white px-8 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDefineCriteriaWithRag}
                    disabled={isLoading}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    Define Criteria With RAG
                  </button>

                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    {isUploadingEvidence ? <RotateCw className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                    <span>{isUploadingEvidence ? 'Analysing...' : 'Add Documents (select one or more)'}</span>
                    <input
                      type="file"
                      multiple
                      accept=".txt,.md,.markdown,.csv,.json,.log"
                      className="hidden"
                      disabled={isUploadingEvidence}
                      onChange={handleUploadReviewDocuments}
                    />
                  </label>

                  {reviewArtifacts.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllDocuments}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      title="Remove all uploaded documents and reset checklist"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear All Documents
                    </button>
                  )}

                </div>
              </div>

              <ChatWindow
                messages={messages}
                isLoading={showTypingIndicator}
                emptyTitle="Review Chat"
                emptyDescription="Ask about the reviewed points, missing evidence, or the next action for this phase."
              />
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder="Ask about missing points or how to finish this phase..."
              />
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

function ModeNav({ isGuidanceMode }: { isGuidanceMode: boolean }) {
  return (
    <nav className="flex shrink-0 items-center gap-3">
      <Link
        href="/guidance"
        className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${
          isGuidanceMode
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        <MessageCircle className="h-4 w-4" />
        <span>Guidance Mode</span>
      </Link>
      <Link
        href="/review"
        className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${
          isGuidanceMode
            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            : 'bg-blue-600 text-white shadow-sm'
        }`}
      >
        <SquarePen className="h-4 w-4" />
        <span>Review Mode</span>
      </Link>
    </nav>
  )
}

function buildWelcomeMessages(content: string): ChatMessageType[] {
  return [
    {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: currentTimestamp(),
    },
  ]
}

function reviewSessionIdFor(sourceSessionId: string): string {
  return sourceSessionId.startsWith('review-') ? sourceSessionId : `review-${sourceSessionId}`
}

function mapMessages(sessionId: string, rawMessages: unknown): ChatMessageType[] {
  if (!Array.isArray(rawMessages)) return []

  return rawMessages
    .filter((message): message is { role: 'user' | 'assistant'; content: string; timestamp: string } => {
      if (!message || typeof message !== 'object') return false
      const candidate = message as { role?: unknown; content?: unknown; timestamp?: unknown }
      return (
        (candidate.role === 'user' || candidate.role === 'assistant') &&
        typeof candidate.content === 'string' &&
        typeof candidate.timestamp === 'string'
      )
    })
    .map((message, index) => ({
      id: `${sessionId}-${message.timestamp}-${index}`,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
    }))
}
