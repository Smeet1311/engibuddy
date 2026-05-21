'use client'

import { FileUp, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'

type ReviewUploadProps = {
  isAnalyzing: boolean
  onAnalyze: (file: File, content: string) => Promise<void>
}

const ACCEPTED = '.txt,.md,.markdown'

export function ReviewUpload({ isAnalyzing, onAnalyze }: ReviewUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File | null) => {
    if (!file) return
    setError(null)
    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.txt') && !lower.endsWith('.md') && !lower.endsWith('.markdown')) {
      setError('For now, upload .txt or .md files only.')
      return
    }
    setFileName(file.name)
    try {
      const content = await file.text()
      if (!content.trim()) {
        setError('File is empty.')
        return
      }
      await onAnalyze(file, content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-amber-300 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Upload your work</p>
      <p className="mt-1 text-sm text-slate-600">
        Add your phase document (.txt or .md). EngiBuddy will check it against the rubric.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        disabled={isAnalyzing}
        onClick={() => inputRef.current?.click()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <FileUp className="h-4 w-4" />
            Choose file
          </>
        )}
      </button>

      {fileName && !error && (
        <p className="mt-2 truncate text-xs text-slate-500">Last file: {fileName}</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
