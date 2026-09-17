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
 * The row that closes the form column: Back, on the extras step only.
 *
 * The details step renders nothing here. It had a "Nothing is charged yet" line, which the
 * summary card beside it already says in its own lock line, and a reassurance repeated on one
 * screen reads as two worries rather than one fact.
 *
 * The row carries no primary. There is exactly one "Continue to extras" on the page and it lives in
 * the summary card: the card is `lg:sticky lg:top-28`, so unlike a button at the end of a long
 * form it is on screen at every scroll position, and it sits with the price it commits to. Both
 * steps then take their primary from the same place, which is also where the terms checkbox the
 * payment step depends on lives. A second gold button 600px away made neither one read as *the*
 * button, in a design whose accent works by being scarce.
 *
 * Below `lg` the MobileStickyBar is that one place. This row is hidden there on the first step
 * and shows Back alone on the second, which mobile does need: the bar has no back, and the
 * browser's own back button leaves checkout entirely.
 */
export function WizardNavigation({
  currentStep,
  onBack,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 0

  if (isFirstStep) return null

  return (
    <div className="checkout-form-actions flex">
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
