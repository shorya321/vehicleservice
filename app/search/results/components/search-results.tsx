'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { SearchResult, SearchResultVehicle } from '../actions'
import { VehicleCard } from './vehicle-card'
import { VehicleCategoryTabs } from './vehicle-category-tabs'
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

  // Handle route with vehicles
  if (results.type === 'route' && results.vehicles) {
    if (results.vehicles.length === 0) {
      return <EmptyState searchParams={searchParams} />
    }

    return (
    <div className="grid lg:grid-cols-[300px,1fr] gap-8">
      {/* Filters Sidebar */}
      <aside className="space-y-6">
        <div className="bg-card rounded-lg p-4 space-y-3">
          <h3 className="font-semibold">Route Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{results.routeName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{results.distance} km journey</span>
            </div>
          </div>
        </div>

        <SearchFilters
          vehicles={results.vehicles}
          onFiltersChange={handleFiltersChange}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </aside>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">
              {results.vehicles.length} Vehicles Available
            </h2>
          </div>
        </div>

        {/* Category Tabs */}
        {results.vehiclesByCategory && results.vehiclesByCategory.length > 0 ? (
          <VehicleCategoryTabs
            vehiclesByCategory={results.vehiclesByCategory}
            allVehicles={filteredVehicles}
            routeId={results.routeId || ''}
            searchParams={searchParams}
          />
        ) : (
          /* Fallback to regular list if no categories */
          <div className="grid gap-4">
            {filteredVehicles.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
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