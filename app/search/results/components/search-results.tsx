'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { SearchResult } from '../actions'
import { VehicleTypeCategoryTabs } from './vehicle-type-category-tabs'
import { EmptyState } from './empty-state'
import { ResultsGuestPicker } from './results-guest-picker'
import { ResultsDatePicker } from './results-date-picker'
import { RouteConnector } from './route-connector'
import { PopularRoutesList } from './popular-routes-list'
import { VehicleCategoriesList } from './vehicle-categories-list'
import { ZonesList } from '@/components/search/zones-list'
import { ArrowLeft, Clock, MapPin } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { formatResultPrice } from './format-result-price'
import { useCurrency } from '@/lib/currency/context'
import type { ResultsSearchParams } from './results-search-params'
import { BookingStepsBand } from './booking-steps-band'

/**
 * What happens after Select, in order.
 *
 * This band used to restate the three guarantees, which turned out to duplicate
 * the footer's own guarantee cards word for word, one section below. These are
 * a real sequence, so `promise-card__index` earns its numbering here, and every
 * line restates something the page or the footer already commits to rather than
 * making a new promise.
 */
const BOOKING_STEPS = [
  {
    index: '01',
    title: 'Choose your vehicle',
    body: 'Every class on this route, with seats and bags. The price shown is the full fare.',
    foot: 'On this page',
  },
  {
    index: '02',
    title: 'Confirm and pay',
    body: 'Passenger details, then payment. The fare is fixed at booking and does not move after it.',
    foot: 'Free cancellation for 24 hours',
  },
  {
    index: '03',
    title: 'Meet your chauffeur',
    body: '45 minutes of free waiting at pickup, tracked airport arrivals included.',
    foot: 'Name board at the door',
  },
]

interface SearchResultsProps {
  results: SearchResult | null
  /**
   * The route band's street map, rendered by the page. It is a server
   * component (see route-band-map.tsx) and this file is a client component, so
   * it arrives as a slot rather than an import: its geometry is built in
   * nested loops at module load, which has no business running in the browser.
   */
  routeMap?: React.ReactNode
  searchParams: ResultsSearchParams
}

/**
 * The alternative result shapes (zones, popular routes, categories) render
 * their own headers. They only need the band around them, so that dropping the
 * page-level `.luxury-container` does not leave them full-bleed.
 */
function ResultsBand({ children }: { children: React.ReactNode }) {
  return (
    <section className="editorial-section editorial-section--raised grow">
      <div className="luxury-container">{children}</div>
    </section>
  )
}

export function SearchResults({ results, routeMap, searchParams }: SearchResultsProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const prefersReducedMotion = useReducedMotion()
  const vehicleTypes = useMemo(() => results?.vehicleTypes ?? [], [results?.vehicleTypes])
  const vehicleTypesByCategory = useMemo(() => results?.vehicleTypesByCategory ?? [], [results?.vehicleTypesByCategory])

  if (!results) {
    // No result envelope at all, so there are no resolved names to show.
    return <EmptyState searchParams={searchParams} />
  }

  // Handle different result types
  if (results.type === 'zones' && results.zones) {
    return (
      <ResultsBand>
        <ZonesList zones={results.zones} searchParams={searchParams} />
      </ResultsBand>
    )
  }

  if (results.type === 'routes' && results.routes) {
    return (
      <ResultsBand>
        <PopularRoutesList routes={results.routes} searchParams={searchParams as any} />
      </ResultsBand>
    )
  }

  if (results.type === 'categories' && results.categories) {
    return (
      <ResultsBand>
        <VehicleCategoriesList categories={results.categories} searchParams={searchParams as any} />
      </ResultsBand>
    )
  }

  // Handle redirect type (this shouldn't normally be reached as page.tsx handles it)
  if (results.type === 'redirect') {
    return <EmptyState originName={results.originName} destinationName={results.destinationName} searchParams={searchParams} />
  }

  // Handle route or zone with vehicle types
  if ((results.type === 'route' || results.type === 'zone') && results.vehicleTypes) {
    if (results.vehicleTypes.length === 0) {
      return <EmptyState originName={results.originName} destinationName={results.destinationName} searchParams={searchParams} />
    }

    const isRoundTrip = searchParams.trip?.trip === 'round_trip'

    // Calculate min price from vehicle types. On a round trip only bookable vehicles count:
    // one with no return price keeps its one-way figure and must not set the "from" price.
    const pricedTypes = isRoundTrip
      ? results.vehicleTypes.filter(vt => vt.availableVehicles > 0)
      : results.vehicleTypes
    const minPrice = pricedTypes.length > 0
      ? Math.min(...pricedTypes.map(vt => vt.price))
      : 0

    const isSameZone = results.type === 'zone' && results.zone
      && results.zone.fromZone.id === results.zone.toZone.id
    const routeHeading = results.routeName || `${results.originName} → ${results.destinationName}`

    const zoneLabel = results.type === 'zone' && results.zone
      ? (isSameZone
          ? `Within ${results.zone.fromZone.name}`
          : `${results.zone.fromZone.name} → ${results.zone.toZone.name}`)
      : null

    // A zone pair has no routes row, so it has no distance. The fact is left
    // out rather than filled with a placeholder; the ledger closes the gap on
    // its own, which is why it no longer needs a column count.
    const journey = results.type !== 'zone' && results.distance ? results.distance : null

    return (
      <>
        {/* ---- Band 1: the trip ----------------------------------------
            Ground, not raised. PublicLayout renders `main.pt-20` on
            `bg-background`, which resolves to --black-void in both themes, so a
            raised first band would put an unexplained seam under the fixed
            header with no border to justify it.

            --compact, because the full section padding pushes the first vehicle
            row off a laptop screen and `priority` would then preload images
            nobody can see. */}
        <motion.section
          aria-label={routeHeading}
          className="route-band editorial-section editorial-section--ground editorial-section--compact"
          // This band is above the fold on load, so it animates on mount rather
          // than in view. See the note in vehicle-type-grid-card: `animate` must
          // always be supplied or reduced-motion users never see it at all.
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.5,
            delay: prefersReducedMotion ? 0 : 0.1,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {routeMap}

          {/* The map layer is absolutely positioned, so it would paint over
              static content no matter what order the DOM is in. */}
          <div className="luxury-container relative z-10">
            {/* The only way back to a fresh search. It used to exist solely on
                the query-param route, inside SearchSummary; the canonical route
                had none at all. */}
            <Link href="/" className="editorial-action">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              New search
            </Link>

            <div className="mt-8 max-w-4xl">
              <p className="editorial-eyebrow editorial-eyebrow--pill"><i aria-hidden="true" />{isRoundTrip ? 'Your round trip' : 'Your route'}</p>

              {/* The one h1 on the page, on the same type ramp as every home h2
                  rather than a bespoke clamp of its own. */}
              <h1 className="route-heading editorial-section-title mt-5">
                <span className="route-heading__place">{results.originName}</span>
                {/* Decorative, so the relationship it draws is spelled out for a
                    screen reader - which the bare arrow it replaces never was. */}
                <RouteConnector />
                <span className="sr-only"> to </span>
                <span className="route-heading__place">{results.destinationName}</span>
              </h1>

              {zoneLabel && (
                <p className="mt-4 inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--text-secondary)]">
                  <MapPin className="h-3.5 w-3.5 flex-none text-[var(--gold-text)]" aria-hidden="true" />
                  {zoneLabel}
                </p>
              )}
            </div>

            {/* Date and Guests stay editable. Distance, where the route has
                one, sits between them and the fare rather than on its own line
                above. */}
            <dl className="trip-ledger mt-10">
              <div className="trip-ledger__item">
                <dt className="trip-ledger__label">{isRoundTrip ? 'Depart' : 'Date'}</dt>
                <dd className="trip-ledger__value">
                  <ResultsDatePicker searchParams={searchParams} />
                </dd>
              </div>

              {isRoundTrip && (
                <div className="trip-ledger__item">
                  <dt className="trip-ledger__label">Return</dt>
                  <dd className="trip-ledger__value">
                    <ResultsDatePicker searchParams={searchParams} field="return" />
                  </dd>
                </div>
              )}

              <div className="trip-ledger__item">
                <dt className="trip-ledger__label">Guests</dt>
                {/* The one editable value that is not already a button-looking
                    control. A dashed gold underline keeps the affordance and
                    lets it sit at the same weight as its neighbours. */}
                <dd className="trip-ledger__value">
                  <ResultsGuestPicker
                    searchParams={searchParams}
                    className="inline-flex min-h-9 items-center gap-1.5 border-b border-dashed border-[rgba(var(--gold-rgb),0.45)] bg-transparent pb-0.5 text-[1.0625rem] text-[var(--text-primary)] transition-colors hover:border-[var(--gold-text)]"
                  />
                </dd>
              </div>

              {journey && (
                <div className="trip-ledger__item">
                  <dt className="trip-ledger__label">Journey</dt>
                  <dd className="trip-ledger__value">
                    <Clock className="h-3.5 w-3.5 flex-none text-[var(--gold-text)]" aria-hidden="true" />
                    <span className="numeric">{journey} km</span>
                  </dd>
                </div>
              )}

              <div className="trip-ledger__item trip-ledger__item--price">
                <dt className="trip-ledger__label">
                  {isRoundTrip ? 'Round trip from' : results.type === 'zone' && results.zone ? 'Base price' : 'From'}
                </dt>
                <dd className="trip-ledger__value numeric">
                  {formatResultPrice(!isRoundTrip && results.type === 'zone' && results.zone ? results.zone.basePrice : minPrice, currentCurrency, exchangeRates)}
                </dd>
              </div>
            </dl>
          </div>
        </motion.section>

        {/* ---- Band 2: the fleet for this trip -------------------------- */}
        <section className="editorial-section editorial-section--raised border-t border-[var(--graphite)]">
          <div className="luxury-container">
            <motion.header
              className="max-w-2xl"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <p className="editorial-eyebrow editorial-eyebrow--pill"><i aria-hidden="true" />The fleet</p>
              <h2 className="editorial-section-title mt-5">Every vehicle that runs this transfer.</h2>
              <p className="editorial-body mt-6">
                Every price is the full fare: vehicle, chauffeur, fuel, tolls and parking. Choose on
                capacity and luggage, not on fine print.
              </p>
            </motion.header>

            {/* `key` on party size remounts this with fresh tab/page state. It holds currentPage and
                activeCategory internally and only resets them on tab/sort change, but a searchParams
                navigation keeps it mounted while the vehicle list changes underneath, so page 3 of 18
                vehicles would slice an empty window out of the new, shorter list and render a blank grid. */}
            <div className="mt-12">
              <VehicleTypeCategoryTabs
                key={`${searchParams.passengers}-${searchParams.trip?.trip ?? 'one_way'}`}
                vehicleTypesByCategory={vehicleTypesByCategory}
                allVehicleTypes={vehicleTypes}
                searchParams={searchParams}
              />
            </div>
          </div>
        </section>

        {/* ---- Band 3: what the fare covers ----------------------------- */}
        <BookingStepsBand steps={BOOKING_STEPS} />
      </>
    )
  }

  // Default empty state
  return <EmptyState originName={results.originName} destinationName={results.destinationName} searchParams={searchParams} />
}
