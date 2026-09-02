'use client'

import { ArrowLeft } from 'lucide-react'

interface WizardNavigationProps {
  currentStep: number
  /** Kept on the contract so BookingForm's call site is unchanged; the row only needs to know
      whether there is a previous step. */
  totalSteps: number
  onBack: () => void
}

/**
 * Desktop-only, and Back-only.
 *
 * This row used to carry a full-width gold "Continue to extras" while OrderSummary rendered an
 * identical one in the sticky sidebar, roughly 600px away. Two primaries with the same label
 * meant neither read as *the* button, and it put two gold objects in one viewport in a design
 * whose accent depends on scarcity.
 *
 * The sidebar keeps the action: it is `lg:sticky lg:top-28`, so it is never off screen, and it
 * sits with the price it commits to. On the first step there is nothing to go back to, so this
 * renders nothing at all and the form ends on its last field.
 *
 * Below `lg` the MobileStickyBar carries the primary action and this component is hidden, so
 * mobile never had the duplicate.
 */
export function WizardNavigation({
  currentStep,
  onBack,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 0

  if (isFirstStep) return null

  return (
    <div className="hidden lg:flex justify-start pt-8">
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
