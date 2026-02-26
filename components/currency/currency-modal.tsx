'use client'

/**
 * Currency Selection Modal
 *
 * Full-screen modal with search and grid of all enabled currencies.
 * Opens from the "Show all currencies" option in the currency dropdown.
 * Uses CurrencyProvider context for instant switching.
 */

import { useState, useMemo } from 'react'
import { Check, Search, Coins } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getCurrencyFlag, getCurrencySymbol } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'

interface CurrencyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CurrencyModal({
  open,
  onOpenChange,
}: CurrencyModalProps) {
  const { currentCurrency, allCurrencies, setCurrency } = useCurrency()
  const [search, setSearch] = useState('')

  const filteredCurrencies = useMemo(() => {
    if (!search) return allCurrencies
    const q = search.toLowerCase()
    return allCurrencies.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
    )
  }, [allCurrencies, search])

  const handleSelect = (code: string) => {
    setCurrency(code)
    onOpenChange(false)
    setSearch('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-5xl max-h-[90dvh] sm:max-h-[85vh] rounded-xl flex flex-col gap-0 p-0 bg-[linear-gradient(160deg,#161514eb_0%,#0a0a0bf5_100%)] backdrop-blur-xl border border-[var(--gold)]/20 shadow-[0_0_60px_rgba(198,170,136,0.08)] overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-[var(--gold)]/10">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
              Select Currency
            </DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search currencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-transparent border border-[var(--gold)]/15 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-300 focus:border-[var(--gold)]/40 focus:shadow-[0_0_12px_rgba(198,170,136,0.1)] focus:bg-[var(--gold)]/[0.03]"
            />
          </div>
        </div>

        {/* Scrollable Currency Grid */}
        <div className="relative flex-1 min-h-0">
          <div className="overflow-y-auto h-full max-h-[60dvh] sm:max-h-none px-4 py-3 sm:px-6 sm:py-4 overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--gold)]/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[var(--gold)]/40 sm:[&::-webkit-scrollbar-thumb]:bg-[var(--gold)]/20 sm:hover:[&::-webkit-scrollbar-thumb]:bg-[var(--gold)]/30">
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2">
                {filteredCurrencies.map((currency) => {
                  const isSelected = currency.code === currentCurrency

                  return (
                    <Tooltip key={currency.code}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleSelect(currency.code)}
                          className={`
                            group relative flex flex-col items-center justify-center text-center p-2 sm:p-3 rounded-lg transition-all duration-200
                            ${isSelected
                              ? 'bg-[#4a3f2a] border border-[var(--gold)]/50 shadow-[0_0_20px_rgba(198,170,136,0.15)]'
                              : 'bg-[var(--charcoal-light)]/40 border border-[var(--gold)]/10 hover:border-[var(--gold)]/35 hover:bg-[#4a3f2a] hover:shadow-[0_0_16px_rgba(198,170,136,0.08)] hover:scale-[1.03]'
                            }
                          `}
                        >
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--gold)] flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-[var(--charcoal)]" />
                            </div>
                          )}
                          <span className="text-xl leading-none">{getCurrencyFlag(currency.code)}</span>
                          <span className={`mt-1.5 text-xs font-semibold tracking-wide ${isSelected ? 'text-[var(--gold)]' : 'text-[var(--text-primary)] group-hover:text-[var(--gold)]'}`}>
                            {currency.code}
                          </span>
                          <span className={`text-[10px] ${isSelected ? 'text-[var(--gold)]/70' : 'text-[var(--text-muted)] group-hover:text-[var(--gold)]/70'}`}>
                            {getCurrencySymbol(currency.code)}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="!bg-[var(--charcoal)] backdrop-blur-xl border border-[var(--gold)]/20 !text-[var(--gold)] text-xs font-medium shadow-[0_0_12px_rgba(198,170,136,0.1)]"
                      >
                        {currency.name}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </TooltipProvider>

            {/* Info */}
            <div className="flex justify-center pt-4 pb-2">
              <p className="text-xs text-[var(--text-muted)] text-center">
                {allCurrencies.length} currencies available • Hover for details • Rates updated hourly
              </p>
            </div>

            {/* Empty State */}
            {filteredCurrencies.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-[var(--gold)]/50" />
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  No currencies found for &ldquo;{search}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Scroll fade indicator (mobile only) */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--charcoal)] to-transparent pointer-events-none sm:hidden" />
        </div>

      </DialogContent>
    </Dialog>
  )
}
