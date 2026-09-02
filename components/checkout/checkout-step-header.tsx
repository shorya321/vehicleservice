'use client'

import { ProgressBar } from './progress-bar'
import { CheckoutHeading } from './checkout-heading'

/**
 * Wizard step (0-based, this page) -> funnel step (1-based, the whole flow).
 *
 * 01 Search and 02 Account are earlier pages. 03 Details and 04 Payment both live here,
 * which is why the funnel step is the wizard step plus three.
 *
 * This mapping previously did not exist: the server page hardcoded `currentStep={3}`, so
 * the indicator never advanced when the wizard moved to its second step.
 */
export const toFunnelStep = (wizardStep: number) => wizardStep + 3

/** Copy per wizard step, so the heading describes the step you are actually on. */
const COPY = [
  {
    title: 'Complete your booking',
    subtitle:
      'Confirm your passenger details and add any extras. The price is fixed at booking and free to cancel up to 24 hours before pickup.',
  },
  {
    title: 'Extras and payment',
    subtitle:
      'Add anything you need for the journey, then choose how you would like to pay. You are not charged until the next step.',
  },
] as const

interface CheckoutStepHeaderProps {
  currentStep: number
}

export function CheckoutStepHeader({ currentStep }: CheckoutStepHeaderProps) {
  const copy = COPY[currentStep] ?? COPY[0]

  return (
    <>
      <ProgressBar currentStep={toFunnelStep(currentStep)} />
      <CheckoutHeading title={copy.title} subtitle={copy.subtitle} />
    </>
  )
}

CheckoutStepHeader.displayName = 'CheckoutStepHeader'
