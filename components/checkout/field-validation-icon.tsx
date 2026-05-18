'use client'

import { Check, AlertCircle } from 'lucide-react'

interface FieldValidationIconProps {
  isValid: boolean
  hasError: boolean
  isTouched: boolean
}

export function FieldValidationIcon({
  isValid,
  hasError,
  isTouched,
}: FieldValidationIconProps) {
  if (!isTouched) return null

  if (hasError) {
    return (
      <AlertCircle
        className="h-4 w-4 text-[var(--destructive)] shrink-0"
        aria-hidden="true"
      />
    )
  }

  if (isValid) {
    return (
      <Check
        className="h-4 w-4 text-emerald-500 shrink-0"
        aria-hidden="true"
      />
    )
  }

  return null
}
