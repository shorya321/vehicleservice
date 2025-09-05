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
  Clock,
  CheckCircle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface VehicleTypeGridCardProps {
  vehicleType: VehicleTypeResult
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
  }
}

// Sample vehicle models for each type (temporary until added to database)
const vehicleModels: Record<string, string> = {
  'economy-sedan': 'Toyota Etios, Maruti Swift',
  'sedan': 'Honda City, Maruti Ciaz',
  'luxury-sedan': 'Mercedes E-Class, BMW 5 Series',
  'suv': 'Toyota Innova, Mahindra XUV',
  'luxury-suv': 'Audi Q7, BMW X5',
  'minivan': 'Toyota Hiace, Tempo Traveller',
  'van': 'Force Traveller',
  'minibus': '20-Seater Bus',
  'bus': '35-Seater Bus, 45-Seater Bus'
}

export function VehicleTypeGridCard({ vehicleType, searchParams }: VehicleTypeGridCardProps) {
  const vehicleTypeImage = vehicleType.image || `/images/vehicle-types/${vehicleType.slug}.jpg`
  const models = vehicleModels[vehicleType.slug] || vehicleType.name
  
  const selectionUrl = `/checkout?${new URLSearchParams({
    vehicleType: vehicleType.id,
    ...searchParams
  }).toString()}`

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Vehicle Type Image */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <Image
            src={vehicleTypeImage}
            alt={vehicleType.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Vehicle Type Details */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Title and Models */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-1">{vehicleType.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {models}
            </p>
          </div>

          {/* Capacity Info */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{vehicleType.capacity}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{vehicleType.luggageCapacity}</span>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>15 min waiting</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Free cancellation</span>
            </div>
          </div>

          {/* Spacer to push price and button to bottom */}
          <div className="flex-1" />

          {/* Price */}
          <div className="mb-4">
            <div className="text-2xl font-bold">
              {formatCurrency(vehicleType.price)}
            </div>
            <p className="text-xs text-muted-foreground">per vehicle</p>
          </div>

          {/* Action Button */}
          {vehicleType.availableVehicles === 0 ? (
            <Button 
              className="w-full" 
              size="lg"
              disabled
            >
              Currently Unavailable
            </Button>
          ) : (
            <Button 
              asChild 
              className="w-full" 
              size="lg"
            >
              <Link href={selectionUrl}>
                Book Now
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}