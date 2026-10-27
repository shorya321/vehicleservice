import { HeroMap } from '@/components/home/hero/hero-map'
import { CustomerAuthChips } from '@/components/auth/customer-auth-panel'
import type { CheckoutBookingSummary } from '../booking-summary'
import { CheckoutAuthForm } from './checkout-auth-form'
import { CheckoutTicket, hasTicketContent } from './checkout-ticket'

interface CheckoutLoginContentProps {
  returnUrl: string
  summary: CheckoutBookingSummary
}

const STEPS = ['Sign in', 'Passenger details', 'Pay and confirm'] as const

/**
 * Checkout sign-in: the customer auth split screen under the site header.
 * Left, the booking being finished on the home map; right, the same sign-in
 * card as /login. The form itself still returns to `returnUrl` as before.
 */
export function CheckoutLoginContent({ returnUrl, summary }: CheckoutLoginContentProps): React.JSX.Element {
  const showTicket = hasTicketContent(summary)

  return (
    <div className="cauth-page cauth-page--header">
      <aside aria-label="Your booking" className="cauth-panel">
        <div className="cauth-panel-map" aria-hidden="true">
          <HeroMap centreFade={false} />
          <div className="cauth-panel-wash" />
        </div>

        <div className="cauth-panel-inner">
          <div className="cauth-panel-top" aria-hidden="true" />

          <div className="cauth-panel-mid">
            <div className="editorial-eyebrow editorial-eyebrow--pill cauth-panel-eyebrow">
              <i aria-hidden="true" />
              Secure checkout
            </div>
            <h2 className="cauth-panel-title">
              One step from your <em>chauffeur.</em>
            </h2>
            <p className="cauth-panel-body">
              {showTicket
                ? 'Your route, car and time are kept while you sign in.'
                : 'Sign in or create an account and you go straight back to your booking.'}
            </p>

            {showTicket && <CheckoutTicket summary={summary} />}

            <ol className="ckl-steps" aria-label="Booking steps">
              {STEPS.map((step, i) => (
                <li key={step} aria-current={i === 0 ? 'step' : undefined}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="cauth-panel-bottom">
            <CustomerAuthChips />
          </div>
        </div>
      </aside>

      <section className="cauth-main">
        <div className="cauth-form-wrap">
          <div className="cauth-col">
            <CheckoutAuthForm
              returnUrl={returnUrl}
              summary={showTicket ? <div className="ckl-mobile-ticket"><CheckoutTicket summary={summary} compact /></div> : null}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
