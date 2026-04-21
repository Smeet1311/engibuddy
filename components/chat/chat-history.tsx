'use client'

import { PanelLeftClose, PanelLeftOpen, Plus, Settings } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type ChatMessageType = {
  id: string
  role: 'user' | 'assistant'
  content: string
  status?: 'error'
  timestamp: string
}

type SessionItem = {
  sessionId: string
  name: string
  createdAt: string
  lastMessageAt: string | null
}

interface ChatHistoryProps {
  currentSessionId: string
  refreshKey: number
  onNewChat: (newSessionId: string) => void
  onSelectSession: (sessionId: string, messages: ChatMessageType[]) => void
}

export function ChatHistory({ currentSessionId, refreshKey, onNewChat, onSelectSession }: ChatHistoryProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')
  const projectId = 'local-project'

  const selectedSessionId = useMemo(() => currentSessionId, [currentSessionId])

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/sessions?project_id=${encodeURIComponent(projectId)}`)
        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`)
        }
        const data = await response.json()
        setSessions(Array.isArray(data?.sessions) ? data.sessions : [])
      } catch (error) {
        console.error('Error loading sessions:', error)
        setSessions([])
      }
    }
    void fetchSessions()
  }, [apiBaseUrl, projectId, refreshKey])

  const handleNewChat = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name: 'New Chat' }),
      })
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`)
      }
      const data = await response.json()
      const newSessionId = data?.sessionId as string
      if (!newSessionId) {
        return
      }
      onNewChat(newSessionId)
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  const handleSelectSession = async (sessionId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(sessionId)}/messages`)
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`)
      }
      const data = await response.json()
      const messages: ChatMessageType[] = Array.isArray(data?.messages)
        ? data.messages.map((message: { role: 'user' | 'assistant'; content: string; timestamp: string }) => ({
            id: `${sessionId}-${message.timestamp}-${Math.random().toString(16).slice(2)}`,
            role: message.role,
            content: message.content,
            timestamp: message.timestamp,
          }))
        : []
      onSelectSession(sessionId, messages)
    } catch (error) {
      console.error('Error loading session messages:', error)
    }
  }

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-gray-200 bg-gray-50 transition-all duration-300 ${
        collapsed ? 'w-14' : 'w-60'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-4">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-100"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <div className="px-3">
        <button
          type="button"
          onClick={() => void handleNewChat()}
          className={`flex h-12 items-center justify-center rounded-md bg-blue-600 font-semibold text-white transition hover:bg-blue-700 ${
            collapsed ? 'w-8 px-0' : 'w-full gap-2 px-4'
          }`}
        >
          <Plus className="h-5 w-5" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-8 flex-1 overflow-y-auto px-4">
          <p className="mb-4 text-sm font-medium text-gray-500">Chat History</p>
          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session.sessionId}
                type="button"
                onClick={() => void handleSelectSession(session.sessionId)}
                className={`w-full rounded-md px-3 py-2 text-left transition ${
                  selectedSessionId === session.sessionId
                    ? 'bg-blue-50 text-gray-900'
                    : 'text-gray-800 hover:bg-gray-100'
                }`}
              >
                <p className="text-sm font-semibold leading-5">{session.name}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(session.lastMessageAt || session.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`${collapsed ? 'px-3' : 'px-4'} mt-auto border-t border-gray-200 py-5`}>
        <button
          type="button"
          className={`flex items-center rounded-md text-gray-800 hover:bg-gray-100 ${
            collapsed ? 'h-8 w-8 justify-center' : 'w-full gap-3 px-2 py-2 text-left'
          }`}
        >
          <Settings className="h-5 w-5" />
          {!collapsed && <span className="text-sm font-semibold">Settings</span>}
        </button>
        {!collapsed && <p className="mt-2 text-xs text-gray-400">Manage cookies or opt out</p>}
      </div>
    </aside>
  )
}
