'use client'

/**
 * Currency Selection Modal
 *
 * Search plus a grid of every enabled currency, grouped Featured first.
 * Opens from the "All currencies" option in the currency dropdown.
 * Uses CurrencyProvider context for instant switching.
 */

import { useState, useMemo, useRef, useCallback } from 'react'
import { Search, Lock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useCurrency } from '@/lib/currency/context'
import { CurrencyResults, CurrencyEmptyState } from './currency-grid'
import { CurrencyRateLine } from './currency-rate-line'
import { useCurrencyGridKeys } from './use-currency-grid-keys'
import { useCurrencyScroll } from './use-currency-scroll'

interface CurrencyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CurrencyModal({ open, onOpenChange }: CurrencyModalProps) {
  const { currentCurrency, featuredCurrencies, allCurrencies, setCurrency } =
    useCurrency()
  const [search, setSearch] = useState('')

  const searchRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const gridsRef = useRef<HTMLDivElement>(null)
  const handleGridKeys = useCurrencyGridKeys(gridsRef, searchRef)

  const query = search.trim().toLowerCase()
  const isSearching = query.length > 0

  const results = useMemo(() => {
    if (!query) return allCurrencies
    return allCurrencies.filter(
      (c) =>
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query)
    )
  }, [allCurrencies, query])

  const featured = useMemo(
    () => featuredCurrencies.filter((c) => allCurrencies.some((a) => a.code === c.code)),
    [featuredCurrencies, allCurrencies]
  )

  const rest = useMemo(() => {
    const featuredCodes = new Set(featured.map((c) => c.code))
    return allCurrencies.filter((c) => !featuredCodes.has(c.code))
  }, [allCurrencies, featured])

  const baseCode = allCurrencies.find((c) => c.isDefault)?.code ?? 'AED'

  const handleSelect = useCallback(
    (code: string) => {
      setCurrency(code)
      onOpenChange(false)
      setSearch('')
    },
    [setCurrency, onOpenChange]
  )

  const { showFade, syncFade } = useCurrencyScroll(
    open,
    scrollRef,
    gridsRef,
    `${results.length}:${isSearching}`
  )

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && results.length > 0) {
      event.preventDefault()
      handleSelect(results[0].code)
      return
    }
    // Clear the query before letting Escape reach the dialog and close it.
    if (event.key === 'Escape' && search) {
      event.preventDefault()
      event.stopPropagation()
      setSearch('')
      return
    }
    if (event.key === 'ArrowDown') {
      const first = gridsRef.current?.querySelector<HTMLButtonElement>('[data-currency-card]')
      if (first) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[calc(100%-1.5rem)] sm:max-w-[680px] max-h-[90dvh] sm:max-h-[85vh] rounded-lg flex flex-col gap-0 p-0 bg-[var(--black-rich)] backdrop-blur-xl border border-[rgba(var(--gold-rgb),0.13)] overflow-hidden duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] [&>button]:right-[18px] [&>button]:top-[18px] [&>button]:z-10 [&>button]:flex [&>button]:h-9 [&>button]:w-9 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-md [&>button]:text-[var(--text-muted)] [&>button:hover]:text-[var(--gold-text)] [&>button:hover]:bg-[rgba(var(--gold-rgb),0.07)]"
      >
        <div className="px-4 pt-5 pb-4 pr-14 sm:px-7 sm:pt-6 sm:pb-5 sm:pr-16 border-b border-[var(--graphite)]">
          {/* DialogHeader centres its text on mobile by default, which would
              leave the title alone against a left-aligned rate line and search. */}
          <DialogHeader className="space-y-0 text-left">
            <DialogTitle className="text-xl font-semibold leading-tight tracking-tight text-[var(--text-primary)]">
              Select currency
            </DialogTitle>
          </DialogHeader>

          <CurrencyRateLine />

          <div className="mt-4 flex items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by name or code"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
                autoComplete="off"
                aria-label="Search currencies by name or code"
                className="peer w-full h-11 pl-10 pr-4 rounded-md bg-[var(--black-warm)] border border-[var(--graphite)] text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:font-normal outline-none transition-all duration-200 focus:border-[var(--gold)] focus-visible:shadow-[0_0_0_1px_var(--gold),0_0_0_4px_rgba(var(--gold-rgb),0.15)] focus:bg-[rgba(var(--gold-rgb),0.035)]"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] peer-focus:text-[var(--gold-text)] transition-colors duration-200 pointer-events-none" />
            </div>

            {isSearching && (
              <span
                aria-live="polite"
                className="shrink-0 whitespace-nowrap text-[0.6875rem] uppercase tracking-[0.1em] tabular-nums text-[var(--text-muted)]"
              >
                {results.length} {results.length === 1 ? 'match' : 'matches'}
              </span>
            )}
          </div>
        </div>

        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            onScroll={syncFade}
            className="overflow-y-auto h-full max-h-[60dvh] sm:max-h-[396px] px-4 py-5 sm:px-7 pb-[max(1.25rem,env(safe-area-inset-bottom))] overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--graphite)] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(var(--graphite-rgb),0.8)]"
          >
            <TooltipProvider delayDuration={120}>
              <div ref={gridsRef} onKeyDown={handleGridKeys}>
                <CurrencyResults
                  results={results}
                  featured={featured}
                  rest={rest}
                  isSearching={isSearching}
                  currentCurrency={currentCurrency}
                  onSelect={handleSelect}
                />
              </div>
            </TooltipProvider>

            {results.length === 0 && <CurrencyEmptyState query={search.trim()} />}
          </div>

          <div
            aria-hidden="true"
            className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--black-rich)] to-transparent pointer-events-none transition-opacity duration-200 ${
              showFade ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 px-4 sm:px-7 py-3 border-t border-[var(--graphite)] text-[0.6875rem] text-[var(--text-muted)]">
          <Lock aria-hidden="true" className="h-3 w-3 shrink-0 text-[rgba(var(--gold-text-rgb),0.55)]" />
          <span>Rates are indicative. Your booking is charged in {baseCode}.</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
