import { Map, MapPin, Navigation } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ZoneDetails } from '../actions'

interface ZoneHeaderProps {
  zone: ZoneDetails
  locationCount: number
}

export function ZoneHeader({ zone, locationCount }: ZoneHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background py-8 rounded-lg">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Map className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{zone.name}</h1>
            {zone.description && (
              <p className="text-lg text-muted-foreground mb-4">
                {zone.description}
              </p>
            )}
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                <MapPin className="h-3 w-3 mr-1" />
                {locationCount} locations
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Navigation className="h-3 w-3 mr-1" />
                Zone Transfer Available
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}