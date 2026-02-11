'use client'

/**
 * Refresh Exchange Rates Button Component
 *
 * Button to manually trigger exchange rate refresh from API.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { refreshExchangeRates } from '../actions'

export function RefreshRatesButton() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastResult, setLastResult] = useState<'success' | 'error' | null>(null)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setLastResult(null)

    try {
      const result = await refreshExchangeRates()

      if (result.success) {
        if (result.source === 'api') {
          setLastResult('success')
          toast.success(result.message || 'Exchange rates updated from live API')
        } else if (result.source === 'fallback') {
          setLastResult('error')
          toast.warning('Using cached rates — live API unavailable', {
            description: 'Rates were not updated. Try again later.',
            duration: 6000,
          })
        } else {
          setLastResult('success')
          toast.success(result.message || 'Rates are up to date')
        }
        router.refresh()
      } else {
        setLastResult('error')
        toast.error(result.error || 'Failed to refresh rates', { duration: 6000 })
      }
    } catch (error) {
      setLastResult('error')
      toast.error('An unexpected error occurred')
    } finally {
      setIsRefreshing(false)

      // Reset result indicator after 3 seconds
      setTimeout(() => setLastResult(null), 3000)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="gap-2"
    >
      {isRefreshing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Refreshing...
        </>
      ) : lastResult === 'success' ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          Updated
        </>
      ) : lastResult === 'error' ? (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          Failed
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Refresh Rates
        </>
      )}
    </Button>
  )
}
