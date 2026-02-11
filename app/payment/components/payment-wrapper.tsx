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
  bookingNumber,
}: PaymentWrapperProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#c6aa88',
        colorBackground: '#161514',
        colorText: '#f8f6f3',
        colorTextSecondary: '#b8b4ae',
        colorTextPlaceholder: '#7a7672',
        colorDanger: '#f87171',
        fontFamily: '"Outfit", system-ui, sans-serif',
        fontSizeBase: '15px',
        spacingUnit: '4px',
        borderRadius: '8px',
        colorIconTabSelected: '#050506',
      },
      rules: {
        '.Input': {
          border: '1px solid rgba(198, 170, 136, 0.2)',
          backgroundColor: 'rgba(31, 30, 28, 0.5)',
          color: '#f8f6f3',
          padding: '14px 16px',
          transition: 'all 200ms ease',
          boxShadow: 'none',
        },
        '.Input:focus': {
          border: '1px solid #c6aa88',
          boxShadow: '0 0 0 2px #c6aa88',
          outline: 'none',
        },
        '.Input::placeholder': {
          color: 'rgba(122, 118, 114, 0.5)',
        },
        '.Input--invalid': {
          border: '1px solid #f87171',
          boxShadow: '0 0 0 3px rgba(248, 113, 113, 0.1)',
        },
        '.Label': {
          color: '#c6aa88',
          fontSize: '11px',
          fontWeight: '600',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        },
        '.Error': {
          color: '#f87171',
          fontSize: '13px',
          marginTop: '8px',
        },
        '.CheckboxInput': {
          backgroundColor: 'rgba(31, 30, 28, 0.5)',
          border: '1px solid rgba(198, 170, 136, 0.2)',
        },
        '.CheckboxInput--checked': {
          backgroundColor: '#c6aa88',
          border: '1px solid #c6aa88',
        },
        '.CheckboxLabel': {
          color: '#b8b4ae',
          fontSize: '13px',
        },
        // Accordion styles - explicitly remove any theme shadows
        '.AccordionItem': {
          border: '1px solid rgba(198, 170, 136, 0.15)',
          borderRadius: '12px',
          backgroundColor: 'rgba(31, 30, 28, 0.5)',
          boxShadow: 'none',
        },
        '.AccordionItem--selected': {
          border: '1px solid rgba(198, 170, 136, 0.3)',
          backgroundColor: 'rgba(31, 30, 28, 0.7)',
          boxShadow: 'none',
        },
        // Remove shadows from tabs and blocks
        '.Tab': {
          boxShadow: 'none',
          border: '1px solid rgba(198, 170, 136, 0.15)',
          backgroundColor: 'rgba(31, 30, 28, 0.5)',
        },
        '.Tab--selected': {
          boxShadow: 'none',
          border: '1px solid rgba(198, 170, 136, 0.3)',
          backgroundColor: 'rgba(31, 30, 28, 0.7)',
        },
        '.Tab:hover': {
          boxShadow: 'none',
        },
        '.Block': {
          boxShadow: 'none',
          backgroundColor: 'transparent',
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
