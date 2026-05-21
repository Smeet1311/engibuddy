'use client'

type ReviewGateDialogProps = {
  open: boolean
  missingLabels: string[]
  targetPhaseName: string
  onStay: () => void
  onProceed: () => void
}

export function ReviewGateDialog({
  open,
  missingLabels,
  targetPhaseName,
  onStay,
  onProceed,
}: ReviewGateDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Open checklist items</h3>
        <p className="mt-2 text-sm text-slate-600">
          You still have incomplete rubric items in your current phase. You can finish them first or
          continue to <span className="font-medium">{targetPhaseName}</span> anyway.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-amber-900">
          {missingLabels.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onStay}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to checklist
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            I understand, continue
          </button>
        </div>
      </div>
    </div>
  )
}
