'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { SearchResult, SearchResultVehicle, VehicleTypeResult } from '../actions'
import { VehicleCard } from './vehicle-card'
import { VehicleCategoryTabs } from './vehicle-category-tabs'
import { VehicleTypeCategoryTabs } from './vehicle-type-category-tabs'
import { VehicleTypeGridCard } from './vehicle-type-grid-card'
import { SearchFilters } from './search-filters'
import { EmptyState } from './empty-state'
import { PopularRoutesList } from './popular-routes-list'
import { VehicleCategoriesList } from './vehicle-categories-list'
import { ZoneResultCard } from '@/components/search/zone-result-card'
import { ZonesList } from '@/components/search/zones-list'
import { Clock, MapPin } from 'lucide-react'
import { motion } from 'motion/react'
import { formatPrice } from '@/lib/currency/format'

interface SearchResultsProps {
  results: SearchResult | null
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
  }
  currentCurrency: string
  exchangeRates: Record<string, number>
}

export function SearchResults({ results, searchParams, currentCurrency, exchangeRates }: SearchResultsProps) {
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: [0, Number.MAX_VALUE] as [number, number],
    minRating: 0,
    features: [] as string[]
  })
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'capacity'>('price')
  // Show vehicles immediately for zone transfers since user already selected the route
  const [showVehicles, setShowVehicles] = useState(results?.type === 'zone')

  // Memoize filtered and sorted vehicles to prevent unnecessary recalculations
  const filteredVehicles = useMemo(() => {
    if (results?.type !== 'route' || !results.vehicles) {
      return []
    }
      let filtered = results.vehicles!.filter(vehicle => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(vehicle.category)) {
        return false
      }

      // Price filter
      if (vehicle.price < filters.priceRange[0] || vehicle.price > filters.priceRange[1]) {
        return false
      }

      // Rating filter
      if (vehicle.vendorRating < filters.minRating) {
        return false
      }

      // Features filter
      if (filters.features.length > 0) {
        const hasAllFeatures = filters.features.every(feature =>
          vehicle.features.includes(feature)
        )
        if (!hasAllFeatures) return false
      }

      return true
    })

    // Apply sorting
    const sorted = [...filtered]
    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'rating':
        sorted.sort((a, b) => b.vendorRating - a.vendorRating)
        break
      case 'capacity':
        sorted.sort((a, b) => b.capacity - a.capacity)
        break
    }

      return sorted
    }, [results, filters, sortBy])

  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters)
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
    <div className="space-y-6">
      {/* Route/Zone Information Banner - Art Deco Style */}
      <motion.div
        className="relative bg-gradient-to-br from-luxury-charcoal via-luxury-charcoalLight to-luxury-charcoal border border-luxury-gold/15 rounded-2xl p-8 md:p-10 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Art Deco Corner - Top Left */}
        <div className="absolute top-4 left-4 w-16 h-16 md:w-20 md:h-20 border-l border-t border-luxury-gold/20 pointer-events-none" />
        {/* Art Deco Corner - Bottom Right */}
        <div className="absolute bottom-4 right-4 w-16 h-16 md:w-20 md:h-20 border-r border-b border-luxury-gold/20 pointer-events-none" />

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-[radial-gradient(ellipse,rgba(198,170,136,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Route Info */}
          <div className="space-y-3">
            {results.type === 'zone' && results.zone ? (
              <>
                <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl text-luxury-pearl">
                  Zone Transfer: {results.zone.fromZone.name} <span className="text-luxury-gold italic">&rarr;</span> {results.zone.toZone.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-luxury-lightGray">
                  <MapPin className="h-4 w-4 text-luxury-gold" aria-hidden="true" />
                  <span>{results.originName} to {results.destinationName}</span>
                </div>
              </>
            ) : (
              <>
                <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl text-luxury-pearl">
                  {results.routeName || `${results.originName} to ${results.destinationName}`}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-luxury-lightGray">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-luxury-gold" aria-hidden="true" />
                    <span>{results.originName} to {results.destinationName}</span>
                  </div>
                  {results.distance && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-luxury-gold" aria-hidden="true" />
                      <span>{results.distance} km journey</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Price Badge */}
          <div className="flex flex-col items-start md:items-end gap-1">
            <span className="text-[0.7rem] font-medium tracking-[0.1em] uppercase text-luxury-lightGray/70">
              {results.type === 'zone' && results.zone ? 'Base Price' : 'Starting from'}
            </span>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-luxury-gold/15 to-luxury-gold/5 border border-luxury-gold/30 rounded-lg">
              <span className="font-serif text-2xl md:text-3xl font-medium bg-gradient-to-br from-luxury-goldCream via-luxury-gold to-luxury-goldDark bg-clip-text text-transparent">
                {formatPrice(results.type === 'zone' && results.zone ? results.zone.basePrice : minPrice, currentCurrency, exchangeRates)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Vehicle Type Category Tabs */}
      <div>
        {results.vehicleTypesByCategory && results.vehicleTypesByCategory.length > 0 ? (
          <VehicleTypeCategoryTabs
            vehicleTypesByCategory={results.vehicleTypesByCategory}
            allVehicleTypes={results.vehicleTypes}
            searchParams={searchParams}
            currentCurrency={currentCurrency}
            exchangeRates={exchangeRates}
          />
        ) : (
          /* Fallback to grid if no categories */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.vehicleTypes.map(vehicleType => (
              <VehicleTypeGridCard
                key={vehicleType.id}
                vehicleType={vehicleType}
                searchParams={searchParams}
                currentCurrency={currentCurrency}
                exchangeRates={exchangeRates}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    )
  }

  // Default empty state
  return <EmptyState searchParams={searchParams} />
}