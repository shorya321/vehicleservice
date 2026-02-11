'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Loader2, Shield, Lock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import { AcceptedCards } from './accepted-cards'

interface CheckoutFormProps {
  bookingId: string
  amount: number
  bookingNumber: string
  clientSecret?: string
}

export function CheckoutForm({ bookingId, amount, bookingNumber, clientSecret }: CheckoutFormProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    // Confirm payment with Stripe
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/confirmation?booking=${bookingNumber}`,
      },
      redirect: 'if_required',
    })

    if (submitError) {
      // Show error to customer
      setErrorMessage(submitError.message || 'Payment failed')
      setIsLoading(false)
      return
    }

    // Payment succeeded, confirm with backend
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

      // Success! Redirect to confirmation page
      toast.success('Payment successful!')
      router.push(`/booking/confirmation?booking=${bookingNumber}`)
    } catch (error) {
      console.error('Error confirming payment:', error)
      setErrorMessage('Payment received but failed to update booking. Please contact support.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="relative bg-gradient-to-br from-[rgba(22,21,20,0.95)] to-[rgba(15,14,13,0.98)] border border-[rgba(198,170,136,0.15)] rounded-[20px] overflow-hidden hover:border-[rgba(198,170,136,0.25)] transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Corner Accents */}
      <div className="absolute top-4 left-4 w-[60px] h-[60px] border-l border-t border-[rgba(198,170,136,0.15)] pointer-events-none z-10" />
      <div className="absolute bottom-4 right-4 w-[60px] h-[60px] border-r border-b border-[rgba(198,170,136,0.15)] pointer-events-none z-10" />

      {/* Payment Header */}
      <div className="flex items-center gap-4 px-6 py-5 md:px-8 bg-gradient-to-r from-[rgba(198,170,136,0.1)] to-transparent border-b border-[rgba(198,170,136,0.1)]">
        <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#c6aa88] to-[#a68b5b] rounded-xl flex-shrink-0">
          <svg className="w-6 h-6 stroke-[#050506]" viewBox="0 0 24 24" fill="none" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>
        <div>
          <h2 className="font-serif text-2xl text-[#f8f6f3]">Payment Details</h2>
          <p className="text-sm text-[#7a7672]">Powered by Stripe</p>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Security Banner */}
        <div className="flex items-center gap-4 px-4 py-3 mb-6 bg-[rgba(74,222,128,0.08)] border border-[rgba(74,222,128,0.2)] rounded-xl">
          <div className="w-10 h-10 flex items-center justify-center bg-[rgba(74,222,128,0.15)] rounded-lg flex-shrink-0">
            <Shield className="w-5 h-5 stroke-[#4ade80]" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-[#4ade80] mb-0.5">256-bit SSL Encryption</h4>
            <p className="text-xs text-[#7a7672]">Your payment information is protected with bank-level security</p>
          </div>
        </div>

        {/* Payment Amount Display */}
        <div className="flex flex-col items-center justify-center py-6 px-5 mb-6 bg-[rgba(198,170,136,0.05)] border border-[rgba(198,170,136,0.15)] rounded-2xl">
          <p className="text-xs font-medium tracking-[0.1em] uppercase text-[#7a7672] mb-2">Amount to Pay</p>
          <p className="font-serif text-4xl md:text-5xl font-normal bg-gradient-to-r from-[#e8d9c5] via-[#c6aa88] to-[#8b7349] bg-clip-text text-transparent">
            {formatPrice(amount, currentCurrency, exchangeRates)}
          </p>
          <span className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[rgba(42,40,38,0.5)] rounded-md text-[0.8125rem] text-[#b8b4ae]">
            Booking: <code className="font-mono text-[#c6aa88]">{bookingNumber}</code>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Element */}
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
              className="p-4 bg-[rgba(248,113,113,0.15)] border border-[rgba(248,113,113,0.3)] text-[#f87171] rounded-xl text-sm flex items-start gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-[#f87171]">⚠</span>
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Pay Button */}
          <Button
            type="submit"
            disabled={!stripe || !elements || isLoading}
            className="relative w-full h-14 bg-gradient-to-r from-[#c6aa88] to-[#a68b5b] hover:from-[#d4c4a8] hover:to-[#b89b6a] text-[#050506] font-semibold text-[0.9375rem] tracking-[0.1em] uppercase rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-10px_rgba(198,170,136,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group"
            size="lg"
          >
            {/* Shine effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />

            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" />
                Pay {formatPrice(amount, currentCurrency, exchangeRates)} Securely
              </>
            )}
          </Button>

          {/* Trust Indicators */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 pt-4 border-t border-[rgba(198,170,136,0.1)]">
            <span className="flex items-center gap-1.5 text-[0.6875rem] text-[#7a7672]">
              <Lock className="w-3.5 h-3.5 stroke-[#c6aa88]" />
              SSL Encrypted
            </span>
            <span className="flex items-center gap-1.5 text-[0.6875rem] text-[#7a7672]">
              <Shield className="w-3.5 h-3.5 stroke-[#c6aa88]" />
              PCI Compliant
            </span>
            <span className="flex items-center gap-1.5 text-[0.6875rem] text-[#7a7672]">
              <CheckCircle className="w-3.5 h-3.5 stroke-[#c6aa88]" />
              Money-Back Guarantee
            </span>
          </div>

          {/* Accepted Cards */}
          <AcceptedCards />
        </form>
      </div>
    </motion.div>
  )
}
