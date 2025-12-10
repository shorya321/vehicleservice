'use client';

/**
 * Vehicle Category Tabs Component
 * For business booking wizard - displays vehicle types grouped by category
 *
 * Design: shadcn/ui theme-aware components
 */

import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { VehicleTypeCard } from './vehicle-type-card';
import { VehicleTypeResult, VehicleTypesByCategory } from '../actions';

interface VehicleCategoryTabsProps {
  vehicleTypesByCategory: VehicleTypesByCategory[];
  allVehicleTypes: VehicleTypeResult[];
  selectedId: string | null;
  onSelect: (vehicleType: VehicleTypeResult) => void;
}

export function VehicleCategoryTabs({
  vehicleTypesByCategory,
  allVehicleTypes,
  selectedId,
  onSelect,
}: VehicleCategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 mb-6">
        {/* All Vehicle Types Tab */}
        <TabsTrigger
          value="all"
          className="whitespace-nowrap px-4 py-2 text-sm font-medium"
        >
          All ({allVehicleTypes.length})
        </TabsTrigger>

        {/* Category Tabs */}
        {vehicleTypesByCategory.map((category) => (
          <TabsTrigger
            key={category.categoryId}
            value={category.categoryId}
            className="whitespace-nowrap px-4 py-2 text-sm font-medium"
          >
            {category.categoryName} ({category.vehicleTypes.length})
          </TabsTrigger>
        ))}
      </TabsList>

      {/* All Vehicle Types Content */}
      <TabsContent value="all" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allVehicleTypes.map((vehicleType) => (
            <VehicleTypeCard
              key={vehicleType.id}
              vehicleType={vehicleType}
              isSelected={selectedId === vehicleType.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </TabsContent>

      {/* Category Contents */}
      {vehicleTypesByCategory.map((category) => (
        <TabsContent key={category.categoryId} value={category.categoryId} className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.vehicleTypes.map((vehicleType) => (
              <VehicleTypeCard
                key={vehicleType.id}
                vehicleType={vehicleType}
                isSelected={selectedId === vehicleType.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
