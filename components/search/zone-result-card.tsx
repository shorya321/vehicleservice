'use client'

import { MapPin, ArrowRight, Car } from 'lucide-react'
import { ZoneResult } from '@/app/search/results/actions'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'

interface ZoneResultCardProps {
  zone: ZoneResult
  onProceed: () => void
}

export function ZoneResultCard({ zone, onProceed }: ZoneResultCardProps) {
  const { currentCurrency, exchangeRates } = useCurrency()

  const lowestPrice =
    zone.vehicleTypes.length > 0
      ? Math.min(...zone.vehicleTypes.map((vt) => vt.price))
      : null

  return (
    <article
      className="rounded-[8px] border border-[rgba(var(--gold-rgb),0.15)] bg-[var(--charcoal)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-[rgba(var(--gold-rgb),0.25)] hover:shadow-[0_12px_24px_-6px_rgba(var(--gold-rgb),0.15),0_4px_10px_-4px_rgba(var(--gold-rgb),0.1)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[var(--gold)]" />
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Zone Transfer
          </span>
        </div>
        <span className="numeric text-[1rem] font-semibold text-[var(--gold-text)]">
          From {formatPrice(zone.basePrice, currentCurrency, exchangeRates)}
        </span>
      </div>

      {/* Route display */}
      <div className="mx-6 rounded-[6px] border border-[rgba(var(--gold-rgb),0.08)] bg-[var(--black-void)] px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1 text-center">
            <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
              From
            </dt>
            <dd className="mt-1 font-display text-[1.125rem] font-semibold leading-tight tracking-[-0.01em] text-[var(--text-primary)]">
              {zone.fromZone.name}
            </dd>
            {zone.fromZone.description && (
              <dd className="mt-1 text-[0.75rem] text-[var(--text-muted)]">
                {zone.fromZone.description}
              </dd>
            )}
          </div>

          <ArrowRight className="h-5 w-5 shrink-0 text-[var(--gold)]" />

          <div className="min-w-0 flex-1 text-center">
            <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
              To
            </dt>
            <dd className="mt-1 font-display text-[1.125rem] font-semibold leading-tight tracking-[-0.01em] text-[var(--text-primary)]">
              {zone.toZone.name}
            </dd>
            {zone.toZone.description && (
              <dd className="mt-1 text-[0.75rem] text-[var(--text-muted)]">
                {zone.toZone.description}
              </dd>
            )}
          </div>
        </div>
      </div>

      {/* Specs */}
      <dl className="grid grid-cols-2 gap-4 px-6 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <Car className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <div>
            <dt className="text-[0.875rem] font-medium text-[var(--text-primary)]">
              {zone.vehicleTypes.length} Vehicle Types
            </dt>
            <dd className="text-[0.75rem] text-[var(--text-muted)]">
              Available for your journey
            </dd>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <div>
            <dt className="text-[0.875rem] font-medium text-[var(--text-primary)]">
              Zone Pricing
            </dt>
            <dd className="text-[0.75rem] text-[var(--text-muted)]">
              Base price &times; vehicle multiplier
            </dd>
          </div>
        </div>
      </dl>

      {/* CTA */}
      <div className="px-6 pt-3 pb-5">
        <button
          type="button"
          onClick={onProceed}
          aria-label={`View available vehicles from ${zone.fromZone.name} to ${zone.toZone.name}`}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[4px] bg-[linear-gradient(180deg,var(--gold)_0%,var(--gold-medium)_100%)] px-5 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[var(--onyx)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_4px_16px_-2px_rgba(var(--gold-rgb),0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
        >
          View Available Vehicles
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Lowest price hint */}
      {lowestPrice !== null && (
        <div className="border-t border-[rgba(var(--gold-rgb),0.08)] px-6 py-3 text-center">
          <span className="text-[0.75rem] text-[var(--text-muted)]">
            Prices start from{' '}
            <span className="numeric font-semibold text-[var(--text-secondary)]">
              {formatPrice(lowestPrice, currentCurrency, exchangeRates)}
            </span>{' '}
            for {zone.vehicleTypes[0].name}
          </span>
        </div>
      )}
    </article>
  )
}
