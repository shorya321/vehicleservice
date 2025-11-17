'use client'

import { ArrowRight, DollarSign, Map, Car } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { DestinationZone } from '../actions'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

interface DestinationZonesProps {
  destinations: DestinationZone[]
  fromZoneId: string
  fromZoneName: string
}

export function DestinationZones({ destinations, fromZoneId, fromZoneName }: DestinationZonesProps) {
  const router = useRouter()
  
  const handleZoneSelect = (destinationZoneId: string) => {
    // Navigate to search results with zone parameters
    const params = new URLSearchParams({
      fromZone: fromZoneId,
      toZone: destinationZoneId,
      date: format(new Date(), 'yyyy-MM-dd'),
      passengers: '2'
    })
    router.push(`/search/results?${params.toString()}`)
  }
  if (destinations.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Destinations</h2>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No destination zones configured yet.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Available Transfers from {fromZoneName}</h2>
        <p className="text-muted-foreground">
          Select a zone-to-zone transfer route to view available vehicles
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {destinations.map((destination) => (
          <Card 
            key={destination.id} 
            className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
            onClick={() => handleZoneSelect(destination.id)}
          >
            <CardHeader className="pb-3">
              <div className="space-y-3">
                <div className="flex items-center justify-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">{fromZoneName}</span>
                  <ArrowRight className="h-4 w-4 mx-2" />
                  <span className="text-sm font-medium">{destination.name}</span>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">To {destination.name}</h3>
                  {destination.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {destination.description}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Base Price</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(destination.basePrice)}
                  </span>
                </div>
                
                <Button
                  className="w-full"
                  variant="default"
                >
                  <Car className="mr-2 h-4 w-4" />
                  View Available Vehicles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center">
        <Badge variant="outline" className="text-sm">
          <Map className="h-3 w-3 mr-1" />
          {destinations.length} transfer routes available from {fromZoneName}
        </Badge>
      </div>
    </div>
  )
}