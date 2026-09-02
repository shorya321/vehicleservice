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
      // `animate` is ALWAYS supplied. The `reduceMotion ? undefined` idiom looks
      // equivalent and is not: useReducedMotion() is false during SSR, so
      // opacity:0 is serialised into the markup and never animated back once
      // hydration flips the flag. Reduced motion collapses offset and duration.
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Left-aligned, so the stepper shares the rail with the heading, the section
          labels and the fields rather than being a fourth left edge. */}
      <ol
        className="flex flex-wrap items-center"
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
              {/* One type size for every step. The active one is marked by the gold
                  underline, not by growing, so the row keeps a single baseline. */}
              <div className="relative flex items-center gap-1.5 pb-2.5">
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
                      ? 'text-[var(--text-primary)]'
                      : isCompleted
                        ? 'text-[var(--text-secondary)]'
                        : 'text-[var(--text-muted)]'
                  )}
                >
                  {String(step.number).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'hidden sm:inline text-[0.75rem] tracking-[0.12em] uppercase',
                    isActive
                      ? 'font-semibold text-[var(--text-primary)]'
                      : isCompleted
                        ? 'font-medium text-[var(--text-secondary)]'
                        : 'font-medium text-[var(--text-muted)]'
                  )}
                >
                  {step.label}
                </span>

                {isActive && (
                  <motion.span
                    layoutId="checkout-step-marker"
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--gold)]"
                    aria-hidden="true"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                    }
                  />
                )}
              </div>

              {index < steps.length - 1 && (
                /* `mb-2.5` is load-bearing, not a nudge: it cancels the step's own `pb-2.5`
                   (which reserves room for the active underline), so under `items-center` the
                   rule lands exactly on the labels' optical centre. Removing it drops the
                   connector 5px. */
                <div
                  aria-hidden="true"
                  className={cn(
                    'w-8 sm:w-12 h-[1.5px] mx-2 sm:mx-3 mb-2.5',
                    isCompleted
                      ? 'bg-[rgba(var(--gold-rgb),0.4)]'
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
