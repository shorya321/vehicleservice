'use client'

import { Check } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
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
  const safeStep = Math.max(1, Math.min(currentStep, steps.length))
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="mb-12"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <ol
        className="flex items-center justify-center"
        role="list"
        aria-label={`Booking progress: Step ${safeStep} of ${steps.length}`}
      >
        {steps.map((step, index) => {
          const isCompleted = step.number < safeStep
          const isActive = step.number === safeStep

          return (
            <li
              key={step.number}
              aria-current={isActive ? 'step' : undefined}
              className="flex items-center"
            >
              <div className="flex items-center gap-1.5">
                {isCompleted && (
                  <Check
                    className="h-3 w-3 text-[var(--gold-text)] shrink-0"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    'text-[0.6875rem] font-medium tracking-[0.14em] tabular-nums',
                    isActive
                      ? 'text-[var(--gold-text)]'
                      : isCompleted
                        ? 'text-[var(--text-secondary)]'
                        : 'text-[var(--text-muted)]'
                  )}
                >
                  {String(step.number).padStart(2, '0')}
                </span>
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
                  aria-hidden="true"
                  className={cn(
                    'w-8 sm:w-12 h-px mx-2 sm:mx-3',
                    isCompleted
                      ? 'bg-[rgba(var(--gold-rgb),0.3)]'
                      : 'bg-[var(--graphite)]'
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </motion.div>
  )
}
