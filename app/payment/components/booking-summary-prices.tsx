'use client'

import { useCurrency } from '@/lib/currency/context'
import { formatPrice } from '@/lib/currency/format'
import { Info } from 'lucide-react'

interface BookingSummaryPricesProps {
  basePrice: number
  amenitiesPrice: number
  totalPrice: number
}

export function BookingSummaryPrices({ basePrice, amenitiesPrice, totalPrice }: BookingSummaryPricesProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const formatUserPrice = (amount: number) => formatPrice(amount, currentCurrency, exchangeRates)
  const isConverted = currentCurrency !== 'AED'

  return (
    <>
      <dl className="space-y-2.5 text-[0.875rem]">
        <div className="flex items-baseline justify-between">
          <dt className="text-[var(--text-secondary)]">Base fare</dt>
          <dd className="numeric text-[var(--text-primary)]">{formatUserPrice(basePrice)}</dd>
        </div>
        {amenitiesPrice > 0 && (
          <div className="flex items-baseline justify-between">
            <dt className="text-[var(--text-secondary)]">Additional services</dt>
            <dd className="numeric text-[var(--text-primary)]">{formatUserPrice(amenitiesPrice)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between">
          <dt className="text-[var(--text-secondary)]">Meet &amp; greet</dt>
          <dd className="text-[var(--text-muted)] uppercase tracking-[0.16em] text-[0.6875rem]">Included</dd>
        </div>
      </dl>

      <div className="mt-5 flex items-baseline justify-between border-t border-[var(--graphite)] pt-5">
        <span className="t-label">
          Total
        </span>
        <span className="numeric text-2xl sm:text-3xl text-[var(--text-primary)]">
          {formatUserPrice(totalPrice)}
        </span>
      </div>

      {isConverted && (
        <p className="mt-3 flex items-start gap-2 text-[0.75rem] text-[var(--text-muted)]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Shown in {currentCurrency}. Charged in AED ({formatPrice(totalPrice, 'AED', exchangeRates)}).
          </span>
        </p>
      )}
    </>
  )
}
