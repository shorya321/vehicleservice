'use client'

import { useState, useMemo, useEffect } from 'react'
import { VehicleTypeResult, VehicleTypesByCategory } from '../actions'
import { VehicleTypeGridCard } from './vehicle-type-grid-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface VehicleTypeCategoryTabsProps {
  vehicleTypesByCategory: VehicleTypesByCategory[]
  allVehicleTypes: VehicleTypeResult[]
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
  }
}

type SortOption = 'price-asc' | 'price-desc' | 'capacity' | 'name'

const ITEMS_PER_PAGE = 9

export function VehicleTypeCategoryTabs({
  vehicleTypesByCategory,
  allVehicleTypes,
  searchParams
}: VehicleTypeCategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('price-asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Reset page when category or sort changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategory, sortBy])

  // Get current vehicles based on active category
  const currentVehicles = useMemo(() => {
    if (activeCategory === 'all') {
      return allVehicleTypes
    }
    const category = vehicleTypesByCategory.find(c => c.categoryId === activeCategory)
    return category?.vehicleTypes || []
  }, [activeCategory, allVehicleTypes, vehicleTypesByCategory])

  // Sort vehicles
  const sortedVehicles = useMemo(() => {
    const vehicles = [...currentVehicles]
    switch (sortBy) {
      case 'price-asc':
        return vehicles.sort((a, b) => a.price - b.price)
      case 'price-desc':
        return vehicles.sort((a, b) => b.price - a.price)
      case 'capacity':
        return vehicles.sort((a, b) => b.capacity - a.capacity)
      case 'name':
        return vehicles.sort((a, b) => a.name.localeCompare(b.name))
      default:
        return vehicles
    }
  }, [currentVehicles, sortBy])

  // Pagination
  const totalPages = Math.ceil(sortedVehicles.length / ITEMS_PER_PAGE)
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedVehicles.slice(start, start + ITEMS_PER_PAGE)
  }, [sortedVehicles, currentPage])

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setActiveCategory(value)
  }

  return (
    <div className="w-full space-y-6">
      {/* Category Tabs - Luxury Pill Style */}
      <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full">
        <TabsList className="w-fit h-auto p-1 bg-[rgba(42,40,38,0.5)] border border-[rgba(198,170,136,0.1)] rounded-xl flex gap-1 overflow-x-auto">
          {/* All Vehicle Types Tab */}
          <TabsTrigger
            value="all"
            className="group flex items-center gap-2 whitespace-nowrap rounded-lg px-8 py-4 text-[0.75rem] font-medium tracking-[0.1em] uppercase transition-all duration-200
              data-[state=active]:bg-gradient-to-br data-[state=active]:from-luxury-gold data-[state=active]:to-luxury-goldDeep data-[state=active]:text-luxury-void data-[state=active]:shadow-[0_4px_15px_-5px_rgba(198,170,136,0.4)]
              data-[state=inactive]:text-luxury-textMuted data-[state=inactive]:hover:text-luxury-pearl data-[state=inactive]:hover:bg-[rgba(198,170,136,0.1)]"
          >
            <span>All</span>
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[0.625rem] font-semibold rounded bg-[rgba(198,170,136,0.2)] text-luxury-gold group-data-[state=active]:bg-[rgba(5,5,6,0.3)] group-data-[state=active]:text-luxury-void">
              {allVehicleTypes.length}
            </span>
          </TabsTrigger>

          {/* Category Tabs */}
          {vehicleTypesByCategory.map((category) => (
            <TabsTrigger
              key={category.categoryId}
              value={category.categoryId}
              className="group flex items-center gap-2 whitespace-nowrap rounded-lg px-8 py-4 text-[0.75rem] font-medium tracking-[0.1em] uppercase transition-all duration-200
                data-[state=active]:bg-gradient-to-br data-[state=active]:from-luxury-gold data-[state=active]:to-luxury-goldDeep data-[state=active]:text-luxury-void data-[state=active]:shadow-[0_4px_15px_-5px_rgba(198,170,136,0.4)]
                data-[state=inactive]:text-luxury-textMuted data-[state=inactive]:hover:text-luxury-pearl data-[state=inactive]:hover:bg-[rgba(198,170,136,0.1)]"
            >
              <span>{category.categoryName}</span>
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[0.625rem] font-semibold rounded bg-[rgba(198,170,136,0.2)] text-luxury-gold group-data-[state=active]:bg-[rgba(5,5,6,0.3)] group-data-[state=active]:text-luxury-void">
                {category.vehicleTypes.length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-luxury-lightGray">
          Showing <strong className="text-luxury-gold font-medium">{sortedVehicles.length} vehicles</strong> available for your journey
        </p>
        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-[0.1em] text-luxury-lightGray/70">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 bg-luxury-graphite/50 border border-luxury-gold/20 rounded-md text-sm text-luxury-pearl cursor-pointer transition-colors duration-200 hover:border-luxury-gold focus:border-luxury-gold focus:outline-none focus:ring-1 focus:ring-luxury-gold/50"
          >
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="capacity">Capacity</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Vehicle Grid - 3 columns max */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        key={`${activeCategory}-${sortBy}-${currentPage}`}
      >
        {paginatedVehicles.map((vehicleType, index) => (
          <VehicleTypeGridCard
            key={vehicleType.id}
            vehicleType={vehicleType}
            searchParams={searchParams}
            index={index}
          />
        ))}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="border-luxury-gold/30 text-[var(--text-secondary)] hover:bg-luxury-gold/10 hover:text-luxury-pearl hover:border-luxury-gold/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[36px] h-9 px-3 rounded-md text-sm font-medium transition-all duration-200
                  ${page === currentPage
                    ? 'bg-gradient-to-r from-luxury-gold to-luxury-goldDeep text-luxury-void shadow-gold'
                    : 'text-[var(--text-secondary)] hover:text-luxury-pearl hover:bg-luxury-gold/10'
                  }`}
              >
                {page}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="border-luxury-gold/30 text-[var(--text-secondary)] hover:bg-luxury-gold/10 hover:text-luxury-pearl hover:border-luxury-gold/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Results info */}
      {totalPages > 1 && (
        <p className="text-center text-sm text-[var(--text-muted)]">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, sortedVehicles.length)} of {sortedVehicles.length} vehicles
        </p>
      )}
    </div>
  )
}
