import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe with publishable key
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

// Currency configuration
export const CURRENCY = 'aed'
export const MIN_AMOUNT = 1.0
export const MAX_AMOUNT = 50000.0

// Format amount for display
export function formatAmountForDisplay(
  amount: number,
  currency: string = CURRENCY
): string {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  return numberFormat.format(amount)
}

// Format amount for Stripe (convert to cents)
export function formatAmountForStripe(
  amount: number,
  currency: string = CURRENCY
): number {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  const parts = numberFormat.formatToParts(amount)
  let zeroDecimalCurrency = true
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
    }
  }
  return zeroDecimalCurrency ? amount : Math.round(amount * 100)
}