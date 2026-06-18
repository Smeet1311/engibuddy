'use client'

type Classification = {
  phase: number
  phase_name: string
  confidence: number
  transition?: 'stay' | 'advance' | 'retreat'
  reason?: string
}

interface RagBarProps {
  classification: Classification | null
  ragSources: string[]
  ragProvider: string
  ragPreview: string
  showRagDebug: boolean
  promptVersion: string | null
  onToggleRagDebug: () => void
  onClose?: () => void
}

function truncate(value: string, maxLength = 80) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 3)}...`
}

function providerLabel(provider: string) {
  if (provider.startsWith('vector:')) {
    return provider.replace('vector:', '')
  }

  return provider
}

export function RagBar({
  classification,
  ragSources,
  ragProvider,
  ragPreview,
  showRagDebug,
  promptVersion,
  onToggleRagDebug,
  onClose,
}: RagBarProps) {
  const transition = classification?.transition || 'stay'
  const reason = truncate(classification?.reason || 'Waiting for phase intelligence.')
  const confidence = Math.round((classification?.confidence || 0) * 100)
  const transitionLabel =
    transition === 'advance'
      ? 'You are moving to the next phase'
      : transition === 'retreat'
        ? 'You are revisiting an earlier phase'
        : 'You are staying in the same phase'

  return (
    <div className="relative border-b border-slate-800 bg-[#111827] px-4 py-2 text-xs text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-slate-300">
          <span>{transitionLabel}</span>
          <span className="px-2 text-slate-500">|</span>
          <span>Why: {reason}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-100">
            Phase: {classification?.phase_name || 'Empathize'}
          </span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-100">
            Confidence: {confidence}%
          </span>
          {promptVersion && (
            <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-100">
              Prompt {promptVersion}
            </span>
          )}
          <span className="text-slate-300">Knowledge used:</span>
          {ragSources.length > 0 ? (
            ragSources.map((source) => (
              <span key={source} className="rounded-full bg-slate-800 px-3 py-1 text-slate-100">
                {source}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-100">none</span>
          )}
          {ragPreview && (
            <button
              type="button"
              onClick={onToggleRagDebug}
              className="rounded-full bg-slate-800 px-3 py-1 text-slate-100 hover:bg-slate-700"
            >
              {showRagDebug ? 'Hide RAG debug' : 'Show RAG debug'}
            </button>
          )}
          {ragProvider && (
            <span className="rounded-full bg-green-600 px-3 py-1 font-semibold text-white">
              Vector RAG active: {providerLabel(ragProvider)}
            </span>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-2 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Hide this debug bar (Press Ctrl+Shift+D to show again)"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {showRagDebug && ragPreview && (
        <div className="mt-2 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs leading-relaxed text-slate-200">
          {ragPreview}
        </div>
      )}
    </div>
  )
}
