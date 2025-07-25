'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Car, Users, ArrowRight, Check, Luggage } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { VehicleTypeWithPricing, RouteDetails } from '../actions'

interface RouteVehiclesListProps {
  vehicleTypes: VehicleTypeWithPricing[]
  route: RouteDetails
  countrySlug: string
}

export function RouteVehiclesList({ vehicleTypes, route, countrySlug }: RouteVehiclesListProps) {
  if (vehicleTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">No vehicles available for this route</p>
        <p className="text-muted-foreground">Please try searching for a different date or check back later</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {vehicleTypes.map((vehicleType) => (
        <Card key={vehicleType.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          {/* Vehicle Type Image */}
          {vehicleType.category?.image_url && (
            <div className="relative h-48 bg-muted">
              <Image
                src={vehicleType.category.image_url}
                alt={vehicleType.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Vehicle Type Header */}
              <div>
                <h3 className="text-xl font-semibold">{vehicleType.name}</h3>
                {vehicleType.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {vehicleType.description}
                  </p>
                )}
              </div>

              {/* Vehicle Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{vehicleType.passenger_capacity} passengers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Luggage className="h-4 w-4 text-muted-foreground" />
                    <span>{vehicleType.luggage_capacity} bags</span>
                  </div>
                </div>
                {vehicleType.vehicle_examples.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {vehicleType.vehicle_examples.join(', ')}
                  </p>
                )}
              </div>

              {/* Features (placeholder - can be expanded based on category) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Professional drivers</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Fixed price guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Free cancellation</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="pt-4 border-t">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fixed price</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(vehicleType.price)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="mb-1">
                    Per vehicle
                  </Badge>
                </div>

                {/* CTA Button */}
                <Link 
                  href={`/search/results?origin=${route.origin.id}&destination=${route.destination.id}&vehicleType=${vehicleType.slug}`}
                  className="block"
                >
                  <Button className="w-full">
                    Book {vehicleType.name}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}