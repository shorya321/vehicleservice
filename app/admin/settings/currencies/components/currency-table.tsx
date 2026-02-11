'use client'

/**
 * Currency Settings Table Component
 *
 * Displays currencies with toggle switches, featured toggle, and default selection.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Star, StarOff } from 'lucide-react'
import { toast } from 'sonner'
import { toggleCurrencyEnabled, toggleCurrencyFeatured, setDefaultCurrency } from '../actions'
import type { CurrencySetting } from '@/lib/currency/types'

interface CurrencyTableProps {
  currencies: CurrencySetting[]
  rates: Record<string, number>
  defaultCurrencyCode: string
}

export function CurrencyTable({ currencies, rates, defaultCurrencyCode }: CurrencyTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingCurrency, setLoadingCurrency] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const getDisplayRate = (currencyCode: string): number => {
    if (currencyCode === defaultCurrencyCode) return 1.0
    const rateFromUsd = rates[currencyCode] || 1.0
    const defaultRateFromUsd = rates[defaultCurrencyCode] || 1.0
    return rateFromUsd / defaultRateFromUsd
  }

  const handleToggleEnabled = async (currencyCode: string, isEnabled: boolean) => {
    setLoadingCurrency(currencyCode)
    setLoadingAction('enabled')

    startTransition(async () => {
      const result = await toggleCurrencyEnabled(currencyCode, isEnabled)

      if (result.success) {
        toast.success(`${currencyCode} ${isEnabled ? 'enabled' : 'disabled'}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update currency')
      }

      setLoadingCurrency(null)
      setLoadingAction(null)
    })
  }

  const handleToggleFeatured = async (currencyCode: string, isFeatured: boolean) => {
    setLoadingCurrency(currencyCode)
    setLoadingAction('featured')

    startTransition(async () => {
      const result = await toggleCurrencyFeatured(currencyCode, isFeatured)

      if (result.success) {
        toast.success(`${currencyCode} ${isFeatured ? 'featured' : 'unfeatured'}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update featured status')
      }

      setLoadingCurrency(null)
      setLoadingAction(null)
    })
  }

  const handleSetDefault = async (currencyCode: string) => {
    setLoadingCurrency(currencyCode)
    setLoadingAction('default')

    startTransition(async () => {
      const result = await setDefaultCurrency(currencyCode)

      if (result.success) {
        toast.success(`${currencyCode} set as default currency`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to set default currency')
      }

      setLoadingCurrency(null)
      setLoadingAction(null)
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[100px]">Code</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead className="w-[80px]">Symbol</TableHead>
            <TableHead className="w-[120px] text-right">Rate ({defaultCurrencyCode})</TableHead>
            <TableHead className="w-[100px] text-center">Enabled</TableHead>
            <TableHead className="w-[100px] text-center">Featured</TableHead>
            <TableHead className="w-[100px] text-center">Default</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currencies.map((currency) => {
            const isLoading = loadingCurrency === currency.currency_code
            const displayRate = getDisplayRate(currency.currency_code)

            return (
              <TableRow key={currency.currency_code}>
                <TableCell>
                  <span className="font-mono font-medium text-foreground">
                    {currency.currency_code}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">{currency.name}</span>
                    {currency.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-muted-foreground">
                    {currency.symbol}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                  {displayRate.toFixed(4)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    {isLoading && loadingAction === 'enabled' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Switch
                        checked={currency.is_enabled ?? false}
                        onCheckedChange={(checked) =>
                          handleToggleEnabled(currency.currency_code, checked)
                        }
                        disabled={isPending || (currency.is_default ?? false)}
                        aria-label={`${currency.is_enabled ? 'Disable' : 'Enable'} ${currency.name}`}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    {isLoading && loadingAction === 'featured' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Switch
                        checked={currency.is_featured ?? false}
                        onCheckedChange={(checked) =>
                          handleToggleFeatured(currency.currency_code, checked)
                        }
                        disabled={isPending || !currency.is_enabled}
                        aria-label={`${currency.is_featured ? 'Unfeature' : 'Feature'} ${currency.name}`}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    {isLoading && loadingAction === 'default' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : currency.is_default ? (
                      <Star className="h-5 w-5 fill-primary text-primary" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSetDefault(currency.currency_code)}
                        disabled={isPending || !currency.is_enabled}
                        title={
                          currency.is_enabled
                            ? `Set ${currency.currency_code} as default`
                            : 'Enable currency first'
                        }
                      >
                        <StarOff className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
