'use client'

import { UseFormReturn } from 'react-hook-form'
import { CreditCard } from 'lucide-react'

interface PaymentMethodSectionProps {
  form: UseFormReturn<any>
}

/** The marks the gateway accepts. Stated, not selectable. */
const ACCEPTED = ['Visa', 'Mastercard', 'Amex'] as const

/**
 * `form` stays on the contract and stays unused: `paymentMethod` is seeded to 'card' in
 * BookingForm's defaultValues and there is nothing here that could change it. STEP_FIELDS[1]
 * still gates on the field, so the zod enum keeps validating exactly as before.
 */
export function PaymentMethodSection({ form: _form }: PaymentMethodSectionProps) {
  return (
    <div className="checkout-form-section">
      <div className="checkout-section-header">
        <h2 className="checkout-section-title">Payment method</h2>
      </div>

      <div className="checkout-section-content">
        {/* This was a radio group with exactly one option, which is not a choice, followed by
            "Additional payment methods coming soon." — a roadmap note on the screen where
            someone decides to trust the business with a card. It states a fact instead.

            The Stripe reassurance panel that sat below it is gone too: the summary card's lock
            line and the payment step both already say it, which made three security messages
            across two screens. Repeating a reassurance is how you turn it into a worry. */}
        <div className="checkout-payment-method checkout-payment-method--static">
          <div className="checkout-payment-icon">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="checkout-payment-info">
            <p className="checkout-payment-name">Card</p>
            <p className="checkout-payment-description">
              You enter your card details on the next step.
            </p>
          </div>
          <div className="checkout-payment-marks" aria-label="Accepted cards">
            {ACCEPTED.map((brand) => (
              <span key={brand} className="checkout-payment-mark">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

PaymentMethodSection.displayName = 'PaymentMethodSection'
