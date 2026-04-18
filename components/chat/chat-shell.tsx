'use client'

import { useState, useCallback } from 'react'
import { ChatWindow } from './chat-window'
import { ChatInput } from './chat-input'
import { PhaseSidebar } from './phase-sidebar'

type ChatMessageType = {
  id: string
  role: 'user' | 'assistant'
  content: string
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
  reason?: string
}

const DEFAULT_PHASES: PhaseProgressItem[] = [
  { id: 0, name: 'Empathize', active: true, visited: true, completed: false },
  { id: 1, name: 'Conceive', active: false, visited: false, completed: false },
  { id: 2, name: 'Design', active: false, visited: false, completed: false },
  { id: 3, name: 'Implement', active: false, visited: false, completed: false },
  { id: 4, name: 'Test/Revise', active: false, visited: false, completed: false },
  { id: 5, name: 'Operate', active: false, visited: false, completed: false },
]

export function ChatShell() {
  const [projectId] = useState<string>('local-project')
  const [sessionId] = useState<string>(() => `session-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`)
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to EngiBuddy. Tell me what you are building and I will help step-by-step.',
    },
  ])

  const [isLoading, setIsLoading] = useState(false)
  const [phases, setPhases] = useState<PhaseProgressItem[]>(DEFAULT_PHASES)
  const [classification, setClassification] = useState<Classification | null>(null)

  const handleSendMessage = useCallback(
    async (message: string) => {
      const userMessage: ChatMessageType = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
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
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        const data = await response.json()

        const assistantMessage: ChatMessageType = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.assistantMessage,
        }

        setMessages((prev) => [...prev, assistantMessage])
        if (data?.phaseProgress?.phases && Array.isArray(data.phaseProgress.phases)) {
          setPhases(data.phaseProgress.phases)
        }
        if (data?.classification) {
          setClassification(data.classification)
        }
      } catch (error) {
        console.error('Error sending message:', error)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [apiBaseUrl, messages, projectId, sessionId]
  )

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      <PhaseSidebar phases={phases} />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <header className="border-b border-slate-700 bg-slate-900 px-6 h-16 flex items-center">
          <div className="flex w-full items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-white">EngiBuddy</h1>
            {classification && (
              <div className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                <span className="text-slate-400">Phase:</span> {classification.phase_name}{' '}
                <span className="text-slate-500">|</span>{' '}
                <span className="text-slate-400">Confidence:</span>{' '}
                {Math.round((classification.confidence || 0) * 100)}%
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 flex flex-col min-h-0">
          <ChatWindow messages={messages} isLoading={isLoading} />
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}