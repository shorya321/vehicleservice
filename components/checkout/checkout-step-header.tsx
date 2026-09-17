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
      'Two things left: confirm who is travelling and how to reach you. The fare is fixed at booking.',
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
  /** Steps back inside the wizard. Supplied from the second step onwards. */
  onBack?: () => void
}

export function CheckoutStepHeader({ currentStep, changeHref, onBack }: CheckoutStepHeaderProps) {
  const copy = COPY[currentStep] ?? COPY[0]

  return (
    <>
      {/* On the extras step this is the only way back to the passenger details on a phone: the
          form's own Back row is below a long list of addons, and the browser's back button
          leaves checkout entirely, since the wizard is one route. Leaving for the search
          results from here would also skip the step in between, so the link goes one step,
          not two. */}
      {currentStep > 0 && onBack ? (
        <button type="button" onClick={onBack} className="editorial-action">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to details
        </button>
      ) : (
        <Link href={changeHref} className="editorial-action">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to vehicles
        </Link>
      )}

      <ProgressBar currentStep={toFunnelStep(currentStep)} />

      <div className="mt-8">
        {/* No eyebrow: the step rail directly above already names the step, and "Secure
            checkout" over a step called Details was the same sentence twice. */}
        <CheckoutHeading eyebrow={null} title={copy.title} subtitle={copy.subtitle} />
      </div>
    </>
  )
}

CheckoutStepHeader.displayName = 'CheckoutStepHeader'
