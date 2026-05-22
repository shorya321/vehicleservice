'use client'

import Link from 'next/link'
import { MapPin, Clock, Car, ArrowRight, ArrowLeft } from 'lucide-react'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import { RouteResult } from '../actions'

interface PopularRoutesListProps {
  routes: RouteResult[]
  searchParams: {
    from: string
    date: string
    passengers: string
  }
}

export function PopularRoutesList({ routes, searchParams }: PopularRoutesListProps) {
  const { currentCurrency, exchangeRates } = useCurrency()

  if (routes.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <MapPin className="mx-auto h-16 w-16 text-[var(--text-muted)]" strokeWidth={1.5} aria-hidden="true" />
        <div className="editorial-eyebrow mt-6">No routes</div>
        <h3 className="editorial-section-title mt-5">
          No routes available between these locations
        </h3>
        <p className="mt-5 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
          We don&apos;t have any routes available between these locations yet. Try a different origin or explore our popular routes.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <Link
            href="/"
            className="btn btn-primary"
            aria-label="Search another route"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Search Another Route
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="editorial-eyebrow">Popular routes</div>
        <h2 className="editorial-section-title mt-3">Select a Route</h2>
        <p className="mt-3 text-[0.875rem] text-[var(--text-secondary)]">
          Choose a route to see available vehicles
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => {
          const duration = route.duration
          const hours = Math.floor(duration / 60)
          const minutes = duration % 60
          const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

          const routeLink = `/search/results?${new URLSearchParams({
            ...searchParams,
            to: route.destinationId,
            routeId: route.id
          }).toString()}`

          return (
            <Link
              key={route.id}
              href={routeLink}
              className="group flex h-full flex-col rounded-[8px] border border-[rgba(var(--gold-rgb),0.15)] bg-[var(--charcoal)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-[rgba(var(--gold-rgb),0.25)] hover:shadow-[0_12px_24px_-6px_rgba(var(--gold-rgb),0.15),0_4px_10px_-4px_rgba(var(--gold-rgb),0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
              aria-label={`Select route: ${route.routeName}`}
            >
              <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
                {/* Route header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[1.125rem] font-semibold leading-tight tracking-[-0.01em] text-[var(--text-primary)] line-clamp-2">
                      {route.routeName}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 text-[0.8125rem] text-[var(--text-secondary)]">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                      <span className="truncate">{route.destinationName}</span>
                    </div>
                  </div>
                  <span className="flex-shrink-0 rounded-[4px] border border-[rgba(var(--gold-rgb),0.2)] bg-[rgba(var(--gold-rgb),0.08)] px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-[var(--gold-text)]">
                    {route.destinationType}
                  </span>
                </div>

                {/* Route details */}
                <div className="mt-4 flex items-center gap-5 text-[0.8125rem] text-[var(--text-muted)]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="numeric">{durationText}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="numeric">{route.availableVehicles}</span>
                    <span>vehicles</span>
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="mt-auto flex items-end justify-between gap-4 border-t border-[var(--graphite)] pt-5 mt-5">
                  <div>
                    <div className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      From
                    </div>
                    <div className="numeric mt-1 text-[1.5rem] font-semibold text-[var(--gold-text)]">
                      {formatPrice(route.minPrice, currentCurrency, exchangeRates)}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[var(--gold-text)] transition-colors duration-300 group-hover:text-[var(--gold)]">
                    Select Route
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
