'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, SquarePen } from 'lucide-react'
import { ChatHistory } from '../chat-history'
import { ChatInput } from '../chat-input'
import { ChatWindow } from '../chat-window'
import { PhaseStepper } from '../phase-stepper'
import { RagBar } from '../rag-bar'

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
  const [phases, setPhases] = useState<PhaseProgressItem[]>(DEFAULT_PHASES)
  const [classification, setClassification] = useState<Classification | null>(null)
  const [ragSources, setRagSources] = useState<string[]>([])
  const [ragProvider, setRagProvider] = useState('')
  const [ragPreview, setRagPreview] = useState('')
  const [showRagDebug, setShowRagDebug] = useState(false)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [promptVersion, setPromptVersion] = useState<string | null>(null)
  const isGuidanceMode = mode === 'guidance'

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

      try {
        const response = await fetch(`${apiBaseUrl}/chat`, {
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

        const data = await response.json()
        if (typeof data?.sessionId === 'string' && data.sessionId.trim()) {
          setSessionId(data.sessionId)
        }
        if (typeof data?.promptVersion === 'string') {
          setPromptVersion(data.promptVersion)
        }

        const assistantMessage: ChatMessageType = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.assistantMessage,
          timestamp: currentTimestamp(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        if (data?.phaseProgress?.phases && Array.isArray(data.phaseProgress.phases)) {
          setPhases(data.phaseProgress.phases)
        }
        if (data?.classification) {
          setClassification(data.classification)
        }
        setRagSources(Array.isArray(data?.ragSources) ? data.ragSources : [])
        setRagProvider(typeof data?.ragProvider === 'string' ? data.ragProvider : data?.ragRetrievalMode || '')
        setRagPreview(typeof data?.ragPreview === 'string' ? data.ragPreview : '')
        setHistoryRefreshKey((value) => value + 1)
      } catch (error) {
        console.error('Error sending message:', error)
        setRagSources([])
        setRagProvider('')
        setRagPreview('')
        setShowRagDebug(false)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Backend error - check your API settings or try again.',
            status: 'error',
            timestamp: currentTimestamp(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [apiBaseUrl, messages, projectId, sessionId]
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

        <ChatWindow messages={messages} isLoading={isLoading} />
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}
