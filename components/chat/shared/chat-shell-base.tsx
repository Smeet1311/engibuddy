'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import Link from 'next/link'
import { FileUp, MessageCircle, RotateCw, Sparkles, SquarePen } from 'lucide-react'
import { ChatHistory } from '../chat-history'
import { ChatInput } from '../chat-input'
import { ChatWindow } from '../chat-window'
import { PhaseStepper } from '../phase-stepper'
import { RagBar } from '../rag-bar'
import { ReviewChecklist } from '../review/review-checklist'
import type { ReviewArtifact } from '../review/review-checklist'

export type ChatMessageType = {
  id: string
  role: 'user' | 'assistant'
  content: string
  status?: 'error'
  timestamp: string
}

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

type ReviewProgress = {
  phases: ReviewPhase[]
  summary: {
    completedPoints: number
    totalPoints: number
    percent: number
  }
}

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
  const [sessionId, setSessionId] = useState<string>(() => `session-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`)
  const [reviewSourceSessionId, setReviewSourceSessionId] = useState<string | null>(null)
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')
  const isGuidanceMode = mode === 'guidance'
  const welcomeMessage = isGuidanceMode
    ? 'Welcome to EngiBuddy. Tell me what you are building and I will help step-by-step.'
    : 'Review Mode is ready. Ask what is complete, what is missing, or how to finish the current phase.'
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: currentTimestamp(),
    },
  ])

  const [isLoading, setIsLoading] = useState(false)
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)
  const [phases, setPhases] = useState<PhaseProgressItem[]>(DEFAULT_PHASES)
  const [classification, setClassification] = useState<Classification | null>(null)
  const [ragSources, setRagSources] = useState<string[]>([])
  const [ragProvider, setRagProvider] = useState('')
  const [ragPreview, setRagPreview] = useState('')
  const [showRagDebug, setShowRagDebug] = useState(false)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [promptVersion, setPromptVersion] = useState<string | null>(null)
  const [reviewProgress, setReviewProgress] = useState<ReviewProgress | null>(null)
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
        if (sessions.length === 0) {
          setReviewProgress({
            phases: DEFAULT_PHASES.map((phase) => ({
              id: phase.id,
              name: phase.name,
              points: [],
              completed: false,
              completedCount: 0,
              totalCount: 0,
            })),
            summary: { completedPoints: 0, totalPoints: 0, percent: 0 },
          })
          return
        }

        const latestSessionId = sessions[0].sessionId as string
        if (!latestSessionId) {
          return
        }

        const stateResponse = await fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(latestSessionId)}/state`)
        if (!stateResponse.ok) {
          throw new Error(`Backend returned ${stateResponse.status}`)
        }

        const stateData = await stateResponse.json()
        const reviewSessionId = reviewSessionIdFor(latestSessionId)
        setReviewSourceSessionId(latestSessionId)
        setSessionId(reviewSessionId)

        const messagesResponse = await fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(reviewSessionId)}/messages`)
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          const restoredMessages = mapMessages(reviewSessionId, messagesData?.messages)
          setMessages(restoredMessages.length > 0 ? restoredMessages : buildWelcomeMessages(welcomeMessage))
        }

        if (stateData?.phaseProgress?.phases && Array.isArray(stateData.phaseProgress.phases)) {
          setPhases(stateData.phaseProgress.phases)
        }

        if (stateData?.reviewProgress) {
          setReviewProgress(stateData.reviewProgress)
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
      if (isGuidanceMode) {
        setSessionId(newSessionId)
      } else {
        setReviewSourceSessionId(newSessionId)
        setSessionId(reviewSessionIdFor(newSessionId))
      }
      resetWelcomeMessage()
      setHistoryRefreshKey((value) => value + 1)
    },
    [isGuidanceMode, resetWelcomeMessage]
  )

  const handleSelectSession = useCallback(
    (selectedSessionId: string, sessionMessages: ChatMessageType[], sessionState?: SessionStatePayload) => {
      const nextSessionId = isGuidanceMode ? selectedSessionId : reviewSessionIdFor(selectedSessionId)
      setSessionId(nextSessionId)
      if (!isGuidanceMode) setReviewSourceSessionId(selectedSessionId)

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
                if (typeof event.sessionId === 'string' && event.sessionId.trim()) setSessionId(event.sessionId)
                if (event.reviewProgress) setReviewProgress(event.reviewProgress)
                if (Array.isArray(event.phaseProgress?.phases)) setPhases(event.phaseProgress.phases)
                setHistoryRefreshKey((v) => v + 1)
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
    try {
      const validationResponse = await fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(sourceSessionId)}/review/validate`, {
        method: 'POST',
      })
      if (validationResponse.ok) {
        const validationData = await validationResponse.json()
        if (validationData?.reviewProgress) setReviewProgress(validationData.reviewProgress)
        if (Array.isArray(validationData?.phaseProgress?.phases)) setPhases(validationData.phaseProgress.phases)
        if (typeof validationData?.recommendedPhase === 'number') {
          const phaseNames = ['Empathize', 'Conceive', 'Design', 'Implement', 'Test/Revise', 'Operate']
          const phaseName = phaseNames[validationData.recommendedPhase] ?? `Phase ${validationData.recommendedPhase}`
          setMessages((prev) => [
            ...prev,
            {
              id: `phase-correction-${Date.now()}`,
              role: 'assistant' as const,
              content: `Checklist validated. Your Guidance session has been moved to phase ${validationData.recommendedPhase} (${phaseName}) based on what is complete.`,
              timestamp: currentTimestamp(),
            },
          ])
        }
      } else {
        await refreshReviewState()
      }
    } finally {
      setIsValidatingReview(false)
    }
  }, [apiBaseUrl, refreshReviewState, reviewSourceSessionId, sessionId])

  const handleUploadReviewDocuments = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? [])
      event.target.value = ''
      if (files.length === 0) return

      setIsUploadingEvidence(true)
      try {
        for (const file of files) {
          const content = (await file.text()).trim()
          if (!content) continue
          await fetch(`${apiBaseUrl}/projects/${encodeURIComponent(projectId)}/artifacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              artifactType: 'review_document',
              title: file.name,
              phaseId: activePhase?.id,
              content,
            }),
          })
        }

        await refreshReviewArtifacts()
        await rerunReviewValidation()

        setMessages((prev) => [
          ...prev,
          {
            id: `upload-${Date.now()}`,
            role: 'assistant',
            content: `Added ${files.length} document${files.length === 1 ? '' : 's'} to Review evidence. I will use them when checking completed points and missing evidence.`,
            timestamp: currentTimestamp(),
          },
        ])
        setHistoryRefreshKey((value) => value + 1)
      } catch (error) {
        console.error('Error uploading review documents:', error)
        setMessages((prev) => [
          ...prev,
          {
            id: `upload-error-${Date.now()}`,
            role: 'assistant',
            content: 'I could not add that document to Review evidence. Try a text-based file such as .txt, .md, .csv, or .json.',
            status: 'error',
            timestamp: currentTimestamp(),
          },
        ])
      } finally {
        setIsUploadingEvidence(false)
      }
    },
    [activePhase, apiBaseUrl, projectId, refreshReviewArtifacts, rerunReviewValidation]
  )

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
            <RagBar
              classification={classification}
              ragSources={ragSources}
              ragProvider={ragProvider}
              ragPreview={ragPreview}
              showRagDebug={showRagDebug}
              promptVersion={promptVersion}
              onToggleRagDebug={() => setShowRagDebug((value) => !value)}
            />

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
                    <span>{isUploadingEvidence ? 'Adding Documents...' : 'Add Review Documents'}</span>
                    <input
                      type="file"
                      multiple
                      accept=".txt,.md,.markdown,.csv,.json,.log"
                      className="hidden"
                      disabled={isUploadingEvidence}
                      onChange={handleUploadReviewDocuments}
                    />
                  </label>

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
