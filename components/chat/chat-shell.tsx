'use client'

import { useState, useCallback } from 'react'
import { ChatWindow } from './chat-window'
import { ChatInput } from './chat-input'

type ChatMessageType = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function ChatShell() {
  const [projectId] = useState<string>('local-project')
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to EngiBuddy. Tell me what you are building and I will help step-by-step.',
    },
  ])

  const [isLoading, setIsLoading] = useState(false)

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
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            sessionId: `session-${projectId}`,
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
    [messages, projectId]
  )

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <header className="border-b border-slate-700 bg-slate-900 px-6 h-16 flex items-center">
          <h1 className="text-xl font-bold text-white">EngiBuddy</h1>
        </header>
        <div className="flex-1 flex flex-col min-h-0">
          <ChatWindow messages={messages} isLoading={isLoading} />
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}