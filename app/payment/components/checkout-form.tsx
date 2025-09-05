'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
          
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            disabled={!stripe || !elements || isLoading}
            className="w-full mt-6"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Your payment is secured by Stripe. We never store your card details.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}