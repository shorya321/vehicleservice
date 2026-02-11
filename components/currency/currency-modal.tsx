'use client'

/**
 * Currency Selection Modal
 *
 * Full-screen modal with search and grid of all enabled currencies.
 * Opens from the "Show all currencies" option in the currency dropdown.
 * Uses CurrencyProvider context for instant switching.
 */

import { useState, useMemo } from 'react'
import { Check, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getCurrencyFlag } from '@/lib/currency/format'
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
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Currency</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[var(--charcoal)]/50 border-[var(--gold)]/20 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            autoFocus
          />
        </div>

        {/* Currency Grid */}
        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-2">
            {filteredCurrencies.map((currency) => {
              const isSelected = currency.code === currentCurrency

              return (
                <button
                  key={currency.code}
                  onClick={() => handleSelect(currency.code)}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg text-left transition-all duration-200
                    ${isSelected
                      ? 'bg-[var(--gold)]/15 border border-[var(--gold)]/40'
                      : 'bg-[var(--charcoal)]/30 border border-transparent hover:border-[var(--gold)]/20 hover:bg-[var(--gold)]/5'
                    }
                  `}
                >
                  <span className="text-sm shrink-0">{getCurrencyFlag(currency.code)}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {currency.code}
                  </span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-[var(--gold)] shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          {filteredCurrencies.length === 0 && (
            <div className="text-center py-8 text-[var(--text-muted)]">
              No currencies found matching &quot;{search}&quot;
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
