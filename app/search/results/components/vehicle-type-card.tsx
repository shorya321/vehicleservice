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
    luggage?: string
  }
}

export function VehicleTypeCard({ vehicleType, routeId, searchParams }: VehicleTypeCardProps) {
  const vehicleTypeImage = vehicleType.image || '/placeholder-vehicle.jpg'
  
  const passengerCount = parseInt(searchParams.passengers || '1')
  const luggageCount = parseInt(searchParams.luggage || '0')
  
  const exceedsCapacity = passengerCount > vehicleType.capacity
  const needsExtraLuggage = luggageCount > vehicleType.luggageCapacity
  const extraLuggageCount = Math.max(0, luggageCount - vehicleType.luggageCapacity)
  const extraLuggageCost = extraLuggageCount * 15 // $15 per extra bag
  
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
                  {formatCurrency(vehicleType.price + extraLuggageCost)}
                </div>
                {extraLuggageCost > 0 && (
                  <p className="text-xs text-orange-600">+{formatCurrency(extraLuggageCost)} extra luggage</p>
                )}
                <p className="text-sm text-muted-foreground">per trip</p>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className={`flex items-center gap-2 ${exceedsCapacity ? 'text-red-600' : ''}`}>
                <Users className={`h-4 w-4 ${exceedsCapacity ? 'text-red-600' : 'text-muted-foreground'}`} />
                <span>
                  {exceedsCapacity ? (
                    <><span className="font-semibold">⚠ Needs {Math.ceil(passengerCount / vehicleType.capacity)} vehicles</span> (max {vehicleType.capacity} per vehicle)</>
                  ) : (
                    <>Up to {vehicleType.capacity} passengers</>
                  )}
                </span>
              </div>
              <div className={`flex items-center gap-2 ${needsExtraLuggage ? 'text-orange-600' : ''}`}>
                <Briefcase className={`h-4 w-4 ${needsExtraLuggage ? 'text-orange-600' : 'text-muted-foreground'}`} />
                <span>
                  {needsExtraLuggage ? (
                    <><span className="font-semibold">+{extraLuggageCount} extra bag{extraLuggageCount > 1 ? 's' : ''}</span> (included: {vehicleType.luggageCapacity})</>
                  ) : (
                    <>{vehicleType.luggageCapacity} luggage included</>
                  )}
                </span>
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