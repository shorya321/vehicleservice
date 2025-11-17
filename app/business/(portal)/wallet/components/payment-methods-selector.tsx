'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Plus, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PaymentMethod {
  id: string
  card_brand: string
  card_last4: string
  card_exp_month: number
  card_exp_year: number
  is_default: boolean
  last_used_at: string | null
}

interface PaymentMethodsSelectorProps {
  onSelectSaved: (paymentMethodId: string) => void
  onAddNew: () => void
  isProcessing?: boolean
}

const cardBrandColors: Record<string, string> = {
  visa: 'bg-blue-500',
  mastercard: 'bg-orange-500',
  amex: 'bg-green-500',
  discover: 'bg-purple-500',
  default: 'bg-gray-500',
}

const cardBrandNames: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
}

export function PaymentMethodsSelector({
  onSelectSaved,
  onAddNew,
  isProcessing = false,
}: PaymentMethodsSelectorProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/business/wallet/payment-element/payment-methods')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch payment methods')
      }

      setPaymentMethods(result.data?.payment_methods || [])
    } catch (err) {
      console.error('Error fetching payment methods:', err)
      setError(err instanceof Error ? err.message : 'Failed to load payment methods')
    } finally {
      setIsLoading(false)
    }
  }

  const formatExpiry = (month: number, year: number) => {
    return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`
  }

  const getBrandColor = (brand: string) => {
    return cardBrandColors[brand.toLowerCase()] || cardBrandColors.default
  }

  const getBrandName = (brand: string) => {
    return cardBrandNames[brand.toLowerCase()] || brand.charAt(0).toUpperCase() + brand.slice(1)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchPaymentMethods} variant="outline" className="w-full">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Select Payment Method</h3>
        <p className="text-sm text-muted-foreground">
          Choose a saved card or add a new one
        </p>
      </div>

      {/* Saved Payment Methods */}
      {paymentMethods.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Saved Cards</p>
          {paymentMethods.map((pm) => (
            <Card
              key={pm.id}
              className="relative overflow-hidden transition-all hover:shadow-md hover:border-primary/50"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Card Info */}
                  <div className="flex items-center gap-3 flex-1">
                    {/* Card Icon */}
                    <div
                      className={`${getBrandColor(pm.card_brand)} rounded-lg p-3 flex items-center justify-center`}
                    >
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>

                    {/* Card Details */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {getBrandName(pm.card_brand)} ••••{pm.card_last4}
                        </p>
                        {pm.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Expires {formatExpiry(pm.card_exp_month, pm.card_exp_year)}
                      </p>
                      {pm.last_used_at && (
                        <p className="text-xs text-muted-foreground">
                          Last used: {new Date(pm.last_used_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Use Button */}
                  <Button
                    onClick={() => onSelectSaved(pm.id)}
                    disabled={isProcessing}
                    size="sm"
                    className="shrink-0"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Use This Card'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Card Button */}
      <Button
        onClick={onAddNew}
        variant={paymentMethods.length > 0 ? 'outline' : 'default'}
        disabled={isProcessing}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add New Card
      </Button>

      {paymentMethods.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          You haven't saved any payment methods yet
        </p>
      )}
    </div>
  )
}
