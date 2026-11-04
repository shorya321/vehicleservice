'use client'

import { useEffect, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { FieldErrors } from 'react-hook-form'

interface StepErrorSummaryProps {
  errors: FieldErrors
  fieldNames: string[]
  /**
   * Bumped by the form on every rejected Continue or submit. Each bump brings the summary
   * into view and moves focus to it: the Continue button lives in the summary card, often a
   * long way below these fields, so without this a failed press looks like nothing happened.
   */
  focusSignal?: number
  /** Jumps to the field behind an error. */
  onSelectField?: (name: string) => void
}

export function StepErrorSummary({ errors, fieldNames, focusSignal = 0, onSelectField }: StepErrorSummaryProps) {
  const reduceMotion = useReducedMotion()
  const boxRef = useRef<HTMLDivElement>(null)

  const stepErrors = fieldNames
    .filter((name) => errors[name])
    .map((name) => ({
      name,
      message: (errors[name]?.message as string) || 'This field is required',
    }))
  const hasErrors = stepErrors.length > 0

  useEffect(() => {
    if (focusSignal === 0 || !hasErrors) return
    // One frame, so the box exists and the step transition has laid it out.
    const frame = requestAnimationFrame(() => {
      const box = boxRef.current
      if (!box) return
      box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
      box.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
    // Only a new attempt moves the page; fixing one error must not drag it back up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignal])

  if (!hasErrors) return null

  return (
    <motion.div
      // `animate` is ALWAYS supplied. The `reduceMotion ? undefined` idiom looks
      // equivalent and is not: useReducedMotion() is false during SSR, so
      // opacity:0 is serialised into the markup and never animated back once
      // hydration flips the flag. Reduced motion collapses offset and duration.
      initial={{ opacity: 0, y: reduceMotion ? 0 : -8, scaleY: reduceMotion ? 1 : 0.96 }}
      animate={{ opacity: 1, y: 0, scaleY: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformOrigin: 'top' }}
    >
      <div
        ref={boxRef}
        role="alert"
        aria-live="assertive"
        aria-labelledby="step-error-summary-title"
        tabIndex={-1}
        // Clears the fixed site header (about 95px) when scrolled to.
        className="mb-4 p-4 border border-destructive/40 bg-destructive/5 rounded scroll-mt-28 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p id="step-error-summary-title" className="text-[0.8125rem] font-medium text-destructive">
              Please fix {stepErrors.length} {stepErrors.length === 1 ? 'error' : 'errors'} to continue
            </p>
            <ul className="space-y-0.5">
              {stepErrors.map((err) => (
                <li key={err.name} className="text-[0.8125rem] text-[var(--text-secondary)]">
                  {onSelectField ? (
                    <button
                      type="button"
                      onClick={() => onSelectField(err.name)}
                      className="text-left underline underline-offset-2 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] rounded-sm"
                    >
                      {err.message}
                    </button>
                  ) : (
                    err.message
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
