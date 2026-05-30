'use client'

/**
 * Currency Selector Component
 *
 * Dropdown showing featured currencies with a "Show all" option
 * that opens a full modal with search and grid of all enabled currencies.
 * Uses CurrencyProvider context for instant switching (no server round-trip).
 */

import { useState, useMemo } from 'react'
import { ChevronDown, Check, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getCurrencyFlag } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import { CurrencyModal } from './currency-modal'

interface CurrencySelectorProps {
  className?: string
  variant?: 'default' | 'minimal'
}

export function CurrencySelector({
  className = '',
  variant = 'default',
}: CurrencySelectorProps) {
  const { currentCurrency, featuredCurrencies, allCurrencies, setCurrency } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Ensure current currency is always visible in the dropdown
  const dropdownCurrencies = useMemo(() => {
    const featured = [...featuredCurrencies]
    const currentInFeatured = featured.some((c) => c.code === currentCurrency)
    if (!currentInFeatured) {
      const currentInfo = allCurrencies.find((c) => c.code === currentCurrency)
      if (currentInfo) {
        featured.unshift(currentInfo)
      }
    }
    return featured
  }, [featuredCurrencies, allCurrencies, currentCurrency])

  const handleSelectCurrency = (currencyCode: string) => {
    if (currencyCode === currentCurrency) {
      setIsOpen(false)
      return
    }
    setCurrency(currencyCode)
    setIsOpen(false)
  }

  const handleShowAll = () => {
    setIsOpen(false)
    setIsModalOpen(true)
  }

  if (allCurrencies.length <= 1 && dropdownCurrencies.length <= 1) {
    return null
  }

  if (variant === 'minimal') {
    return (
      <>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Select currency, currently ${currentCurrency}`}
              className={`h-8 gap-1 px-2 font-mono text-sm ${className}`}
            >
              <span>{getCurrencyFlag(currentCurrency)}</span>
              <span>{currentCurrency}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            {dropdownCurrencies.map((currency) => (
              <DropdownMenuItem
                key={currency.code}
                onClick={() => handleSelectCurrency(currency.code)}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>{getCurrencyFlag(currency.code)}</span>
                  <span>{currency.code}</span>
                </span>
                {currency.code === currentCurrency && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            {allCurrencies.length > dropdownCurrencies.length && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleShowAll}
                  className="flex items-center gap-2 cursor-pointer text-muted-foreground"
                >
                  <Globe className="h-4 w-4" />
                  <span>More currencies</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <CurrencyModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      </>
    )
  }

  // Default variant
  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Select currency, currently ${currentCurrency}`}
            className={`h-auto gap-1 rounded-full px-3 py-1.5 border border-[color-mix(in_oklch,var(--graphite)_70%,var(--gold)_30%)] hover:border-[rgba(var(--gold-text-rgb),0.4)] hover:bg-transparent hover:text-[var(--gold-text-hover)] text-xs font-medium tracking-[0.06em] text-[var(--text-secondary)] transition-all duration-200 ${className}`}
          >
            <span className="text-sm leading-none">{getCurrencyFlag(currentCurrency)}</span>
            <span>{currentCurrency}</span>
            <ChevronDown className="h-3 w-3 text-[var(--gold-text)] opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[200px] bg-[var(--black-warm)] border border-[var(--graphite)] rounded-lg"
        >
          {dropdownCurrencies.map((currency) => (
            <DropdownMenuItem
              key={currency.code}
              onClick={() => handleSelectCurrency(currency.code)}
              className={`flex items-center justify-between gap-3 min-h-[44px] cursor-pointer hover:bg-[rgba(var(--gold-rgb),0.06)] focus:bg-[rgba(var(--gold-rgb),0.06)] ${currency.code === currentCurrency ? 'bg-[rgba(var(--gold-rgb),0.06)]' : ''}`}
            >
              <span className="flex items-center gap-2.5">
                <span className="text-sm">{getCurrencyFlag(currency.code)}</span>
                <span className={`font-medium tabular-nums ${currency.code === currentCurrency ? 'text-[var(--gold-text)]' : 'text-[var(--text-primary)]'}`}>{currency.code}</span>
                <span className="text-xs text-[var(--text-muted)]">{currency.name}</span>
              </span>
              {currency.code === currentCurrency && (
                <Check className="h-3.5 w-3.5 text-[var(--gold-text)]" />
              )}
            </DropdownMenuItem>
          ))}
          {allCurrencies.length > dropdownCurrencies.length && (
            <>
              <DropdownMenuSeparator className="bg-[var(--graphite)]" />
              <DropdownMenuItem
                onClick={handleShowAll}
                className="flex items-center justify-center min-h-[44px] cursor-pointer hover:bg-[rgba(var(--gold-rgb),0.06)] focus:bg-[rgba(var(--gold-rgb),0.06)] hover:text-[var(--gold-text)] focus:text-[var(--gold-text)] text-[var(--text-muted)] text-[0.6875rem] uppercase tracking-[0.12em] font-medium"
              >
                All currencies
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CurrencyModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  )
}
