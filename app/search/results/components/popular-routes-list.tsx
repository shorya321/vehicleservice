'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Car, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { RouteResult } from '../actions'

interface PopularRoutesListProps {
  routes: RouteResult[]
  searchParams: {
    from: string
    date: string
    passengers: string
  }
}

export function PopularRoutesList({ routes, searchParams }: PopularRoutesListProps) {
  if (routes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No routes available from this location</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Popular Routes</h2>
        <p className="text-muted-foreground">Select a route to see available vehicles</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => {
          const duration = route.duration
          const hours = Math.floor(duration / 60)
          const minutes = duration % 60
          const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

          // Build the link to the route page with destination and routeId
          const routeLink = `/search/results?${new URLSearchParams({
            ...searchParams,
            to: route.destinationId,
            routeId: route.id
          }).toString()}`

          return (
            <Link
              key={route.id}
              href={routeLink}
              className="block transition-transform hover:scale-[1.02]"
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Route Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg line-clamp-2">
                          {route.routeName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{route.destinationName}</span>
                        </div>
                      </div>
                      <Badge variant={route.destinationType === 'airport' ? 'default' : 'secondary'}>
                        {route.destinationType}
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
                        <span>{route.availableVehicles} vehicles</span>
                      </div>
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">From</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(route.minPrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-primary">
                        <span className="text-sm font-medium">Select Route</span>
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
    </div>
  )
}