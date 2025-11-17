'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Car, Users, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { CategoryResult } from '../actions'

interface VehicleCategoriesListProps {
  categories: CategoryResult[]
  searchParams: {
    from: string
    date: string
    passengers: string
  }
}

export function VehicleCategoriesList({ categories, searchParams }: VehicleCategoriesListProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">No vehicles available</p>
        <p className="text-muted-foreground">Please try searching for a different location or date</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Available Vehicle Categories</h2>
        <p className="text-muted-foreground">No direct routes found. Browse vehicles by category</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Category Image */}
            {category.imageUrl && (
              <div className="relative h-48 bg-muted">
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Category Header */}
                <div>
                  <h3 className="text-xl font-semibold">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>

                {/* Vehicle Count */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <span>{category.vehicleCount} vehicles available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{searchParams.passengers}+ seats</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="pt-4 border-t">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Starting from</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(category.minPrice)}
                      </p>
                      <p className="text-xs text-muted-foreground">per day</p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link 
                    href={`/vehicles?${new URLSearchParams({
                      ...searchParams,
                      category: category.slug
                    }).toString()}`}
                    className="block"
                  >
                    <Button className="w-full">
                      View {category.name} Vehicles
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}