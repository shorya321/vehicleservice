'use client'

import { AlertCircle } from 'lucide-react'
import { FieldErrors } from 'react-hook-form'

interface StepErrorSummaryProps {
  errors: FieldErrors
  fieldNames: string[]
}

export function StepErrorSummary({ errors, fieldNames }: StepErrorSummaryProps) {
  const stepErrors = fieldNames
    .filter((name) => errors[name])
    .map((name) => ({
      name,
      message: (errors[name]?.message as string) || 'This field is required',
    }))

  if (stepErrors.length === 0) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-4 p-4 border border-[var(--destructive)]/40 bg-[var(--destructive)]/5 rounded"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-4 w-4 mt-0.5 text-[var(--destructive)] shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-[0.8125rem] font-medium text-[var(--destructive)]">
            Please fix {stepErrors.length} {stepErrors.length === 1 ? 'error' : 'errors'} to continue
          </p>
          <ul className="space-y-0.5">
            {stepErrors.map((err) => (
              <li key={err.name} className="text-[0.8125rem] text-[var(--text-secondary)]">
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
