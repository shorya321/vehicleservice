'use client'

/**
 * Currency Selection Modal
 *
 * Full-screen modal with search and grid of all enabled currencies.
 * Opens from the "Show all currencies" option in the currency dropdown.
 * Uses CurrencyProvider context for instant switching.
 */

import { useState, useMemo } from 'react'
import { Search, Coins } from 'lucide-react'
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
      <DialogContent className="max-w-[calc(100%-1.5rem)] sm:max-w-5xl max-h-[90dvh] sm:max-h-[85vh] rounded-lg flex flex-col gap-0 p-0 bg-[var(--black-rich)] backdrop-blur-xl border border-[var(--graphite)] overflow-hidden">
        <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-[var(--graphite)]">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
              Select Currency
            </DialogTitle>
            <div className="mt-2 h-px w-8 bg-[rgba(var(--gold-text-rgb),0.4)]" />
          </DialogHeader>

          <div className="relative mt-4">
            <input
              type="text"
              placeholder="Search currencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="peer w-full h-11 pl-10 pr-4 rounded bg-[var(--black-warm)] border border-[var(--graphite)] text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:font-normal outline-none transition-all duration-200 focus:border-[var(--gold)] focus-visible:shadow-[0_0_0_1px_var(--gold),0_0_0_4px_rgba(var(--gold-rgb),0.15)] focus:bg-[rgba(var(--gold-rgb),0.035)]"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] peer-focus:text-[var(--gold-text)] transition-colors duration-200 pointer-events-none" />
          </div>
        </div>

        <div className="relative flex-1 min-h-0">
          <div className="overflow-y-auto h-full max-h-[60dvh] sm:max-h-none px-4 py-3 sm:px-6 sm:py-4 overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--graphite)] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(var(--graphite-rgb),0.8)]">
            <TooltipProvider delayDuration={300}>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2.5">
                {filteredCurrencies.map((currency) => {
                  const isSelected = currency.code === currentCurrency

                  return (
                    <Tooltip key={currency.code}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleSelect(currency.code)}
                          className={`
                            group relative flex flex-col items-center justify-center text-center p-3 rounded transition-all duration-200 focus:outline-none focus-visible:shadow-[0_0_0_1px_var(--gold),0_0_0_4px_rgba(var(--gold-rgb),0.15)]
                            ${isSelected
                              ? 'bg-[rgba(var(--gold-rgb),0.12)] border border-[rgba(var(--gold-text-rgb),0.5)]'
                              : 'bg-[var(--black-warm)] border border-[rgba(var(--graphite-rgb),0.6)] hover:border-[rgba(var(--gold-text-rgb),0.3)] hover:bg-[rgba(var(--gold-rgb),0.08)]'
                            }
                          `}
                        >
                          <span className="text-2xl leading-none">{getCurrencyFlag(currency.code)}</span>
                          <span className={`mt-1.5 text-sm font-semibold tabular-nums tracking-wide ${isSelected ? 'text-[var(--gold-text)]' : 'text-[var(--text-primary)] group-hover:text-[var(--gold-text)]'}`}>
                            {currency.code}
                          </span>
                          <span className={`text-[10px] ${isSelected ? 'text-[rgba(var(--gold-text-rgb),0.7)]' : 'text-[var(--text-muted)] group-hover:text-[rgba(var(--gold-text-rgb),0.5)]'}`}>
                            {getCurrencySymbol(currency.code)}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-[var(--black-warm)] border border-[var(--graphite)] text-[var(--text-secondary)] text-xs font-medium"
                      >
                        {currency.name}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </TooltipProvider>

            {filteredCurrencies.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded bg-[rgba(var(--gold-rgb),0.08)] flex items-center justify-center">
                  <Coins className="h-5 w-5 text-[rgba(var(--gold-text-rgb),0.4)]" />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  No currencies found for &ldquo;{search}&rdquo;
                </p>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--black-rich)] to-transparent pointer-events-none sm:hidden" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
