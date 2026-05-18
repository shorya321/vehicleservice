'use client'

import { UseFormReturn } from 'react-hook-form'
import { CreditCard, Shield } from 'lucide-react'

interface PaymentMethodSectionProps {
  form: UseFormReturn<any>
}

export function PaymentMethodSection({ form: _form }: PaymentMethodSectionProps) {
  return (
    <div className="checkout-form-section">
      <div className="checkout-section-header">
        <h2 className="checkout-section-title">Payment Method</h2>
      </div>

      <div className="checkout-section-content">
        <div className="checkout-payment-method selected">
          <div className="checkout-payment-radio" aria-hidden="true">
            <div className="checkout-payment-radio-inner" />
          </div>
          <div className="checkout-payment-icon">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="checkout-payment-info">
            <p className="checkout-payment-name">Credit / Debit Card</p>
            <p className="checkout-payment-description">Visa, Mastercard, Amex accepted</p>
          </div>
        </div>

        <p className="mt-3 text-[0.75rem] text-[var(--text-muted)]">
          Additional payment methods coming soon.
        </p>

        <div className="mt-5 flex gap-3 p-3.5 bg-[var(--black-warm)] border border-[rgba(var(--gold-rgb),0.1)] rounded">
          <Shield className="h-4 w-4 mt-0.5 text-[var(--gold-text)] shrink-0" aria-hidden="true" />
          <div className="text-sm">
            <p className="text-[var(--text-secondary)]">
              All transactions are encrypted and processed securely via Stripe.
              Your card details are never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

PaymentMethodSection.displayName = 'PaymentMethodSection'
