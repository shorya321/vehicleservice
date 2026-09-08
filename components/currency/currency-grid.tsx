'use client'

/**
 * Currency Grid
 *
 * The card grid and its grouping. With no query the list splits into Featured
 * (whatever is flagged at Settings -> Currencies) and everything else; while a
 * query is active the grouping collapses to a single flat result list, because
 * a search result set has no meaningful sections.
 */

import { Coins } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { CurrencyInfo } from '@/lib/currency/types'
import { CurrencyCard } from './currency-card'

interface CurrencyGridProps {
  items: CurrencyInfo[]
  currentCurrency: string
  onSelect: (code: string) => void
}

export function CurrencyGrid({
  items,
  currentCurrency,
  onSelect,
}: CurrencyGridProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Currencies"
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2"
    >
      {items.map((currency) => (
        <Tooltip key={currency.code}>
          <TooltipTrigger asChild>
            <CurrencyCard
              currency={currency}
              isSelected={currency.code === currentCurrency}
              onSelect={onSelect}
            />
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="bg-[var(--black-warm)] border border-[var(--graphite)] text-[var(--text-secondary)] text-xs font-medium"
          >
            {currency.name}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
      {children}
      <span aria-hidden="true" className="h-px flex-1 bg-[var(--graphite)]" />
    </p>
  )
}

interface CurrencyResultsProps {
  results: CurrencyInfo[]
  featured: CurrencyInfo[]
  rest: CurrencyInfo[]
  isSearching: boolean
  currentCurrency: string
  onSelect: (code: string) => void
}

export function CurrencyResults({
  results,
  featured,
  rest,
  isSearching,
  currentCurrency,
  onSelect,
}: CurrencyResultsProps) {
  if (results.length === 0) return null

  if (isSearching) {
    return (
      <CurrencyGrid
        items={results}
        currentCurrency={currentCurrency}
        onSelect={onSelect}
      />
    )
  }

  return (
    <>
      {featured.length > 0 && (
        <div className="mb-6">
          <SectionLabel>Featured</SectionLabel>
          <CurrencyGrid
            items={featured}
            currentCurrency={currentCurrency}
            onSelect={onSelect}
          />
        </div>
      )}
      {rest.length > 0 && (
        <div>
          <SectionLabel>
            {featured.length > 0 ? 'All currencies' : 'Currencies'}
          </SectionLabel>
          <CurrencyGrid
            items={rest}
            currentCurrency={currentCurrency}
            onSelect={onSelect}
          />
        </div>
      )}
    </>
  )
}

export function CurrencyEmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
      <div className="w-11 h-11 rounded-md bg-[rgba(var(--gold-rgb),0.08)] flex items-center justify-center">
        <Coins className="h-[18px] w-[18px] text-[rgba(var(--gold-text-rgb),0.5)]" />
      </div>
      <p className="text-sm text-[var(--text-secondary)]">
        No currency matches &quot;{query}&quot;
      </p>
      <span className="text-[0.8125rem] text-[var(--text-muted)]">
        Try a code such as AED, or a country name.
      </span>
    </div>
  )
}
