'use client'

import { useState, useMemo, useCallback } from 'react'
import { SearchResult } from '../actions'
import { VehicleTypeCategoryTabs } from './vehicle-type-category-tabs'
import { EmptyState } from './empty-state'
import { ResultsGuestPicker } from './results-guest-picker'
import { ResultsDatePicker } from './results-date-picker'
import { PopularRoutesList } from './popular-routes-list'
import { VehicleCategoriesList } from './vehicle-categories-list'
import { ZonesList } from '@/components/search/zones-list'
import { Clock, MapPin, SlidersHorizontal, X } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { formatResultPrice } from './format-result-price'
import { useCurrency } from '@/lib/currency/context'

const filterStaggerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const filterGroupVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const } },
}

const RAIL_LABEL =
  'text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]'

/**
 * Left-aligned sibling of the hero's `.hero-trust` strip. Same 4px gold dot and
 * same three promises the home page already publishes, restated at the point
 * where the vehicle is actually chosen rather than four sections earlier.
 */
const RESULT_GUARANTEES = ['Fixed price at booking', 'Free cancellation', '24/7 support'] as const

interface SearchResultsProps {
  results: SearchResult | null
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
    adults?: string
    children?: string
    infants?: string
    originSlug?: string
    destSlug?: string
  }
}

export function SearchResults({ results, searchParams }: SearchResultsProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const prefersReducedMotion = useReducedMotion()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  const vehicleTypes = useMemo(() => results?.vehicleTypes ?? [], [results?.vehicleTypes])
  const vehicleTypesByCategory = useMemo(() => results?.vehicleTypesByCategory ?? [], [results?.vehicleTypesByCategory])

  const allFeatures = useMemo(() => {
    const set = new Set<string>()
    for (const vt of vehicleTypes) {
      for (const f of vt.features) set.add(f)
    }
    return Array.from(set).sort()
  }, [vehicleTypes])

  const hasActiveFilters = selectedFeatures.length > 0

  // No capacity filter here: the Guests picker is the single party-size authority and the server
  // already filters on `.gte('passenger_capacity', passengers)`. A client capacity filter could only
  // ever narrow *below* the party size, i.e. to zero results.
  const filteredVehicleTypes = useMemo(() => {
    return vehicleTypes.filter(vt => {
      if (selectedFeatures.length > 0 && !selectedFeatures.every(f => vt.features.includes(f))) return false
      return true
    })
  }, [vehicleTypes, selectedFeatures])

  const filteredByCategory = useMemo(() => {
    if (!hasActiveFilters) return vehicleTypesByCategory
    return vehicleTypesByCategory
      .map(cat => ({
        ...cat,
        vehicleTypes: cat.vehicleTypes.filter(vt => filteredVehicleTypes.some(fv => fv.id === vt.id)),
      }))
      .filter(cat => cat.vehicleTypes.length > 0)
  }, [vehicleTypesByCategory, filteredVehicleTypes, hasActiveFilters])

  const toggleFeature = useCallback((feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    )
  }, [])

  // Deliberately does not touch guests. That lives in the URL, and clearing filters must never
  // trigger a navigation.
  const clearFilters = useCallback(() => {
    setSelectedFeatures([])
  }, [])

  if (!results) {
    return <EmptyState searchParams={searchParams} />
  }

  // Handle different result types
  if (results.type === 'zones' && results.zones) {
    return <ZonesList zones={results.zones} searchParams={searchParams} />
  }

  if (results.type === 'routes' && results.routes) {
    return <PopularRoutesList routes={results.routes} searchParams={searchParams as any} />
  }

  if (results.type === 'categories' && results.categories) {
    return <VehicleCategoriesList categories={results.categories} searchParams={searchParams as any} />
  }

  // Handle redirect type (this shouldn't normally be reached as page.tsx handles it)
  if (results.type === 'redirect') {
    return <EmptyState searchParams={searchParams} />
  }

  // Handle route or zone with vehicle types
  if ((results.type === 'route' || results.type === 'zone') && results.vehicleTypes) {
    if (results.vehicleTypes.length === 0) {
      return <EmptyState searchParams={searchParams} />
    }

    // Calculate min price from vehicle types
    const minPrice = results.vehicleTypes.length > 0
      ? Math.min(...results.vehicleTypes.map(vt => vt.price))
      : 0

    const isSameZone = results.type === 'zone' && results.zone
      && results.zone.fromZone.id === results.zone.toZone.id
    const routeHeading = results.routeName || `${results.originName} → ${results.destinationName}`

    const zoneLabel = results.type === 'zone' && results.zone
      ? (isSameZone
          ? `Within ${results.zone.fromZone.name}`
          : `${results.zone.fromZone.name} → ${results.zone.toZone.name}`)
      : null

    return (
    <div className="space-y-12 lg:space-y-16">
      <motion.section
        aria-label={routeHeading}
        // See the note in vehicle-type-grid-card: `animate` must always be
        // supplied or reduced-motion users never see this section at all.
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.5,
          delay: prefersReducedMotion ? 0 : 0.1,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <p className="editorial-eyebrow">Route</p>

        {/* The one h1 on the page. It used to share the role with an sr-only
            copy above it, so the route was announced twice. */}
        <h1 className="mt-[1.15rem] text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.028em] text-[var(--text-primary)]">
          {results.originName}
          <span className="mx-3 font-normal text-[var(--gold-text)]" aria-hidden="true">→</span>
          {results.destinationName}
        </h1>

        {(zoneLabel || (results.type !== 'zone' && results.distance)) && (
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-[var(--text-secondary)]">
            {zoneLabel && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
                {zoneLabel}
              </span>
            )}
            {/* The route name itself is the h1 directly above, so this line
                carries distance only and no longer repeats it. */}
            {results.type !== 'zone' && results.distance && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
                <span className="numeric font-medium">{results.distance} km</span>
              </span>
            )}
          </p>
        )}

        {/* Equal-height cells. The previous four-cell row was bottom-aligned,
            and the Guests cell is taller because it holds a control, so the
            Date and price labels sat below the Guests label. */}
        <dl className="mt-7 grid grid-cols-2 gap-y-5 border-t border-[var(--graphite)] pt-5 sm:grid-cols-3">
          <div className="pr-4">
            <dt className={RAIL_LABEL}>Date</dt>
            {/* Editable, like Guests beside it. The two values in this rail
                used to behave differently: the only way to shift the trip by a
                day was to go back to the home page and search again. */}
            <dd className="mt-1">
              <ResultsDatePicker searchParams={searchParams} />
            </dd>
          </div>

          <div className="border-l border-[var(--graphite)] pl-4 sm:pl-[clamp(1rem,3vw,2rem)]">
            <dt className={RAIL_LABEL}>Guests</dt>
            {/* Guests is the one editable value in this rail. Its default
                trigger is a full-width bordered box, which read as a stray form
                field between two plain-text cells. A dashed gold underline
                keeps the affordance and lets it sit at the same weight as its
                neighbours. */}
            <dd className="mt-1">
              <ResultsGuestPicker
                searchParams={searchParams}
                className="inline-flex min-h-9 items-center gap-1.5 border-b border-dashed border-[rgba(var(--gold-rgb),0.45)] bg-transparent pb-0.5 text-[1.0625rem] text-[var(--text-primary)] transition-colors hover:border-[var(--gold-text)]"
              />
            </dd>
          </div>

          <div className="col-span-2 border-t border-[var(--graphite)] pt-5 sm:col-span-1 sm:border-l sm:border-t-0 sm:pl-[clamp(1rem,3vw,2rem)] sm:pt-0">
            <dt className={RAIL_LABEL}>
              {results.type === 'zone' && results.zone ? 'Base price' : 'From'}
            </dt>
            <dd className="numeric mt-2 text-[1.0625rem] font-semibold text-[var(--gold-text)]">
              {formatResultPrice(results.type === 'zone' && results.zone ? results.zone.basePrice : minPrice, currentCurrency, exchangeRates)}
            </dd>
          </div>
        </dl>

        <ul className="mt-6 flex list-none flex-wrap items-center gap-x-5 gap-y-1.5 p-0 text-[0.6875rem] font-medium uppercase tracking-[0.11em] text-[var(--text-muted)]">
          {RESULT_GUARANTEES.map((guarantee) => (
            <li
              key={guarantee}
              className="inline-flex items-center gap-2 before:h-1 before:w-1 before:flex-none before:rounded-full before:bg-[var(--gold)] before:opacity-[0.65] before:content-['']"
            >
              {guarantee}
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Filter bar */}
      {allFeatures.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setFiltersOpen(prev => !prev)}
            className={`inline-flex items-center gap-2 rounded-[4px] border px-4 py-2.5 text-[0.75rem] font-medium uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)] ${hasActiveFilters ? 'border-[rgba(var(--gold-rgb),0.4)] text-[var(--gold-text)]' : 'border-[var(--graphite)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            aria-expanded={filtersOpen}
            aria-controls="vehicle-filters"
            aria-label={hasActiveFilters ? `Filters (${selectedFeatures.length} active)` : 'Filters'}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--graphite)] text-[0.625rem] font-semibold text-[var(--text-primary)]">
                {selectedFeatures.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                id="vehicle-filters"
                initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  className="flex flex-wrap items-start gap-8 rounded-[8px] border border-[var(--graphite)] bg-[var(--charcoal)] px-6 py-5"
                  initial={prefersReducedMotion ? false : "hidden"}
                  animate={prefersReducedMotion ? undefined : "visible"}
                  variants={filterStaggerVariants}
                >

                  {allFeatures.length > 0 && (
                    <motion.div variants={prefersReducedMotion ? undefined : filterGroupVariants}>
                      <div className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">Features</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {allFeatures.map(feature => {
                          const active = selectedFeatures.includes(feature)
                          return (
                            <button
                              key={feature}
                              onClick={() => toggleFeature(feature)}
                              className={`rounded-[4px] border min-h-[44px] px-4 py-2.5 text-[0.75rem] transition-all duration-200 motion-safe:active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] ${active ? 'border-[var(--gold)] bg-[rgba(var(--gold-rgb),0.15)] font-semibold text-[var(--gold-text)]' : 'border-[var(--graphite)] text-[var(--text-muted)] hover:border-[rgba(var(--gold-rgb),0.3)] hover:text-[var(--text-secondary)]'}`}
                            >
                              {feature}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-auto inline-flex items-center gap-1.5 text-[0.75rem] uppercase tracking-[0.08em] text-[var(--text-muted)] transition-colors hover:text-[var(--gold-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                      Clear filters
                    </button>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {hasActiveFilters && filteredByCategory.length === 0 ? (
        <motion.div
          className="py-12 text-center"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-[0.875rem] text-[var(--text-secondary)]">No vehicles match your filters.</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-[0.75rem] uppercase tracking-[0.16em] text-[var(--gold-text)] transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
          >
            Clear all filters
          </button>
        </motion.div>
      ) : (
        // `key` on party size remounts this with fresh tab/page state. It holds currentPage and
        // activeCategory internally and only resets them on tab/sort change, but a searchParams
        // navigation keeps it mounted while the vehicle list changes underneath, so page 3 of 18
        // vehicles would slice an empty window out of the new, shorter list and render a blank grid.
        <VehicleTypeCategoryTabs
          key={searchParams.passengers}
          vehicleTypesByCategory={hasActiveFilters ? filteredByCategory : vehicleTypesByCategory}
          allVehicleTypes={hasActiveFilters ? filteredVehicleTypes : vehicleTypes}
          searchParams={searchParams}
        />
      )}
    </div>
    )
  }

  // Default empty state
  return <EmptyState searchParams={searchParams} />
}