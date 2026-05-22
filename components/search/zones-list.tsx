'use client'

import { MapPin, ArrowRight } from 'lucide-react'
import { ZoneResult } from '@/app/search/results/actions'
import { useRouter } from 'next/navigation'
import { buildSearchUrl } from '@/lib/utils/url-builder'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'

interface ZonesListProps {
  zones: ZoneResult[]
  searchParams: {
    from?: string
    date?: string
    passengers?: string
  }
}

export function ZonesList({ zones, searchParams }: ZonesListProps) {
  const router = useRouter()
  const { currentCurrency, exchangeRates } = useCurrency()

  const handleZoneSelect = (zone: ZoneResult): void => {
    if (zone.fromZone.slug && zone.toZone.slug && searchParams.date && searchParams.passengers) {
      router.push(buildSearchUrl(zone.fromZone.slug, zone.toZone.slug, {
        date: searchParams.date,
        passengers: searchParams.passengers,
      }))
    } else {
      const params = new URLSearchParams()
      if (searchParams.from) params.append('from', searchParams.from)
      if (searchParams.date) params.append('date', searchParams.date)
      if (searchParams.passengers) params.append('passengers', searchParams.passengers)
      router.push(`/search/results?${params.toString()}`)
    }
  }

  if (zones.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="font-display text-[1.125rem] font-medium text-[var(--text-muted)]">
          No zones available from this location
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {zones.map((zone, index) => {
        const lowestPrice =
          zone.vehicleTypes.length > 0
            ? Math.min(...zone.vehicleTypes.map((vt) => vt.price))
            : null

        return (
          <article
            key={index}
            className="rounded-[8px] border border-[rgba(var(--gold-rgb),0.15)] bg-[var(--charcoal)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-[rgba(var(--gold-rgb),0.25)] hover:shadow-[0_12px_24px_-6px_rgba(var(--gold-rgb),0.15),0_4px_10px_-4px_rgba(var(--gold-rgb),0.1)]"
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-[1.125rem] font-semibold leading-tight tracking-[-0.01em] text-[var(--text-primary)]">
                  {zone.toZone.name}
                </h3>
                <span className="numeric text-[0.875rem] font-semibold text-[var(--gold-text)]">
                  From {formatPrice(zone.basePrice, currentCurrency, exchangeRates)}
                </span>
              </div>
              {zone.toZone.description && (
                <p className="mt-1.5 text-[0.875rem] text-[var(--text-secondary)]">
                  {zone.toZone.description}
                </p>
              )}
            </div>

            {/* Details */}
            <dl className="space-y-2.5 px-6 pb-4">
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <dd className="text-[0.875rem] text-[var(--text-secondary)]">
                  {zone.fromZone.name} &rarr; {zone.toZone.name}
                </dd>
              </div>

              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <dd className="text-[0.875rem] text-[var(--text-secondary)]">
                  {zone.vehicleTypes.length} vehicle types available
                </dd>
              </div>

              {lowestPrice !== null && (
                <div className="pt-0.5">
                  <span className="text-[0.75rem] text-[var(--text-muted)]">
                    Starting from{' '}
                    <span className="numeric font-semibold text-[var(--text-secondary)]">
                      {formatPrice(lowestPrice, currentCurrency, exchangeRates)}
                    </span>
                  </span>
                </div>
              )}
            </dl>

            {/* CTA */}
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={() => handleZoneSelect(zone)}
                aria-label={`View vehicles for transfer to ${zone.toZone.name}`}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[4px] bg-[linear-gradient(180deg,var(--gold)_0%,var(--gold-medium)_100%)] px-5 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[var(--onyx)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_4px_16px_-2px_rgba(var(--gold-rgb),0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
              >
                View Vehicles
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
