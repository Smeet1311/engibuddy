'use client'

import { useEffect, useRef } from 'react'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  status?: 'error'
  timestamp: string
}

interface ChatWindowProps {
  messages: ChatMessage[]
  isLoading?: boolean
}

export function ChatWindow({ messages, isLoading = false }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-8 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-gray-900">Welcome to EngiBuddy</div>
              <p className="max-w-md text-gray-500">
                Start by describing your project or asking a question about your current phase.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-2xl flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-md px-5 py-4 text-sm leading-relaxed ${
                    message.status === 'error'
                      ? 'bg-red-50 text-red-700'
                      : message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                </div>
                <span className="mt-1 text-xs text-gray-400">{message.timestamp}</span>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-2xl rounded-md bg-gray-100 px-5 py-4 text-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.2s' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.4s' }} />
                </div>
                <span className="text-sm text-gray-500">EngiBuddy is typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
