'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Loader2, Shield, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface CheckoutFormProps {
  bookingId: string
  amount: number
  bookingNumber: string
  clientSecret?: string
}

export function CheckoutForm({ bookingId, amount, bookingNumber, clientSecret }: CheckoutFormProps) {
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
    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success?booking=${bookingId}`,
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
      // Get the payment intent from Stripe
      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret!)
      
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
      className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg overflow-hidden"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-gradient-to-br from-luxury-gold/10 to-transparent p-6 border-b border-luxury-gold/20">
        <h2 className="font-serif text-2xl md:text-3xl text-luxury-pearl flex items-center gap-2">
          <Lock className="h-6 w-6" style={{ color: "#C6AA88" }} />
          Payment Details
        </h2>
        <p className="text-sm text-luxury-lightGray mt-2">Secure payment powered by Stripe</p>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />

          {errorMessage && (
            <motion.div
              className="p-4 bg-red-950/50 border border-red-900/50 text-red-200 rounded-lg text-sm flex items-start gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-red-400">⚠</span>
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <Button
            type="submit"
            disabled={!stripe || !elements || isLoading}
            className="w-full h-14 bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black font-sans font-semibold uppercase tracking-wider transition-all duration-300 active:scale-95"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                PROCESSING PAYMENT...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" />
                PAY {formatCurrency(amount)}
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-luxury-lightGray">
            <Shield className="h-3.5 w-3.5" style={{ color: "#C6AA88" }} />
            <p>Your payment is secured by Stripe. We never store your card details.</p>
          </div>
        </form>
      </div>
    </motion.div>
  )
}