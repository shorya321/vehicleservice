import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { CheckoutBookingSummary } from '../booking-summary'
import { CheckoutAuthForm } from './checkout-auth-form'
import { CheckoutTicket, CheckoutTripLine, hasTicketContent } from './checkout-ticket'

interface CheckoutLoginContentProps {
  returnUrl: string
  summary: CheckoutBookingSummary
}

const STEPS = ['Sign in', 'Passenger details', 'Pay and confirm'] as const

/** The three booking steps, shown once, in a thin rail under the site header. */
function CheckoutProgress(): React.JSX.Element {
  return (
    <div className="ckl-rail">
      <div className="ckl-rail-in">
        <Link href="/" className="ckl-rail-back">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to search
        </Link>
        <ol className="ckl-steps" aria-label="Booking steps">
          {STEPS.map((step, i) => (
            <li key={step} aria-current={i === 0 ? 'step' : undefined}>
              <span>{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <p className="ckl-steps-short" aria-hidden="true">
          Step <strong>1</strong> of {STEPS.length} · {STEPS[0]}
        </p>
      </div>
    </div>
  )
}

/**
 * Checkout sign-in under the site header: the form on the left and the
 * booking being finished on the right, the way the checkout page that comes
 * next is laid out. Below the desktop breakpoint the booking folds into one
 * line above the form. The form itself still returns to `returnUrl` as before.
 */
export function CheckoutLoginContent({ returnUrl, summary }: CheckoutLoginContentProps): React.JSX.Element {
  const showTicket = hasTicketContent(summary)

  return (
    <div className="ckl-page">
      <CheckoutProgress />

      <div className="ckl-body">
        <div className={showTicket ? 'ckl-grid' : 'ckl-grid ckl-grid--solo'}>
          <section className="ckl-form-col">
            {showTicket && (
              <div className="ckl-mobile-ticket">
                <CheckoutTripLine summary={summary} />
              </div>
            )}
            <CheckoutAuthForm returnUrl={returnUrl} showTrust={!showTicket} />
          </section>

          {showTicket && (
            <aside aria-label="Your booking" className="ckl-summary-col">
              <CheckoutTicket summary={summary} />
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
