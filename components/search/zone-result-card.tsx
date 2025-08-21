'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, ArrowRight, DollarSign, Car } from 'lucide-react'
import { ZoneResult } from '@/app/search/results/actions'

interface ZoneResultCardProps {
  zone: ZoneResult
  onProceed: () => void
}

export function ZoneResultCard({ zone, onProceed }: ZoneResultCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Zone Transfer
          </CardTitle>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <DollarSign className="h-4 w-4 mr-1" />
            From ${zone.basePrice.toFixed(2)}
          </Badge>
        </div>
        <CardDescription>
          Transfer between pricing zones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">From Zone</div>
              <div className="font-semibold text-lg">{zone.fromZone.name}</div>
              {zone.fromZone.description && (
                <div className="text-xs text-muted-foreground mt-1">
                  {zone.fromZone.description}
                </div>
              )}
            </div>
            
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">To Zone</div>
              <div className="font-semibold text-lg">{zone.toZone.name}</div>
              {zone.toZone.description && (
                <div className="text-xs text-muted-foreground mt-1">
                  {zone.toZone.description}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">
                {zone.vehicleTypes.length} Vehicle Types
              </div>
              <div className="text-xs text-muted-foreground">
                Available for your journey
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">
                Zone Pricing
              </div>
              <div className="text-xs text-muted-foreground">
                Base price x vehicle multiplier
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button 
            onClick={onProceed}
            className="w-full"
            size="lg"
          >
            View Available Vehicles
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {zone.vehicleTypes.length > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            Prices start from ${Math.min(...zone.vehicleTypes.map(vt => vt.price)).toFixed(2)} 
            {' '}for {zone.vehicleTypes[0].name}
          </div>
        )}
      </CardContent>
    </Card>
  )
}