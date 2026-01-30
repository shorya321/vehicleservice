'use client'

/**
 * Currency Selector Component
 *
 * Dropdown for selecting display currency in public header.
 * Updates cookie and refreshes page on selection.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { setCurrencyInClientCookie } from '@/lib/currency/cookie'
import type { CurrencyInfo } from '@/lib/currency/types'

interface CurrencySelectorProps {
  currencies: CurrencyInfo[]
  currentCurrency: string
  className?: string
  variant?: 'default' | 'minimal'
}

export function CurrencySelector({
  currencies,
  currentCurrency,
  className = '',
  variant = 'default',
}: CurrencySelectorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  const currentCurrencyInfo = currencies.find((c) => c.code === currentCurrency)

  const handleSelectCurrency = (currencyCode: string) => {
    if (currencyCode === currentCurrency) {
      setIsOpen(false)
      return
    }

    // Update cookie
    setCurrencyInClientCookie(currencyCode)

    // Refresh page to update prices
    startTransition(() => {
      setIsOpen(false)
      router.refresh()
    })
  }

  if (currencies.length <= 1) {
    // Don't show selector if only one currency
    return null
  }

  if (variant === 'minimal') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-1 px-2 font-mono text-sm ${className}`}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <span>{currentCurrencyInfo?.symbol || currentCurrency}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px]">
          {currencies.map((currency) => (
            <DropdownMenuItem
              key={currency.code}
              onClick={() => handleSelectCurrency(currency.code)}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="font-mono text-sm">{currency.symbol}</span>
                <span>{currency.code}</span>
              </span>
              {currency.code === currentCurrency && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Default variant
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 gap-1.5 px-3 border border-[var(--gold)]/20 hover:border-[var(--gold)]/40 hover:bg-[var(--gold)]/5 transition-colors ${className}`}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--gold)]" />
          ) : (
            <>
              <span className="font-mono text-sm text-[var(--text-primary)]">
                {currentCurrencyInfo?.symbol || '$'}
              </span>
              <span className="text-sm text-[var(--text-secondary)]">
                {currentCurrency}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] ml-0.5" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[180px] bg-[var(--charcoal)] border-[var(--gold)]/20"
      >
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => handleSelectCurrency(currency.code)}
            className="flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--gold)]/10"
          >
            <span className="flex items-center gap-2">
              <span className="font-mono text-sm w-8 text-[var(--gold)]">
                {currency.symbol}
              </span>
              <span className="text-[var(--text-primary)]">{currency.code}</span>
              <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
                {currency.name}
              </span>
            </span>
            {currency.code === currentCurrency && (
              <Check className="h-4 w-4 text-[var(--gold)]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
