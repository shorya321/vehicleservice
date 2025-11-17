'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2, CreditCard, Trash2, Star, StarOff } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentMethod {
  id: string
  stripe_payment_method_id: string
  payment_method_type: string
  card_brand?: string
  card_last4?: string
  card_exp_month?: number
  card_exp_year?: number
  card_funding?: string
  is_default: boolean
  is_active: boolean
  last_used_at?: string
  created_at: string
}

export function PaymentMethodsList() {
  const router = useRouter()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/business/wallet/payment-element/payment-methods')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load payment methods')
      }

      // API wraps response in { data: { payment_methods } }
      setPaymentMethods(result.data?.payment_methods || [])
    } catch (error) {
      console.error('Load payment methods error:', error)
      toast.error('Failed to load payment methods')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      setSettingDefaultId(paymentMethodId)

      const response = await fetch('/api/business/wallet/payment-element/payment-methods', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method_id: paymentMethodId,
          set_as_default: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set default payment method')
      }

      toast.success('Default payment method updated')
      loadPaymentMethods()
      router.refresh()
    } catch (error) {
      console.error('Set default error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to set default payment method')
    } finally {
      setSettingDefaultId(null)
    }
  }

  const handleDelete = async (paymentMethodId: string) => {
    try {
      setDeletingId(paymentMethodId)

      const response = await fetch(
        `/api/business/wallet/payment-element/payment-methods?id=${paymentMethodId}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete payment method')
      }

      toast.success('Payment method deleted')
      loadPaymentMethods()
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete payment method')
    } finally {
      setDeletingId(null)
    }
  }

  const getCardBrandIcon = (brand?: string) => {
    // In production, you'd use actual brand logos
    return <CreditCard className="h-8 w-8" />
  }

  const formatCardBrand = (brand?: string) => {
    if (!brand) return 'Card'
    return brand.charAt(0).toUpperCase() + brand.slice(1)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (paymentMethods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Payment Methods</CardTitle>
          <CardDescription>No payment methods saved yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Payment methods will be saved automatically when you make a wallet recharge. This allows
            for faster future transactions.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Payment Methods</CardTitle>
        <CardDescription>Manage your saved payment methods for quick recharges</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {paymentMethods.map((pm) => (
          <div
            key={pm.id}
            className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
          >
            {/* Payment Method Info */}
            <div className="flex items-center gap-4">
              <div className="text-muted-foreground">{getCardBrandIcon(pm.card_brand)}</div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {formatCardBrand(pm.card_brand)} •••• {pm.card_last4}
                  </p>
                  {pm.is_default && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                  {pm.card_funding && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {pm.card_funding}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  {pm.card_exp_month && pm.card_exp_year && (
                    <span>
                      Expires {pm.card_exp_month.toString().padStart(2, '0')}/{pm.card_exp_year}
                    </span>
                  )}
                  {pm.last_used_at && (
                    <span>Last used {new Date(pm.last_used_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {!pm.is_default && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetDefault(pm.id)}
                  disabled={settingDefaultId === pm.id}
                >
                  {settingDefaultId === pm.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting...
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4" />
                      Set Default
                    </>
                  )}
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deletingId === pm.id}
                  >
                    {deletingId === pm.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Payment Method?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this payment method? This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(pm.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
