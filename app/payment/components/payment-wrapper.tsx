'use client'

import { Elements } from '@stripe/react-stripe-js'
import { CheckoutForm } from './checkout-form'
import { stripePromise } from '@/lib/stripe/client'

interface PaymentWrapperProps {
  clientSecret: string
  bookingId: string
  amount: number
  bookingNumber: string
}

export function PaymentWrapper({ 
  clientSecret, 
  bookingId, 
  amount, 
  bookingNumber 
}: PaymentWrapperProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0ea5e9',
      },
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm 
        bookingId={bookingId}
        amount={amount}
        bookingNumber={bookingNumber}
        clientSecret={clientSecret}
      />
    </Elements>
  )
}