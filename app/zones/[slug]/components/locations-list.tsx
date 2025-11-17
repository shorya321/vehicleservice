import { MapPin, Building, Plane, Anchor, Train } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ZoneLocation } from '../actions'

interface LocationsListProps {
  locations: ZoneLocation[]
  zoneSlug: string
}

export function LocationsList({ locations, zoneSlug }: LocationsListProps) {
  const getLocationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'airport':
        return <Plane className="h-4 w-4" />
      case 'port':
        return <Anchor className="h-4 w-4" />
      case 'train_station':
      case 'train':
        return <Train className="h-4 w-4" />
      case 'city':
      case 'hotel':
        return <Building className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'airport':
        return 'default'
      case 'port':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (locations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No locations available in this zone yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Locations in this Zone</h2>
        <span className="text-sm text-muted-foreground">{locations.length} locations</span>
      </div>
      
      <div className="grid gap-3 md:grid-cols-2">
        {locations.map((location) => (
          <Card key={location.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-muted rounded-lg">
                    {getLocationIcon(location.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{location.name}</h3>
                    {location.address && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {location.address}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {location.city}, {location.country}
                    </p>
                  </div>
                </div>
                <Badge variant={getTypeBadgeVariant(location.type)} className="text-xs">
                  {location.type.replace('_', ' ')}
                </Badge>
              </div>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <Link href={`/?from=${location.id}`}>
                    Book from here →
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}