'use client'

/**
 * Currency Card
 *
 * One selectable currency in the picker grid: flag, code, symbol.
 * Card content is deliberately code + symbol only. The full name reaches
 * assistive tech and touch users through aria-label, and reaches sighted
 * desktop users through the tooltip the grid wraps this in.
 */

import { forwardRef } from 'react'
import { Check } from 'lucide-react'
import { getCurrencyFlag, getCurrencySymbol } from '@/lib/currency/format'
import type { CurrencyInfo } from '@/lib/currency/types'

interface CurrencyCardProps {
  currency: CurrencyInfo
  isSelected: boolean
  onSelect: (code: string) => void
}

export const CurrencyCard = forwardRef<HTMLButtonElement, CurrencyCardProps>(
  function CurrencyCard({ currency, isSelected, onSelect }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={isSelected}
        aria-label={`${currency.code}, ${currency.name}`}
        data-currency-card=""
        onClick={() => onSelect(currency.code)}
        className={`
          group relative flex flex-col items-center justify-center text-center
          px-3 py-3.5 rounded-md border
          transition-[border-color,background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
          focus:outline-none focus-visible:border-[var(--gold)]
          focus-visible:shadow-[0_0_0_3px_rgba(var(--gold-rgb),0.18)]
          motion-safe:hover:-translate-y-px
          ${isSelected
            ? 'bg-[rgba(var(--gold-rgb),0.1)] border-[var(--gold-text)]'
            : 'bg-[var(--black-warm)] border-[rgba(var(--graphite-rgb),0.95)] hover:border-[rgba(var(--gold-text-rgb),0.28)] hover:bg-[rgba(var(--gold-rgb),0.05)]'
          }
        `}
      >
        <span className="text-lg leading-none" aria-hidden="true">
          {getCurrencyFlag(currency.code)}
        </span>

        <span
          className={`mt-2 text-sm font-semibold tabular-nums tracking-[0.06em] transition-colors duration-200 ${
            isSelected ? 'text-[var(--gold-text)]' : 'text-[var(--text-primary)]'
          }`}
        >
          {currency.code}
        </span>

        {/* dir="auto" so RTL symbols (AED, KWD, SAR) order their own characters
            correctly instead of inheriting the page's LTR direction. */}
        <span
          dir="auto"
          className="mt-0.5 text-xs leading-tight text-[var(--text-secondary)]"
        >
          {getCurrencySymbol(currency.code)}
        </span>

        {/* Same icon, size and colour the header dropdown uses for the current
            currency, so "selected" reads identically on both surfaces. Decorative:
            role="radio" + aria-checked above already announce the state. */}
        {isSelected && (
          <Check
            aria-hidden="true"
            className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-[var(--gold-text)]"
          />
        )}
      </button>
    )
  }
)
