'use client'

import { useState, useMemo, useCallback } from 'react'
import { SearchResult } from '../actions'
import { VehicleTypeCategoryTabs } from './vehicle-type-category-tabs'
import { EmptyState } from './empty-state'
import { PopularRoutesList } from './popular-routes-list'
import { VehicleCategoriesList } from './vehicle-categories-list'
import { ZoneResultCard } from '@/components/search/zone-result-card'
import { ZonesList } from '@/components/search/zones-list'
import { Clock, MapPin, SlidersHorizontal, X } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'

const filterStaggerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const filterGroupVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const } },
}

interface SearchResultsProps {
  results: SearchResult | null
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
    originSlug?: string
    destSlug?: string
  }
}

type CapacityFilter = 'any' | '1-4' | '5-8' | '9+'

export function SearchResults({ results, searchParams }: SearchResultsProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const prefersReducedMotion = useReducedMotion()
  const [showVehicles, setShowVehicles] = useState(results?.type === 'zone')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [capacityFilter, setCapacityFilter] = useState<CapacityFilter>('any')
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

  const hasActiveFilters = capacityFilter !== 'any' || selectedFeatures.length > 0

  const filteredVehicleTypes = useMemo(() => {
    return vehicleTypes.filter(vt => {
      if (capacityFilter === '1-4' && (vt.capacity < 1 || vt.capacity > 4)) return false
      if (capacityFilter === '5-8' && (vt.capacity < 5 || vt.capacity > 8)) return false
      if (capacityFilter === '9+' && vt.capacity < 9) return false
      if (selectedFeatures.length > 0 && !selectedFeatures.every(f => vt.features.includes(f))) return false
      return true
    })
  }, [vehicleTypes, capacityFilter, selectedFeatures])

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

  const clearFilters = useCallback(() => {
    setCapacityFilter('any')
    setSelectedFeatures([])
  }, [])

  if (!results) {
    return <EmptyState searchParams={searchParams} />
  }

  // Handle different result types
  if (results.type === 'zone' && results.zone) {
    // If showing zone and user hasn't proceeded to vehicles yet
    if (!showVehicles) {
      return (
        <div className="max-w-4xl mx-auto">
          <ZoneResultCard 
            zone={results.zone} 
            onProceed={() => setShowVehicles(true)}
          />
        </div>
      )
    }
    // Otherwise fall through to show vehicle types
  }

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
  if ((results.type === 'route' && results.vehicleTypes) || 
      (results.type === 'zone' && showVehicles && results.vehicleTypes)) {
    if (results.vehicleTypes.length === 0) {
      return <EmptyState searchParams={searchParams} />
    }

    // Calculate min price from vehicle types
    const minPrice = results.vehicleTypes.length > 0
      ? Math.min(...results.vehicleTypes.map(vt => vt.price))
      : 0

    return (
    <div className="space-y-12 lg:space-y-16">
      <motion.section
        className="rounded-[8px] border border-[rgba(var(--gold-rgb),0.15)] bg-[var(--black-warm)] dark:bg-[var(--charcoal)] py-10 lg:py-12 px-8 lg:px-10"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--gold-text)]">
              {results.type === 'zone' && results.zone ? 'Zone transfer' : 'Route'}
            </div>
            <h1 className="mt-3 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-tight tracking-[-0.015em] text-[var(--text-primary)]">
              {results.type === 'zone' && results.zone ? (
                <>
                  {results.zone.fromZone.name}
                  <span className="mx-3 text-[var(--gold-text)]" aria-hidden="true">→</span>
                  {results.zone.toZone.name}
                </>
              ) : (
                results.routeName || (
                  <>
                    {results.originName}
                    <span className="mx-3 text-[var(--gold-text)]" aria-hidden="true">→</span>
                    {results.destinationName}
                  </>
                )
              )}
            </h1>
            {results.type !== 'zone' && results.distance && (
              <p className="mt-4 flex items-baseline gap-5 text-[0.875rem] text-[var(--text-secondary)]">
                <span className="flex items-baseline gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
                  <span className="numeric font-medium">{results.distance} km</span>
                </span>
                <span className="flex items-baseline gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
                  <span>{results.originName} → {results.destinationName}</span>
                </span>
              </p>
            )}
          </div>

          <div className="md:text-right">
            <div className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {results.type === 'zone' && results.zone ? 'Base price' : 'From'}
            </div>
            <div className="numeric mt-1.5 text-[2rem] font-medium text-[var(--gold-text)]">
              {formatPrice(results.type === 'zone' && results.zone ? results.zone.basePrice : minPrice, currentCurrency, exchangeRates)}
            </div>
            <div className="mt-1 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
              per vehicle
            </div>
          </div>
        </div>
      </motion.section>

      {/* Filter bar */}
      {allFeatures.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setFiltersOpen(prev => !prev)}
            className="inline-flex items-center gap-2 rounded-[4px] border border-[var(--graphite)] px-4 py-2.5 text-[0.75rem] font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors hover:border-[var(--text-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
            aria-expanded={filtersOpen}
            aria-controls="vehicle-filters"
            aria-label={hasActiveFilters ? `Filters (${(capacityFilter !== 'any' ? 1 : 0) + selectedFeatures.length} active)` : 'Filters'}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--graphite)] text-[0.625rem] font-semibold text-[var(--text-primary)]">
                {(capacityFilter !== 'any' ? 1 : 0) + selectedFeatures.length}
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
                  className="flex flex-wrap items-start gap-8 rounded-[8px] border border-[var(--graphite)] bg-[var(--black-warm)] dark:bg-[var(--charcoal)] px-6 py-5"
                  initial={prefersReducedMotion ? false : "hidden"}
                  animate={prefersReducedMotion ? undefined : "visible"}
                  variants={filterStaggerVariants}
                >
                  <motion.div variants={prefersReducedMotion ? undefined : filterGroupVariants}>
                    <div className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">Capacity</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(['any', '1-4', '5-8', '9+'] as CapacityFilter[]).map(opt => (
                        <button
                          key={opt}
                          onClick={() => setCapacityFilter(opt)}
                          className={`rounded-[4px] border px-3 py-1.5 text-[0.75rem] uppercase tracking-[0.08em] transition-all duration-200 motion-safe:active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] ${capacityFilter === opt ? 'border-[var(--gold)] bg-[rgba(var(--gold-rgb),0.1)] text-[var(--gold-text)]' : 'border-[var(--graphite)] text-[var(--text-muted)] hover:border-[rgba(var(--gold-rgb),0.3)] hover:text-[var(--text-secondary)]'}`}
                        >
                          {opt === 'any' ? 'Any' : opt}
                        </button>
                      ))}
                    </div>
                  </motion.div>

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
                              className={`rounded-[4px] border px-3 py-1.5 text-[0.75rem] transition-all duration-200 motion-safe:active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] ${active ? 'border-[var(--gold)] bg-[rgba(var(--gold-rgb),0.1)] text-[var(--gold-text)]' : 'border-[var(--graphite)] text-[var(--text-muted)] hover:border-[rgba(var(--gold-rgb),0.3)] hover:text-[var(--text-secondary)]'}`}
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
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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
        <VehicleTypeCategoryTabs
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