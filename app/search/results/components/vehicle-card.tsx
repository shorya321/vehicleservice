'use client'

import Image from 'next/image'
import Link from 'next/link'
import { SearchResultVehicle } from '../actions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Briefcase, 
  Star, 
  CheckCircle, 
  Clock,
  ArrowRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface VehicleCardProps {
  vehicle: SearchResultVehicle
  routeId: string
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
  }
}

export function VehicleCard({ vehicle, routeId, searchParams }: VehicleCardProps) {
  const vehicleImage = vehicle.images[0] || '/placeholder-vehicle.jpg'
  
  const bookingUrl = `/booking/vehicle/${vehicle.id}?${new URLSearchParams({
    route: routeId,
    ...searchParams
  }).toString()}`

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-[300px,1fr] gap-0">
          {/* Vehicle Image */}
          <div className="relative h-48 md:h-full">
            <Image
              src={vehicleImage}
              alt={vehicle.name}
              fill
              className="object-cover"
            />
            <Badge 
              className="absolute top-4 left-4"
              variant={vehicle.category === 'Premium' ? 'default' : 'secondary'}
            >
              {vehicle.category}
            </Badge>
          </div>

          {/* Vehicle Details */}
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{vehicle.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Provided by {vehicle.vendorName}
                </p>
              </div>
              
              <div className="text-right">
                {vehicle.originalPrice && (
                  <div className="text-sm text-muted-foreground line-through">
                    {formatCurrency(vehicle.originalPrice)}
                  </div>
                )}
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(vehicle.price)}
                </div>
                <div className="text-sm text-muted-foreground">
                  per vehicle
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Up to {vehicle.capacity} passengers</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{vehicle.luggageCapacity} suitcases</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{vehicle.duration} journey</span>
              </div>
              {vehicle.vendorRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{vehicle.vendorRating.toFixed(1)} rating</span>
                </div>
              )}
            </div>

            {/* Features */}
            {vehicle.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {vehicle.features.slice(0, 4).map(feature => (
                  <Badge key={feature} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {vehicle.features.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{vehicle.features.length - 4} more
                  </Badge>
                )}
              </div>
            )}

            {/* Benefits */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {vehicle.instantConfirmation && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Instant confirmation</span>
                </div>
              )}
              <div>{vehicle.cancellationPolicy}</div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <Button asChild>
                <Link href={bookingUrl}>
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