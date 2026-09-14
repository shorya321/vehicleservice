'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
  /** Where "Back to vehicles" goes. Built server-side so a direct arrival, which has no
      history to pop, still lands on the right search results. */
  changeHref: string
}

export function CheckoutStepHeader({ currentStep, changeHref }: CheckoutStepHeaderProps) {
  const copy = COPY[currentStep] ?? COPY[0]

  return (
    <>
      <Link href={changeHref} className="editorial-action">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to vehicles
      </Link>

      <ProgressBar currentStep={toFunnelStep(currentStep)} />

      <div className="mt-8">
        <CheckoutHeading title={copy.title} subtitle={copy.subtitle} />
      </div>
    </>
  )
}

CheckoutStepHeader.displayName = 'CheckoutStepHeader'
