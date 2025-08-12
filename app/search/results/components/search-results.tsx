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
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin } from 'lucide-react'

interface SearchResultsProps {
  results: SearchResult | null
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
  }
}

export function SearchResults({ results, searchParams }: SearchResultsProps) {
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: [0, Number.MAX_VALUE] as [number, number],
    minRating: 0,
    features: [] as string[]
  })
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'capacity'>('price')

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

  // Handle route with vehicle types
  if (results.type === 'route' && results.vehicleTypes) {
    if (results.vehicleTypes.length === 0) {
      return <EmptyState searchParams={searchParams} />
    }

    return (
    <div className="space-y-8">
      {/* Route Information Banner */}
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">{results.routeName}</h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{results.originName} to {results.destinationName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{results.distance} km journey</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Type Category Tabs */}
      <div className="max-w-7xl mx-auto">
        {results.vehicleTypesByCategory && results.vehicleTypesByCategory.length > 0 ? (
          <VehicleTypeCategoryTabs
            vehicleTypesByCategory={results.vehicleTypesByCategory}
            allVehicleTypes={results.vehicleTypes}
            routeId={results.routeId || ''}
            searchParams={searchParams}
          />
        ) : (
          /* Fallback to grid if no categories */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.vehicleTypes.map(vehicleType => (
              <VehicleTypeGridCard
                key={vehicleType.id}
                vehicleType={vehicleType}
                routeId={results.routeId || ''}
                searchParams={searchParams}
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