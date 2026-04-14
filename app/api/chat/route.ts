import { NextRequest, NextResponse } from 'next/server'
import { ENGIBUDDY_SYSTEM_PROMPT } from '@/lib/prompts/engibuddy-system-prompt'
type IncomingMessage = { role: 'user' | 'assistant'; content: string }

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      userMessage?: string
      conversationHistory?: IncomingMessage[]
    }
    const userMessage = body.userMessage?.trim()
    if (!userMessage) {
      return NextResponse.json({ error: 'Missing userMessage' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim()
    const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/$/, '')
    const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not set' }, { status: 500 })
    }

    const history: IncomingMessage[] = (body.conversationHistory || [])
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-12)

    const messages = [
      {
        role: 'system',
        content: ENGIBUDDY_SYSTEM_PROMPT,
      },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ]

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.6,
        max_tokens: 1024,
      }),
    })

    const raw = await response.text()
    if (!response.ok) {
      return NextResponse.json(
        { error: `LLM request failed (${response.status})`, details: raw.slice(0, 400) },
        { status: 500 }
      )
    }

    const data = JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> }
    const assistantMessage = data.choices?.[0]?.message?.content?.trim() || 'No response returned.'

    return NextResponse.json({ assistantMessage })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
