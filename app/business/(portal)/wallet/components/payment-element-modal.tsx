'use client'

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
      <div className="rounded-lg bg-muted p-4 text-center">
        <p className="text-sm text-muted-foreground">Amount to Add</p>
        <p className="text-2xl font-bold">{formatCurrency(amount, currency)}</p>
      </div>

      {/* Payment Element */}
      <PaymentElement />

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
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
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing} className="flex-1">
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

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#6366F1', // indigo-500 - match business portal
      colorBackground: '#0F0F12', // business-surface-1
      colorText: '#FAFAFA', // business-text-primary
      colorDanger: '#EF4444', // business-error
      fontFamily: 'system-ui, sans-serif',
      borderRadius: '8px',
    },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Funds to Wallet
          </DialogTitle>
          <DialogDescription>
            Securely add funds using Stripe Payment Element. Your payment information is never
            stored on our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error && !isLoading && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={createPaymentIntent} className="w-full">
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
