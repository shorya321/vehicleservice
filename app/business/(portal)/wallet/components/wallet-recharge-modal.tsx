'use client'

/**
 * Wallet Recharge Modal
 * Modal for adding funds to business wallet
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/currency-converter'
import type { CurrencyCode } from '@/lib/utils/currency-converter'
import { PaymentMethodsSelector } from './payment-methods-selector'
import { PaymentElementModal } from './payment-element-modal'
import { cn } from '@/lib/utils'

interface WalletRechargeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  currency: CurrencyCode
  onSuccess?: () => void
}

type FlowState = 'select' | 'new-card' | 'processing' | 'success' | 'error'

export function WalletRechargeModal({
  open,
  onOpenChange,
  amount,
  currency,
  onSuccess,
}: WalletRechargeModalProps) {
  const router = useRouter()
  const [flowState, setFlowState] = useState<FlowState>('select')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPaymentElement, setShowPaymentElement] = useState(false)

  const handleReset = () => {
    setFlowState('select')
    setIsProcessing(false)
    setError(null)
    setShowPaymentElement(false)
  }

  const handleClose = () => {
    handleReset()
    onOpenChange(false)
  }

  const handleSelectSavedCard = async (paymentMethodId: string) => {
    setIsProcessing(true)
    setError(null)
    setFlowState('processing')

    try {
      const response = await fetch('/api/business/wallet/payment-element/charge-saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method_id: paymentMethodId,
          amount,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed')
      }

      // Check if additional action required (3D Secure)
      if (result.data?.requires_action && result.data?.client_secret) {
        setError('This card requires additional authentication. Please use the "Add New Card" option.')
        setFlowState('error')
        setIsProcessing(false)
        return
      }

      // Success
      setFlowState('success')
      toast.success('Payment successful! Your wallet has been recharged.')

      // Wait a moment to show success state, then close
      setTimeout(() => {
        onSuccess?.()
        handleClose()
        router.refresh()
      }, 1500)
    } catch (err) {
      console.error('Saved card payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
      setFlowState('error')
      toast.error('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddNewCard = () => {
    setShowPaymentElement(true)
  }

  const handleNewCardSuccess = () => {
    setFlowState('success')
    toast.success('Payment successful! Your wallet has been recharged.')

    setTimeout(() => {
      onSuccess?.()
      handleClose()
      router.refresh()
    }, 1500)
  }

  const handleNewCardClose = () => {
    setShowPaymentElement(false)
    setFlowState('select')
  }

  return (
    <>
      {/* Main Modal - Payment Method Selection */}
      <Dialog open={open && !showPaymentElement} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <CreditCard className="h-5 w-5 text-primary" />
              Add Funds to Wallet
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add {formatCurrency(amount, currency)} to your business wallet
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Amount Display */}
            <div className="rounded-xl p-4 text-center mb-6 bg-muted border border-border">
              <p className="text-sm text-muted-foreground">Amount to Add</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(amount, currency)}
              </p>
            </div>

            {/* Success State */}
            {flowState === 'success' && (
              <div className="space-y-4 text-center py-8">
                <div className="flex justify-center">
                  <div className="rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/20 p-3">
                    <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Payment Successful!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your wallet has been recharged
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {flowState === 'error' && error && (
              <div className="space-y-4">
                <Alert className="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Selection State */}
            {(flowState === 'select' || flowState === 'processing') && (
              <PaymentMethodsSelector
                onSelectSaved={handleSelectSavedCard}
                onAddNew={handleAddNewCard}
                isProcessing={isProcessing}
              />
            )}
          </div>

          {/* Cancel Button (only in select mode) */}
          {flowState === 'select' && !isProcessing && (
            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Element Modal for New Cards */}
      <PaymentElementModal
        open={showPaymentElement}
        onOpenChange={(open) => {
          if (!open) {
            handleNewCardClose()
          }
        }}
        amount={amount}
        currency={currency}
        onSuccess={handleNewCardSuccess}
      />
    </>
  )
}
