'use client'

import { useMemo } from 'react'
import { useTheme } from 'next-themes'
import { Elements } from '@stripe/react-stripe-js'
import { CheckoutForm } from './checkout-form'
import { stripePromise } from '@/lib/stripe/client'

const FONT_FAMILY = '"TT Commons Pro", "TT Commons", Inter, system-ui, sans-serif'

function getStripeAppearance(isDark: boolean) {
  const surface = isDark ? '#0f0e0d' : '#eae7e2'
  const cardBg = isDark ? '#161514' : '#f3f1ee'
  const text = isDark ? '#f8f6f3' : '#1a1917'
  const muted = isDark ? '#9a9692' : '#706c69'
  const secondary = isDark ? '#b8b4ae' : '#5c5955'
  const borderAlpha = isDark ? '0.12' : '0.15'
  const selectedBorderAlpha = isDark ? '0.2' : '0.25'

  return {
    theme: (isDark ? 'night' : 'flat') as 'night' | 'flat',
    variables: {
      colorPrimary: '#c6aa88',
      colorBackground: cardBg,
      colorText: text,
      colorTextSecondary: secondary,
      colorTextPlaceholder: muted,
      colorDanger: '#ef4444',
      fontFamily: FONT_FAMILY,
      fontSizeBase: '15px',
      spacingUnit: '4px',
      borderRadius: '4px',
      colorIconTabSelected: isDark ? '#050506' : '#faf9f7',
    },
    rules: {
      '.Input': {
        border: `1px solid rgba(198, 170, 136, ${borderAlpha})`,
        backgroundColor: surface,
        color: text,
        padding: '14px 16px',
        transition: 'border-color 200ms ease, box-shadow 200ms ease',
        boxShadow: 'none',
      },
      '.Input:focus': {
        border: '1px solid #c6aa88',
        boxShadow: '0 0 0 4px rgba(198, 170, 136, 0.15)',
        outline: 'none',
      },
      '.Input::placeholder': {
        color: muted,
      },
      '.Input--invalid': {
        border: '1px solid #ef4444',
        boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.1)',
      },
      '.Label': {
        color: muted,
        fontSize: '11px',
        fontWeight: '500',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: '8px',
      },
      '.Error': {
        color: '#ef4444',
        fontSize: '13px',
        marginTop: '8px',
      },
      '.CheckboxInput': {
        backgroundColor: surface,
        border: `1px solid rgba(198, 170, 136, ${borderAlpha})`,
      },
      '.CheckboxInput--checked': {
        backgroundColor: '#c6aa88',
        border: '1px solid #c6aa88',
      },
      '.CheckboxLabel': {
        color: secondary,
        fontSize: '13px',
      },
      '.AccordionItem': {
        border: `1px solid rgba(198, 170, 136, ${borderAlpha})`,
        borderRadius: '8px',
        backgroundColor: surface,
        boxShadow: 'none',
      },
      '.AccordionItem--selected': {
        border: `1px solid rgba(198, 170, 136, ${selectedBorderAlpha})`,
        backgroundColor: surface,
        boxShadow: 'none',
      },
      '.Tab': {
        boxShadow: 'none',
        border: `1px solid rgba(198, 170, 136, ${borderAlpha})`,
        backgroundColor: surface,
      },
      '.Tab--selected': {
        boxShadow: 'none',
        border: `1px solid rgba(198, 170, 136, ${selectedBorderAlpha})`,
        backgroundColor: cardBg,
      },
      '.Tab:hover': {
        boxShadow: 'none',
      },
      '.Block': {
        boxShadow: 'none',
        backgroundColor: 'transparent',
      },
    },
  }
}

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
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  const appearance = useMemo(() => getStripeAppearance(isDark), [isDark])
  const options = useMemo(() => ({ clientSecret, appearance }), [clientSecret, appearance])

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        bookingId={bookingId}
        amount={amount}
        bookingNumber={bookingNumber}
      />
    </Elements>
  )
}
