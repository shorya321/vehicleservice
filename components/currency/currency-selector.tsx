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
  staticMode?: boolean
}

export function CurrencySelector({
  className = '',
  variant = 'default',
  staticMode = false,
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

  // During SSR / before mount, render a plain button to avoid Radix hydration mismatch
  if (staticMode) {
    if (variant === 'minimal') {
      return (
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 gap-1 px-2 font-mono text-sm ${className}`}
        >
          <span>{getCurrencyFlag(currentCurrency)}</span>
          <span>{currentCurrency}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      )
    }
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-9 gap-1.5 px-3 border border-[var(--gold)]/20 hover:border-[var(--gold)]/40 hover:bg-[var(--gold)]/5 transition-colors ${className}`}
      >
        <span className="text-sm">
          {getCurrencyFlag(currentCurrency)}
        </span>
        <span className="text-sm text-[var(--text-primary)]">
          {currentCurrency}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] ml-0.5" />
      </Button>
    )
  }

  if (variant === 'minimal') {
    return (
      <>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
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
            className={`h-9 gap-1.5 px-3 border border-[var(--gold)]/20 hover:border-[var(--gold)]/40 hover:bg-[var(--gold)]/5 transition-colors ${className}`}
          >
            <span className="text-sm">
              {getCurrencyFlag(currentCurrency)}
            </span>
            <span className="text-sm text-[var(--text-primary)]">
              {currentCurrency}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[180px] bg-[var(--charcoal)] border-[var(--gold)]/20"
        >
          {dropdownCurrencies.map((currency) => (
            <DropdownMenuItem
              key={currency.code}
              onClick={() => handleSelectCurrency(currency.code)}
              className="flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--gold)]/10"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">{getCurrencyFlag(currency.code)}</span>
                <span className="text-[var(--text-primary)]">{currency.code}</span>
              </span>
              {currency.code === currentCurrency && (
                <Check className="h-4 w-4 text-[var(--gold)]" />
              )}
            </DropdownMenuItem>
          ))}
          {allCurrencies.length > dropdownCurrencies.length && (
            <>
              <DropdownMenuSeparator className="bg-[var(--gold)]/10" />
              <DropdownMenuItem
                onClick={handleShowAll}
                className="flex items-center gap-2 cursor-pointer hover:bg-[var(--gold)]/10 text-[var(--text-secondary)]"
              >
                <Globe className="h-4 w-4 text-[var(--gold)]" />
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
