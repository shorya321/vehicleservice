'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  currentStep: number
}

const steps = [
  { number: 1, label: 'Search' },
  { number: 2, label: 'Account' },
  { number: 3, label: 'Details' },
  { number: 4, label: 'Payment' },
]

export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div
      className="border-b border-[var(--graphite)] bg-[var(--black-void)]"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-label={`Booking progress: Step ${currentStep} of ${steps.length}`}
    >
      <span className="sr-only">
        Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.label || 'Complete'}
      </span>
      <div className="luxury-container py-5">
        <ol className="grid grid-cols-4 gap-x-4">
          {steps.map((step) => {
            const isCompleted = step.number < currentStep
            const isActive = step.number === currentStep

            return (
              <li
                key={step.number}
                aria-current={isActive ? 'step' : undefined}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 border-t border-[var(--graphite)] pt-2">
                  <span
                    className={cn(
                      'numeric text-[0.6875rem] uppercase tracking-[0.16em]',
                      isActive
                        ? 'text-[var(--gold)]'
                        : isCompleted
                          ? 'text-[var(--text-primary)]'
                          : 'text-[var(--text-muted)]'
                    )}
                  >
                    {String(step.number).padStart(2, '0')}
                  </span>
                  {isCompleted && (
                    <Check
                      className="h-3.5 w-3.5 text-[var(--gold)]"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[0.75rem] uppercase tracking-[0.16em]',
                    isActive
                      ? 'text-[var(--text-primary)]'
                      : isCompleted
                        ? 'text-[var(--text-secondary)]'
                        : 'text-[var(--text-muted)]'
                  )}
                >
                  {step.label}
                </span>
                {isActive && (
                  <span
                    aria-hidden
                    className="h-px w-full bg-[var(--gold)]"
                  />
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
