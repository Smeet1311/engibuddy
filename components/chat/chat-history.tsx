'use client'

import { Clock, MoreVertical, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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
  onSelectSession: (
    sessionId: string,
    messages: ChatMessageType[],
    sessionState?: {
      phaseProgress?: { phases?: Array<{ id: number; name: string; active: boolean; visited: boolean; completed: boolean }> }
    }
  ) => void
}

type FlyoutMode = 'search' | 'recent' | null

export function ChatHistory({ currentSessionId, refreshKey, onNewChat, onSelectSession }: ChatHistoryProps) {
  const [collapsed, setCollapsed] = useState(true)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [search, setSearch] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [flyout, setFlyout] = useState<FlyoutMode>(null)
  const [flyoutSearch, setFlyoutSearch] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const editRef = useRef<HTMLInputElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)
  const flyoutSearchRef = useRef<HTMLInputElement>(null)
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')
  const projectId = 'local-project'

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/sessions?project_id=${encodeURIComponent(projectId)}`)
        if (!response.ok) return
        const data = await response.json()
        setSessions(Array.isArray(data?.sessions) ? data.sessions : [])
      } catch {
        setSessions([])
      }
    }
    void fetchSessions()
  }, [apiBaseUrl, projectId, refreshKey])

  // Close dropdown menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close flyout on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setFlyout(null)
        setFlyoutSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input when flyout opens in search mode
  useEffect(() => {
    if (flyout === 'search' && flyoutSearchRef.current) {
      flyoutSearchRef.current.focus()
    }
  }, [flyout])

  // Focus rename input when editing starts
  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus()
  }, [editingId])

  const openFlyout = (mode: FlyoutMode) => {
    setFlyout((prev) => (prev === mode ? null : mode))
    setFlyoutSearch('')
  }

  const handleNewChat = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name: 'New Chat' }),
      })
      if (!response.ok) return
      const data = await response.json()
      const newSessionId = data?.sessionId as string
      if (!newSessionId) return
      setFlyout(null)
      onNewChat(newSessionId)
    } catch {
      // ignore
    }
  }

  const handleSelectSession = async (sessionId: string) => {
    setFlyout(null)
    setFlyoutSearch('')
    try {
      const [messagesResponse, stateResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(sessionId)}/messages`),
        fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(sessionId)}/state`),
      ])
      if (!messagesResponse.ok) return
      const data = await messagesResponse.json()
      const stateData = stateResponse.ok ? await stateResponse.json() : undefined
      const messages: ChatMessageType[] = Array.isArray(data?.messages)
        ? data.messages.map((message: { role: 'user' | 'assistant'; content: string; timestamp: string }) => ({
            id: `${sessionId}-${message.timestamp}-${Math.random().toString(16).slice(2)}`,
            role: message.role,
            content: message.content,
            timestamp: message.timestamp,
          }))
        : []
      onSelectSession(sessionId, messages, stateData)
    } catch {
      // ignore
    }
  }

  const handleDelete = async (sessionId: string) => {
    setMenuOpenId(null)
    try {
      await fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' })
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId))
    } catch {
      // ignore
    }
  }

  const startRename = (session: SessionItem) => {
    setMenuOpenId(null)
    setEditingId(session.sessionId)
    setEditName(session.name)
  }

  const commitRename = async (sessionId: string) => {
    const name = editName.trim()
    setEditingId(null)
    if (!name) return
    try {
      const response = await fetch(`${apiBaseUrl}/sessions/${encodeURIComponent(sessionId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (response.ok) {
        setSessions((prev) => prev.map((s) => (s.sessionId === sessionId ? { ...s, name } : s)))
      }
    } catch {
      // ignore
    }
  }

  const filteredSessions = sessions.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const flyoutFiltered = sessions.filter((s) =>
    s.name.toLowerCase().includes(flyoutSearch.toLowerCase())
  )

  const SessionRow = ({ session, inFlyout = false }: { session: SessionItem; inFlyout?: boolean }) => (
    <div
      className="relative"
      onMouseEnter={() => setHoveredId(session.sessionId)}
      onMouseLeave={() => { if (menuOpenId !== session.sessionId) setHoveredId(null) }}
    >
      {editingId === session.sessionId ? (
        <div className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1.5">
          <input
            ref={editRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => void commitRename(session.sessionId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void commitRename(session.sessionId)
              if (e.key === 'Escape') setEditingId(null)
            }}
            className="min-w-0 flex-1 rounded bg-white px-2 py-0.5 text-xs text-gray-900 outline-none ring-1 ring-blue-400"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void handleSelectSession(session.sessionId)}
          className={`group flex w-full items-center rounded-md px-2 py-2 text-left transition ${
            currentSessionId === session.sessionId
              ? 'bg-blue-50 text-gray-900'
              : 'text-gray-800 hover:bg-gray-100'
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium leading-5">{session.name}</p>
            <p className="text-[10px] text-gray-400">
              {new Date(session.lastMessageAt || session.createdAt).toLocaleDateString()}
            </p>
          </div>
          {(hoveredId === session.sessionId || menuOpenId === session.sessionId) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpenId((prev) => (prev === session.sessionId ? null : session.sessionId))
              }}
              className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-gray-200"
            >
              <MoreVertical className="h-3.5 w-3.5 text-gray-500" />
            </button>
          )}
        </button>
      )}

      {menuOpenId === session.sessionId && (
        <div className={`absolute z-50 min-w-[130px] rounded-md border border-gray-200 bg-white py-1 shadow-lg ${inFlyout ? 'right-2 top-8' : 'right-2 top-8'}`}>
          <button
            type="button"
            onClick={() => startRename(session)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            Rename
          </button>
          <button
            type="button"
            onClick={() => void handleDelete(session.sessionId)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  )

  return (
    <aside className="relative flex h-screen shrink-0 flex-col">
      <div
        className={`flex h-full flex-col border-r border-gray-200 bg-gray-50 transition-all duration-300 ${
          collapsed ? 'w-14' : 'w-64'
        }`}
      >
        {/* Toggle */}
        <div className="flex items-center justify-between px-3 py-4">
          <button
            type="button"
            onClick={() => { setCollapsed((v) => !v); setFlyout(null) }}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-100"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3">
          <button
            type="button"
            onClick={() => void handleNewChat()}
            className={`flex h-10 items-center justify-center rounded-md bg-blue-600 font-semibold text-white transition hover:bg-blue-700 ${
              collapsed ? 'w-8 px-0' : 'w-full gap-2 px-4'
            }`}
          >
            <Plus className="h-4 w-4" />
            {!collapsed && <span className="text-sm">New Chat</span>}
          </button>
        </div>

        {/* Collapsed icon buttons */}
        {collapsed && (
          <div className="mt-3 flex flex-col items-center gap-2 px-3">
            <button
              type="button"
              onClick={() => openFlyout('search')}
              title="Search chats"
              className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                flyout === 'search' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => openFlyout('recent')}
              title="Recent chats"
              className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                flyout === 'recent' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Clock className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Expanded: Search + Sessions */}
        {!collapsed && (
          <>
            <div className="mt-3 px-3">
              <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto px-2">
              <p className="mb-2 px-2 text-xs font-medium text-gray-400">Chat History</p>
              <div className="space-y-0.5" ref={menuRef}>
                {filteredSessions.map((session) => (
                  <SessionRow key={session.sessionId} session={session} />
                ))}
                {filteredSessions.length === 0 && (
                  <p className="px-2 py-4 text-center text-xs text-gray-400">
                    {search ? 'No chats match.' : 'No chats yet.'}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Flyout panel for collapsed mode */}
      {collapsed && flyout && (
        <div
          ref={flyoutRef}
          className="absolute left-14 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white shadow-xl"
        >
          {/* Flyout header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-700">
              {flyout === 'search' ? 'Search Chats' : 'Recent Chats'}
            </span>
            <button
              type="button"
              onClick={() => { setFlyout(null); setFlyoutSearch('') }}
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100"
            >
              <X className="h-3.5 w-3.5 text-gray-500" />
            </button>
          </div>

          {/* Search input (always shown in search mode, optional in recent) */}
          {flyout === 'search' && (
            <div className="border-b border-gray-100 px-3 py-2">
              <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <input
                  ref={flyoutSearchRef}
                  type="text"
                  placeholder="Search chats..."
                  value={flyoutSearch}
                  onChange={(e) => setFlyoutSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          {/* Session list */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <div className="space-y-0.5">
              {flyoutFiltered.map((session) => (
                <SessionRow key={session.sessionId} session={session} inFlyout />
              ))}
              {flyoutFiltered.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-gray-400">
                  {flyoutSearch ? 'No chats match.' : 'No chats yet.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
