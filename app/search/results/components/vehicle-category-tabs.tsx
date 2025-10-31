'use client'

import { useState } from 'react'
import { SearchResultVehicle, VehiclesByCategory } from '../actions'
import { VehicleCard } from './vehicle-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Car } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface VehicleCategoryTabsProps {
  vehiclesByCategory: VehiclesByCategory[]
  allVehicles: SearchResultVehicle[]
  routeId: string
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
  }
}

export function VehicleCategoryTabs({ 
  vehiclesByCategory, 
  allVehicles,
  routeId,
  searchParams 
}: VehicleCategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState('all')

  // Calculate min price for all vehicles
  const allMinPrice = allVehicles.length > 0 
    ? Math.min(...allVehicles.map(v => v.price))
    : 0

  return (
    <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 bg-luxury-darkGray/50 border border-luxury-gold/20">
        {/* All Vehicles Tab */}
        <TabsTrigger
          value="all"
          className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-luxury-gold data-[state=active]:text-luxury-black uppercase tracking-wider font-semibold"
        >
          <span>All</span>
          <Badge variant="secondary" className="ml-1 bg-luxury-gold/20 text-luxury-pearl border-luxury-gold/30">
            {allVehicles.length}
          </Badge>
          {allMinPrice > 0 && (
            <span className="text-xs">
              from {formatCurrency(allMinPrice)}
            </span>
          )}
        </TabsTrigger>

        {/* Category Tabs */}
        {vehiclesByCategory.map((category) => (
          <TabsTrigger
            key={category.categoryId}
            value={category.categoryId}
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-luxury-gold data-[state=active]:text-luxury-black uppercase tracking-wider font-semibold"
          >
            <Car className="h-4 w-4" aria-hidden="true" />
            <span>{category.categoryName}</span>
            <Badge variant="secondary" className="ml-1 bg-luxury-gold/20 text-luxury-pearl border-luxury-gold/30">
              {category.vehicles.length}
            </Badge>
            <span className="text-xs">
              from {formatCurrency(category.minPrice)}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* All Vehicles Content */}
      <TabsContent value="all" className="mt-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-2xl text-luxury-pearl">All Available Vehicles</h3>
          <p className="text-sm text-luxury-lightGray">
            {allVehicles.length} vehicles available
          </p>
        </div>
        <div className="grid gap-4">
          {allVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              routeId={routeId}
              searchParams={searchParams}
            />
          ))}
        </div>
      </TabsContent>

      {/* Category Contents */}
      {vehiclesByCategory.map((category) => (
        <TabsContent
          key={category.categoryId}
          value={category.categoryId}
          className="mt-6 space-y-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-2xl text-luxury-pearl">{category.categoryName} Vehicles</h3>
              <p className="text-sm text-luxury-lightGray">
                Comfortable and reliable {category.categoryName.toLowerCase()} class vehicles
              </p>
            </div>
            <p className="text-sm text-luxury-lightGray">
              {category.vehicles.length} vehicles available
            </p>
          </div>
          <div className="grid gap-4">
            {category.vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                routeId={routeId}
                searchParams={searchParams}
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}