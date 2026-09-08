'use client'

/**
 * Currency Rate Line
 *
 * The active-currency readout under the picker title: which currency prices
 * are shown in, its full name, and what one unit of the base currency buys.
 * Reads exchangeRates straight off the provider, so it costs no extra request.
 */

import { useCurrency } from '@/lib/currency/context'

const BASE_CURRENCY_FALLBACK = 'AED'

/** Trims a rate to something readable without pretending to more precision than it has. */
function formatRate(rate: number): string {
  if (rate >= 100) return rate.toFixed(1)
  if (rate >= 1) return rate.toFixed(2)
  return rate.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
}

function Segment({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="h-[3px] w-[3px] shrink-0 rounded-full bg-[var(--text-muted)]"
      />
      {children}
    </span>
  )
}

export function CurrencyRateLine() {
  const { currentCurrency, exchangeRates, allCurrencies } = useCurrency()

  const active = allCurrencies.find((c) => c.code === currentCurrency)
  const baseCode =
    allCurrencies.find((c) => c.isDefault)?.code ?? BASE_CURRENCY_FALLBACK

  const rate = exchangeRates[currentCurrency]
  const isBase = currentCurrency === baseCode
  const hasRate = typeof rate === 'number' && Number.isFinite(rate) && rate > 0

  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)] tabular-nums">
      <span>Showing prices in</span>
      <span className="font-semibold tracking-[0.06em] text-[var(--gold-text)]">
        {currentCurrency}
      </span>

      {/* Each separator travels with the text it introduces, so a wrap never
          strands a bare dot at the end of a line. */}
      {active?.name && <Segment>{active.name}</Segment>}

      {(isBase || hasRate) && (
        <Segment>
          {isBase
            ? 'Base currency'
            : `1 ${baseCode} = ${formatRate(rate)} ${currentCurrency}`}
        </Segment>
      )}
    </p>
  )
}
