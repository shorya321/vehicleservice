'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, ArrowRight, DollarSign } from 'lucide-react'
import { ZoneResult } from '@/app/search/results/actions'
import { useRouter } from 'next/navigation'

interface ZonesListProps {
  zones: ZoneResult[]
  searchParams: {
    from?: string
    date?: string
    passengers?: string
  }
}

export function ZonesList({ zones, searchParams }: ZonesListProps) {
  const router = useRouter()

  const handleZoneSelect = (zone: ZoneResult) => {
    // Navigate to the search results with the selected zone's destination
    const params = new URLSearchParams()
    if (searchParams.from) params.append('from', searchParams.from)
    // For zone selection, we'd need to get a destination location ID from the zone
    // This might require additional logic to select a primary location in the zone
    if (searchParams.date) params.append('date', searchParams.date)
    if (searchParams.passengers) params.append('passengers', searchParams.passengers)
    
    router.push(`/search/results?${params.toString()}`)
  }

  if (zones.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-muted-foreground">
          No zones available from this location
        </h3>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {zones.map((zone, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {zone.toZone.name}
              </CardTitle>
              <Badge variant="secondary">
                From ${zone.basePrice.toFixed(2)}
              </Badge>
            </div>
            {zone.toZone.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {zone.toZone.description}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                {zone.fromZone.name} → {zone.toZone.name}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>
                {zone.vehicleTypes.length} vehicle types available
              </span>
            </div>

            {zone.vehicleTypes.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Starting from ${Math.min(...zone.vehicleTypes.map(vt => vt.price)).toFixed(2)}
              </div>
            )}

            <Button 
              onClick={() => handleZoneSelect(zone)}
              className="w-full"
              size="sm"
            >
              View Vehicles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}