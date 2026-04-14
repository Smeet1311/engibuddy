'use client'

import { useState } from 'react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading?: boolean
}

export function ChatInput({ onSendMessage, isLoading = false }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="border-t border-slate-700 bg-slate-900">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="message" className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Ask EngiBuddy
          </label>
          <textarea
            id="message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you're working on, ask a question, or share a challenge..."
            disabled={isLoading}
            className="w-full px-4 py-3 rounded border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none resize-none"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <span className="inline-block">Press Shift+Enter for new line</span>
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
