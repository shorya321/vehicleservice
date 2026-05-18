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
    <nav
      className="border-b border-[var(--graphite)] bg-[var(--black-void)]"
      role="navigation"
      aria-label={`Booking progress: Step ${currentStep} of ${steps.length}`}
    >
      <div className="luxury-container py-4">
        <ol className="flex items-center gap-0">
          {steps.map((step, index) => {
            const isCompleted = step.number < currentStep
            const isActive = step.number === currentStep

            return (
              <li
                key={step.number}
                aria-current={isActive ? 'step' : undefined}
                className="flex flex-1 flex-col"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex items-center gap-2',
                      isActive && 'pb-3 border-b border-[var(--gold)]',
                      !isActive && 'pb-3 border-b border-transparent'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[0.6875rem] font-medium tracking-[0.16em] tabular-nums',
                        isActive
                          ? 'text-[var(--gold-text)]'
                          : isCompleted
                            ? 'text-[var(--text-secondary)]'
                            : 'text-[var(--text-muted)]'
                      )}
                    >
                      {String(step.number).padStart(2, '0')}
                    </span>
                    {isCompleted && (
                      <Check
                        className="h-3 w-3 text-[var(--gold-text)]"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={cn(
                        'hidden sm:inline text-[0.75rem] font-medium tracking-[0.12em] uppercase',
                        isActive
                          ? 'text-[var(--text-primary)]'
                          : isCompleted
                            ? 'text-[var(--text-secondary)]'
                            : 'text-[var(--text-muted)]'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      aria-hidden
                      className={cn(
                        'hidden sm:block flex-1 h-px mx-3',
                        isCompleted
                          ? 'bg-[var(--graphite)]'
                          : 'bg-[var(--graphite)]'
                      )}
                    />
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
