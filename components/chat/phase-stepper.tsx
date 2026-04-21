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
}

const PHASE_NAMES = ['Empathize', 'Conceive', 'Design', 'Implement', 'Test/Revise', 'Operate']

function phaseState(phase: PhaseItem) {
  if (phase.active) {
    return 'active'
  }

  if (phase.completed || phase.visited) {
    return 'completed'
  }

  return 'locked'
}

export function PhaseStepper({ phases }: PhaseStepperProps) {
  const normalized = PHASE_NAMES.map((name, id) => {
    const phase = phases.find((item) => item.id === id)
    return phase || { id, name, active: id === 0, visited: id === 0, completed: false }
  })

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Project-Based Learning Progress</h2>
      </div>

      <div className="grid grid-cols-6 items-start gap-0">
        {normalized.map((phase, index) => {
          const state = phaseState(phase)
          const nextState = index < normalized.length - 1 ? phaseState(normalized[index + 1]) : 'locked'
          const connectorComplete = state === 'completed' && nextState !== 'locked'

          return (
            <div key={phase.id} className="relative flex flex-col items-center">
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-400 ring-2 ring-gray-300'
                }`}
              >
                {state === 'completed' && <Check className="h-4 w-4" />}
                {state === 'active' && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
                {state === 'locked' && <Lock className="h-3.5 w-3.5" />}
              </div>

              <p
                className={`mt-3 text-center text-xs ${
                  state === 'locked' ? 'text-gray-400' : state === 'active' ? 'font-semibold text-gray-900' : 'text-gray-700'
                }`}
              >
                {phase.id}. {PHASE_NAMES[phase.id]}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
