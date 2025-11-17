'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Car, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { generateRouteSlug } from '@/lib/utils/slug'
import { RouteWithDetails } from '../actions'
import { Location } from '@/lib/types/location'

interface LocationRoutesListProps {
  routes: RouteWithDetails[]
  originLocation: Location
  countrySlug: string
}

export function LocationRoutesList({ routes, originLocation, countrySlug }: LocationRoutesListProps) {
  if (routes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No routes available from this location</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {routes.map((route) => {
        const duration = route.estimated_duration_minutes
        const hours = Math.floor(duration / 60)
        const minutes = duration % 60
        const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

        return (
          <Link
            key={route.id}
            href={`/search/route/${countrySlug}/${generateRouteSlug(originLocation.name, route.destination.name)}`}
            className="block transition-transform hover:scale-[1.02]"
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Route Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {route.route_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{route.destination.city}</span>
                      </div>
                    </div>
                    <Badge variant={route.destination.type === 'airport' ? 'default' : 'secondary'}>
                      {route.destination.type}
                    </Badge>
                  </div>

                  {/* Route Details */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{durationText}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="h-4 w-4" />
                      <span>{route.available_vehicles || 0} vehicles</span>
                    </div>
                  </div>

                  {/* Price and CTA */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">From</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(route.min_price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <span className="text-sm font-medium">View Details</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}