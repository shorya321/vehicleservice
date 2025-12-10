'use client'

/**
 * Payment Element Modal
 * Stripe Payment Element integration for adding funds
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/currency-converter'
import type { CurrencyCode } from '@/lib/utils/currency-converter'
import { cn } from '@/lib/utils'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentElementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  currency: CurrencyCode
  onSuccess?: () => void
}

interface CheckoutFormProps {
  amount: number
  currency: CurrencyCode
  clientSecret: string
  onSuccess?: () => void
  onClose: () => void
}

function CheckoutForm({ amount, currency, clientSecret, onSuccess, onClose }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const { error: submitError } = await elements.submit()

      if (submitError) {
        setErrorMessage(submitError.message || 'Failed to submit payment details')
        setIsProcessing(false)
        return
      }

      // Confirm the payment
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/business/wallet?payment=success`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        setErrorMessage(confirmError.message || 'Payment failed')
        setIsProcessing(false)
        return
      }

      // Payment succeeded
      toast.success('Payment successful! Your wallet has been recharged.')
      onSuccess?.()
      onClose()
      router.refresh()
    } catch (error) {
      console.error('Payment error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Display */}
      <div className="rounded-xl p-4 text-center bg-muted border border-border">
        <p className="text-sm text-muted-foreground">Amount to Add</p>
        <p className="text-2xl font-bold text-primary">
          {formatCurrency(amount, currency)}
        </p>
      </div>

      {/* Payment Element */}
      <PaymentElement />

      {/* Error Message */}
      {errorMessage && (
        <Alert className="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1 bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay {formatCurrency(amount, currency)}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export function PaymentElementModal({
  open,
  onOpenChange,
  amount,
  currency,
  onSuccess,
}: PaymentElementModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && !clientSecret) {
      createPaymentIntent()
    }
  }, [open])

  const createPaymentIntent = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/business/wallet/payment-element/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initialize payment')
      }

      // API wraps response in { data: { client_secret } }
      setClientSecret(result.data?.client_secret || null)
    } catch (error) {
      console.error('Payment intent error:', error)
      setError(error instanceof Error ? error.message : 'Failed to initialize payment')
      toast.error('Failed to initialize payment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setClientSecret(null)
    setError(null)
    onOpenChange(false)
  }

  // Theme for Stripe Payment Element - adapts to light/dark mode via CSS variables
  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: 'hsl(var(--primary))',
      colorBackground: 'hsl(var(--card))',
      colorText: 'hsl(var(--foreground))',
      colorDanger: 'hsl(0 84.2% 60.2%)',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: '12px',
      colorTextSecondary: 'hsl(var(--muted-foreground))',
      colorTextPlaceholder: 'hsl(var(--muted-foreground))',
    },
    rules: {
      '.Input': {
        backgroundColor: 'hsl(var(--muted))',
        border: '1px solid hsl(var(--border))',
      },
      '.Input:focus': {
        borderColor: 'hsl(var(--primary))',
        boxShadow: '0 0 0 2px hsl(var(--primary) / 0.2)',
      },
      '.Label': {
        color: 'hsl(var(--muted-foreground))',
      },
    },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="h-5 w-5 text-primary" />
            Add Funds to Wallet
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Securely add funds using Stripe Payment Element. Your payment information is never
            stored on our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="space-y-4">
              <Alert className="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button
                onClick={createPaymentIntent}
                className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
              >
                Try Again
              </Button>
            </div>
          )}

          {clientSecret && !isLoading && !error && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance,
              }}
            >
              <CheckoutForm
                amount={amount}
                currency={currency}
                clientSecret={clientSecret}
                onSuccess={onSuccess}
                onClose={handleClose}
              />
            </Elements>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
