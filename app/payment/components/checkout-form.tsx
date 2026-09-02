'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import type { StripeError } from '@stripe/stripe-js'
import { Loader2, Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import { buildConfirmationUrl } from '@/lib/utils/url-builder'

function getUserFriendlyError(error: StripeError): string {
  switch (error.code) {
    case 'card_declined': return 'Your card was declined. Please try another card.'
    case 'expired_card': return 'This card has expired. Please use a different card.'
    case 'insufficient_funds': return 'Insufficient funds. Please try another card.'
    case 'incorrect_cvc': return 'Incorrect security code. Please check and try again.'
    case 'processing_error': return 'A processing error occurred. Please try again.'
    default: return error.message || 'Payment could not be completed. Please try again.'
  }
}

function PaymentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden="true">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-[rgba(var(--gold-rgb),0.06)]" />
        <div className="h-12 w-full rounded-[4px] bg-[rgba(var(--gold-rgb),0.06)]" />
      </div>
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-[rgba(var(--gold-rgb),0.06)]" />
          <div className="h-12 rounded-[4px] bg-[rgba(var(--gold-rgb),0.06)]" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-3 w-16 rounded bg-[rgba(var(--gold-rgb),0.06)]" />
          <div className="h-12 rounded-[4px] bg-[rgba(var(--gold-rgb),0.06)]" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-[rgba(var(--gold-rgb),0.06)]" />
        <div className="h-12 w-full rounded-[4px] bg-[rgba(var(--gold-rgb),0.06)]" />
      </div>
    </div>
  )
}

interface CheckoutFormProps {
  bookingId: string
  amount: number
  /** Routing key only. Drives the Stripe return_url. Never rendered. */
  bookingNumber: string
  /** Customer-facing reference. Rendered by the page heading now, not by this form. */
  tripNumber: string
}

export function CheckoutForm({ bookingId, amount, bookingNumber }: CheckoutFormProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (errorMessage && errorRef.current) {
      errorRef.current.focus()
    }
  }, [errorMessage])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${buildConfirmationUrl(bookingNumber)}`,
      },
      redirect: 'if_required',
    })

    if (submitError) {
      setErrorMessage(getUserFriendlyError(submitError))
      setIsLoading(false)
      return
    }

    try {
      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        setErrorMessage('Payment verification failed')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          bookingId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to confirm payment')
      }

      toast.success('Payment successful!')
      router.push(buildConfirmationUrl(bookingNumber))
    } catch (error) {
      setErrorMessage('Payment received but failed to update booking. Please contact support.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // Flat on the page ground under a section rule, matching the form sections on steps 3 and 4.
    // The bordered card and its "Payment Details" header bar re-introduced the header-bar card
    // pattern the direction avoids everywhere else in the funnel.
    <motion.div
      // Deliberately not `.checkout-form-section`: that class carries `contain: content`, and
      // paint containment around a third-party iframe that resizes itself over postMessage is
      // not a risk worth taking for styling it otherwise contributes nothing to here.
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="checkout-section-header">
        <h2 className="checkout-section-title">Card details</h2>
      </div>

      <div>
        {/* The centred "Amount to Pay" figure that sat here printed the total a second time in
            the same viewport, in gold at 44px, while the summary card printed it in white. The
            ledger holds the number and the Pay button restates it; a third copy was noise.
            The trip reference moved up to the page heading. */}
        <p className="flex items-center gap-1.5 text-[0.75rem] text-[var(--text-muted)] mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--gold-text)]" aria-hidden="true" />
          Processed securely by Stripe · SSL encrypted
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(!stripe || !elements) && <PaymentSkeleton />}
          <div className={!stripe || !elements ? 'sr-only' : undefined}>
            <PaymentElement
              options={{
                layout: {
                  type: 'accordion',
                  defaultCollapsed: false,
                  radios: false,
                  spacedAccordionItems: true,
                },
                paymentMethodOrder: ['card'],
              }}
            />
          </div>

          {errorMessage && (
            <motion.div
              ref={errorRef}
              tabIndex={-1}
              className="p-4 bg-[rgba(var(--destructive-rgb),0.08)] border border-[rgba(var(--destructive-rgb),0.2)] text-destructive rounded-[4px] text-sm flex items-start gap-2 outline-none"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              role="alert"
              aria-live="polite"
            >
              <span>&#9888;</span>
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={!stripe || !elements || isLoading}
            aria-busy={isLoading}
            className="checkout-btn-primary w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Pay {formatPrice(amount, currentCurrency, exchangeRates)} Securely
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  )
}
