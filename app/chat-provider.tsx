'use client'

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  status?: 'error'
  timestamp: string
}

export type ReviewPoint = {
  id: string
  label: string
  completed: boolean
  evidence: string
}

export type ReviewPhase = {
  id: number
  name: string
  points: ReviewPoint[]
  completed: boolean
  completedCount: number
  totalCount: number
}

export type ReviewProgress = {
  phases: ReviewPhase[]
  summary: {
    completedPoints: number
    totalPoints: number
    percent: number
  }
}

type ModeStream = {
  messages: ChatMessage[]
  isLoading: boolean
  showTypingIndicator: boolean
}

type ChatContextType = {
  guidance: ModeStream
  review: ModeStream
  setGuidanceMessages: Dispatch<SetStateAction<ChatMessage[]>>
  setReviewMessages: Dispatch<SetStateAction<ChatMessage[]>>
  setGuidanceLoading: Dispatch<SetStateAction<boolean>>
  setReviewLoading: Dispatch<SetStateAction<boolean>>
  setGuidanceTyping: Dispatch<SetStateAction<boolean>>
  setReviewTyping: Dispatch<SetStateAction<boolean>>
  reviewProgress: ReviewProgress | null
  setReviewProgress: Dispatch<SetStateAction<ReviewProgress | null>>
}

const ChatContext = createContext<ChatContextType | null>(null)

function now() {
  const d = new Date()
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`
}

const GUIDANCE_WELCOME: ChatMessage = {
  id: 'welcome-guidance',
  role: 'assistant',
  content: 'Welcome to EngiBuddy. Tell me what you are building and I will help step-by-step.',
  timestamp: now(),
}

const REVIEW_WELCOME: ChatMessage = {
  id: 'welcome-review',
  role: 'assistant',
  content: 'Review Mode is ready. Ask what is complete, what is missing, or how to finish the current phase.',
  timestamp: now(),
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [guidanceMessages, setGuidanceMessages] = useState<ChatMessage[]>([GUIDANCE_WELCOME])
  const [guidanceLoading, setGuidanceLoading] = useState(false)
  const [guidanceTyping, setGuidanceTyping] = useState(false)

  const [reviewMessages, setReviewMessages] = useState<ChatMessage[]>([REVIEW_WELCOME])
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewTyping, setReviewTyping] = useState(false)

  // reviewProgress lives here so it survives Guidance ↔ Review navigation
  // without resetting to null on every route remount.
  const [reviewProgress, setReviewProgress] = useState<ReviewProgress | null>(null)

  return (
    <ChatContext.Provider
      value={{
        guidance: { messages: guidanceMessages, isLoading: guidanceLoading, showTypingIndicator: guidanceTyping },
        review:   { messages: reviewMessages,   isLoading: reviewLoading,   showTypingIndicator: reviewTyping },
        setGuidanceMessages,
        setReviewMessages,
        setGuidanceLoading,
        setReviewLoading,
        setGuidanceTyping,
        setReviewTyping,
        reviewProgress,
        setReviewProgress,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider')
  return ctx
}
