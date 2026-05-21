'use client'

type DebtItem = {
  phaseId: number
  phaseName: string
  missingCount: number
}

type ReviewDebtBannerProps = {
  debts: DebtItem[]
  onGoToPhase: (phaseId: number) => void
}

export function ReviewDebtBanner({ debts, onGoToPhase }: ReviewDebtBannerProps) {
  if (debts.length === 0) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-950">
      <span className="font-medium">Reminder:</span>{' '}
      {debts.map((debt, index) => (
        <span key={debt.phaseId}>
          {index > 0 && ' · '}
          <button
            type="button"
            onClick={() => onGoToPhase(debt.phaseId)}
            className="font-medium underline underline-offset-2 hover:text-amber-800"
          >
            {debt.phaseName}: {debt.missingCount} open
          </button>
        </span>
      ))}
    </div>
  )
}
