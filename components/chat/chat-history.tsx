'use client'

import { PanelLeftClose, PanelLeftOpen, Plus, Settings } from 'lucide-react'
import { useState } from 'react'

const MOCK_SESSIONS = [
  { name: 'Getting Started with PBL', date: '2026-04-20' },
  { name: 'Bridge Design Project', date: '2026-04-19' },
  { name: 'Sustainable Energy Solutions', date: '2026-04-18' },
  { name: 'Water Filtration System', date: '2026-04-17' },
]

export function ChatHistory() {
  const [collapsed, setCollapsed] = useState(false)
  const [selected, setSelected] = useState(0)

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
            {MOCK_SESSIONS.map((session, index) => (
              <button
                key={session.name}
                type="button"
                onClick={() => setSelected(index)}
                className={`w-full rounded-md px-3 py-2 text-left transition ${
                  selected === index ? 'bg-blue-50 text-gray-900' : 'text-gray-800 hover:bg-gray-100'
                }`}
              >
                <p className="text-sm font-semibold leading-5">{session.name}</p>
                <p className="mt-1 text-xs text-gray-500">{session.date}</p>
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
