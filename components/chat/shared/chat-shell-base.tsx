'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, SquarePen } from 'lucide-react'
import { ChatHistory } from '../chat-history'
import { ChatInput } from '../chat-input'
import { ChatWindow } from '../chat-window'
import { PhaseStepper } from '../phase-stepper'
import { RagBar } from '../rag-bar'
import { ReviewChecklist } from '../review/review-checklist'

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
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to EngiBuddy. Tell me what you are building and I will help step-by-step.',
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
  const isGuidanceMode = mode === 'guidance'

  useEffect(() => {
    if (isGuidanceMode) {
      return
    }

    const bootstrapReviewState = async () => {
      try {
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
        setSessionId(latestSessionId)

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
  }, [apiBaseUrl, isGuidanceMode, projectId])

  const resetWelcomeMessage = useCallback(() => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Welcome to EngiBuddy. Tell me what you are building and I will help step-by-step.',
        timestamp: currentTimestamp(),
      },
    ])
  }, [])

  const handleNewChat = useCallback(
    (newSessionId: string) => {
      setSessionId(newSessionId)
      resetWelcomeMessage()
      setHistoryRefreshKey((value) => value + 1)
    },
    [resetWelcomeMessage]
  )

  const handleSelectSession = useCallback(
    (selectedSessionId: string, sessionMessages: ChatMessageType[], sessionState?: SessionStatePayload) => {
      setSessionId(selectedSessionId)
      if (sessionMessages.length === 0) {
        resetWelcomeMessage()
      } else {
        setMessages(sessionMessages)
      }
      const restoredPhases = sessionState?.phaseProgress?.phases
      if (Array.isArray(restoredPhases) && restoredPhases.length === DEFAULT_PHASES.length) {
        setPhases(restoredPhases)
      }
      setReviewProgress(sessionState?.reviewProgress ?? null)
      setClassification((prev) => prev ?? { phase: 0, phase_name: 'Empathize', confidence: 0, transition: 'stay', reason: 'Session restored from saved phase state.' })
      setHistoryRefreshKey((value) => value + 1)
    },
    [resetWelcomeMessage]
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
                if (data?.reviewProgress) {
          setReviewProgress(data.reviewProgress)
        }
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
    [apiBaseUrl, messages, mode, projectId, sessionId, mode]
  )

  return (
    <div className="flex h-screen bg-white text-gray-900">
      <ChatHistory
        currentSessionId={sessionId}
        refreshKey={historyRefreshKey}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PhaseStepper phases={phases} />
        {!isGuidanceMode && (
          <ReviewChecklist
            reviewProgress={reviewProgress}
          />
        )}
        {isGuidanceMode && (
          <RagBar
            classification={classification}
            ragSources={ragSources}
            ragProvider={ragProvider}
            ragPreview={ragPreview}
            showRagDebug={showRagDebug}
            promptVersion={promptVersion}
            onToggleRagDebug={() => setShowRagDebug((value) => !value)}
          />
        )}

        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">EngiBuddy</h1>
          <nav className="flex items-center gap-3">
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
        </header>

        {isGuidanceMode ? (
          <>
            <ChatWindow messages={messages} isLoading={showTypingIndicator} />
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </>
        ) : (
          <div className="flex min-h-0 flex-1 items-start overflow-y-auto bg-white px-8 py-6">
            <div className="max-w-3xl rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Review Mode is read-only. Select a chat session from the sidebar to inspect phase completion status.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
