'use client'

import Image from 'next/image'
import Link from 'next/link'
import { VehicleTypeResult } from '../actions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Briefcase, 
  Car,
  ArrowRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface VehicleTypeCardProps {
  vehicleType: VehicleTypeResult
  routeId: string
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
  }
}

export function VehicleTypeCard({ vehicleType, routeId, searchParams }: VehicleTypeCardProps) {
  const vehicleTypeImage = vehicleType.image || '/placeholder-vehicle.jpg'
  
  const selectionUrl = `/search/results/vehicles?${new URLSearchParams({
    route: routeId,
    vehicleType: vehicleType.id,
    ...searchParams
  }).toString()}`

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-[300px,1fr] gap-0">
          {/* Vehicle Type Image */}
          <div className="relative h-48 md:h-full">
            <Image
              src={vehicleTypeImage}
              alt={vehicleType.name}
              fill
              className="object-cover"
            />
            <Badge 
              className="absolute top-4 left-4"
              variant="secondary"
            >
              {vehicleType.category}
            </Badge>
          </div>

          {/* Vehicle Type Details */}
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{vehicleType.name}</h3>
                <p className="text-muted-foreground mt-1">
                  {vehicleType.description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(vehicleType.price)}
                </div>
                <p className="text-sm text-muted-foreground">per trip</p>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Up to {vehicleType.capacity} passengers</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{vehicleType.luggageCapacity} luggage</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span>{vehicleType.availableVehicles} vehicles available</span>
              </div>
            </div>

            {/* Availability Info */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm">
                {vehicleType.vendorCount > 0 ? (
                  <Badge variant="outline" className="text-green-600">
                    Available from {vehicleType.vendorCount} vendor{vehicleType.vendorCount > 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600">
                    Not Available
                  </Badge>
                )}
              </div>
              
              <Button asChild disabled={vehicleType.availableVehicles === 0}>
                <Link href={selectionUrl}>
                  Select Vehicle
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}