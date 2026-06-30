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
  bookingNumber: string
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
    <motion.div
      className="bg-[var(--black-rich)] border border-[rgba(var(--gold-rgb),0.12)] rounded-[8px] overflow-hidden"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 xl:px-8 py-5 border-b border-[rgba(var(--gold-rgb),0.1)]">
        <Lock className="w-4 h-4 text-[var(--gold-text)] flex-shrink-0" aria-hidden="true" />
        <h2 className="text-[1.25rem] font-semibold text-[var(--text-primary)]">Payment Details</h2>
      </div>

      <div className="px-6 xl:px-8 py-6">
        {/* Amount Display */}
        <div className="flex flex-col items-center justify-center py-6 px-5 mb-6 bg-[rgba(var(--gold-rgb),0.04)]">
          <p className="t-label mb-2">Amount to Pay</p>
          <p className="text-[2.25rem] sm:text-[2.75rem] font-semibold tabular-nums tracking-tight text-[var(--gold-text)]">
            {formatPrice(amount, currentCurrency, exchangeRates)}
          </p>
          <span className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-[var(--black-warm)] rounded-[4px] text-[0.8125rem] text-[var(--text-secondary)] max-w-full">
            Booking: <code className="font-mono text-[var(--gold-text)] truncate">{bookingNumber}</code>
          </span>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[0.75rem] text-[var(--text-muted)] mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" aria-hidden="true" />
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
