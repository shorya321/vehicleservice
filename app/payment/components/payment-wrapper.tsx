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
      theme: 'night' as const,
      variables: {
        colorPrimary: '#C6AA88', // Luxury gold
        colorBackground: '#1A1A1A', // Luxury dark gray
        colorText: '#F5F5F5', // Luxury pearl
        colorDanger: '#ff4444',
        fontFamily: 'Montserrat, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {
          border: '1px solid rgba(198, 170, 136, 0.2)',
          height: '56px', // h-14 equivalent
          backgroundColor: 'rgba(10, 10, 10, 0.4)',
        },
        '.Input:focus': {
          border: '2px solid #C6AA88',
          boxShadow: '0 0 0 3px rgba(198, 170, 136, 0.1)',
          outline: 'none',
        },
        '.Label': {
          color: '#B0B0B0',
          fontSize: '14px',
          fontWeight: '500',
        },
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