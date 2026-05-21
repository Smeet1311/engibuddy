'use client'

import { Check, Lock } from 'lucide-react'

type PhaseItem = {
  id: number
  name: string
  active: boolean
  visited: boolean
  completed: boolean
}

interface PhaseStepperProps {
  phases: PhaseItem[]
  interactive?: boolean
  freeNavigation?: boolean
  activeAccent?: 'blue' | 'amber'
  onPhaseSelect?: (phaseId: number) => void
}

const PHASE_NAMES = ['Empathize', 'Conceive', 'Design', 'Implement', 'Test/Revise', 'Operate']

function phaseState(phase: PhaseItem, freeNavigation: boolean) {
  if (phase.active) return 'active'
  if (phase.completed || phase.visited || freeNavigation) return 'completed'
  return 'locked'
}

export function PhaseStepper({
  phases,
  interactive = false,
  freeNavigation = false,
  activeAccent = 'blue',
  onPhaseSelect,
}: PhaseStepperProps) {
  const normalized = PHASE_NAMES.map((name, id) => {
    const phase = phases.find((item) => item.id === id)
    return phase || { id, name, active: id === 0, visited: id === 0, completed: false }
  })

  const activeRing = activeAccent === 'amber' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Project-Based Learning Progress</h2>
      </div>

      <div className="grid grid-cols-6 items-start gap-0">
        {normalized.map((phase, index) => {
          const state = phaseState(phase, freeNavigation)
          const nextState =
            index < normalized.length - 1 ? phaseState(normalized[index + 1], freeNavigation) : 'locked'
          const connectorComplete = state === 'completed' && (nextState !== 'locked' || freeNavigation)
          const clickable = interactive && Boolean(onPhaseSelect)

          const inner = (
            <>
              {index < normalized.length - 1 && (
                <div
                  className={`absolute left-1/2 top-3 h-0.5 w-full translate-x-6 ${
                    connectorComplete ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}

              <div
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${
                  state === 'completed'
                    ? 'bg-green-500 text-white'
                    : state === 'active'
                      ? activeRing
                      : 'bg-white text-gray-400 ring-2 ring-gray-300'
                }`}
              >
                {state === 'completed' && <Check className="h-4 w-4" />}
                {state === 'active' && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
                {state === 'locked' && !freeNavigation && <Lock className="h-3.5 w-3.5" />}
                {state === 'locked' && freeNavigation && <span className="h-2 w-2 rounded-full bg-gray-300" />}
              </div>

              <p
                className={`mt-3 text-center text-xs ${
                  state === 'locked' && !freeNavigation
                    ? 'text-gray-400'
                    : state === 'active'
                      ? 'font-semibold text-gray-900'
                      : 'text-gray-700'
                }`}
              >
                {phase.id}. {PHASE_NAMES[phase.id]}
              </p>
            </>
          )

          if (clickable) {
            return (
              <button
                key={phase.id}
                type="button"
                onClick={() => onPhaseSelect?.(phase.id)}
                className="relative flex cursor-pointer flex-col items-center border-0 bg-transparent p-0"
              >
                {inner}
              </button>
            )
          }

          return (
            <div key={phase.id} className="relative flex flex-col items-center">
              {inner}
            </div>
          )
        })}
      </div>
    </div>
  )
}
