'use client'

import { useState } from 'react'
import { VehicleTypeResult, VehicleTypesByCategory } from '../actions'
import { VehicleTypeGridCard } from './vehicle-type-grid-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Car } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
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

export function VehicleTypeCategoryTabs({
  vehicleTypesByCategory,
  allVehicleTypes,
  searchParams
}: VehicleTypeCategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState('all')

  // Calculate min price for all vehicle types
  const allMinPrice = allVehicleTypes.length > 0 
    ? Math.min(...allVehicleTypes.map(vt => vt.price))
    : 0

  return (
    <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 backdrop-blur-md bg-luxury-darkGray/50 border border-luxury-gold/10 mb-8">
        {/* All Vehicle Types Tab */}
        <TabsTrigger
          value="all"
          className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-luxury-gold data-[state=active]:text-luxury-black data-[state=inactive]:text-luxury-pearl data-[state=inactive]:hover:text-luxury-gold transition-all duration-300 px-6 py-3 font-sans uppercase tracking-wider text-sm"
        >
          <span className="font-medium">All</span>
        </TabsTrigger>

        {/* Category Tabs */}
        {vehicleTypesByCategory.map((category) => (
          <TabsTrigger
            key={category.categoryId}
            value={category.categoryId}
            className="flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-luxury-gold data-[state=active]:text-luxury-black data-[state=inactive]:text-luxury-pearl data-[state=inactive]:hover:text-luxury-gold transition-all duration-300 px-6 py-3 font-sans uppercase tracking-wider text-sm"
          >
            <span className="font-medium">{category.categoryName}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* All Vehicle Types Content */}
      <TabsContent value="all" className="mt-0">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {allVehicleTypes.map((vehicleType, index) => (
            <VehicleTypeGridCard
              key={vehicleType.id}
              vehicleType={vehicleType}
              searchParams={searchParams}
              index={index}
            />
          ))}
        </motion.div>
      </TabsContent>

      {/* Category Contents */}
      {vehicleTypesByCategory.map((category) => (
        <TabsContent
          key={category.categoryId}
          value={category.categoryId}
          className="mt-0"
        >
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {category.vehicleTypes.map((vehicleType, index) => (
              <VehicleTypeGridCard
                key={vehicleType.id}
                vehicleType={vehicleType}
                searchParams={searchParams}
                index={index}
              />
            ))}
          </motion.div>
        </TabsContent>
      ))}
    </Tabs>
  )
}