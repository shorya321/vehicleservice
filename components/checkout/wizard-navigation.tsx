'use client'

import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

interface WizardNavigationProps {
  currentStep: number
  totalSteps: number
  onBack: () => void
  onContinue: () => void
  isValidating?: boolean
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onBack,
  onContinue,
  isValidating = false,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  if (isLastStep) {
    return (
      <div className="flex justify-start pt-6">
        <button
          type="button"
          onClick={onBack}
          className="checkout-btn-secondary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="flex justify-between pt-6">
      {!isFirstStep ? (
        <button
          type="button"
          onClick={onBack}
          className="checkout-btn-secondary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
      ) : (
        <div />
      )}
      <button
        type="button"
        onClick={onContinue}
        disabled={isValidating}
        className="checkout-btn-primary"
      >
        {isValidating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Validating
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>
    </div>
  )
}
