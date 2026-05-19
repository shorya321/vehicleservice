'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import { buildConfirmationUrl } from '@/lib/utils/url-builder'

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
      setErrorMessage(submitError.message || 'Payment failed')
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
      console.error('Error confirming payment:', error)
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
        <Lock className="w-4 h-4 text-[var(--gold-text)] flex-shrink-0" />
        <h2 className="text-[1.125rem] font-medium text-[var(--text-primary)]">Payment Details</h2>
      </div>

      <div className="px-6 xl:px-8 py-6">
        {/* Amount Display */}
        <div className="flex flex-col items-center justify-center py-5 px-5 mb-6 bg-[rgba(var(--gold-rgb),0.03)] border border-[rgba(var(--gold-rgb),0.1)] rounded-[4px]">
          <p className="t-label mb-2">Amount to Pay</p>
          <p className="t-price text-[var(--gold)]">
            {formatPrice(amount, currentCurrency, exchangeRates)}
          </p>
          <span className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-[var(--black-warm)] rounded-[4px] text-[0.8125rem] text-[var(--text-secondary)]">
            Booking: <code className="font-mono text-[var(--gold-text)]">{bookingNumber}</code>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {errorMessage && (
            <motion.div
              className="p-4 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-destructive rounded-[4px] text-sm flex items-start gap-2"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
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
