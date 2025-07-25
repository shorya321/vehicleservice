import Link from 'next/link'
import { MapPin, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

export interface PopularRoute {
  id: string
  slug: string
  originName: string
  destinationName: string
  originCity: string
  destinationCity: string
  startingPrice: number
  searchCount: number
  distance: number
  duration: number
}

interface PopularRoutesProps {
  routes: PopularRoute[]
  title?: string
  showViewAll?: boolean
}

export function PopularRoutes({ 
  routes, 
  title = "Popular Routes",
  showViewAll = true 
}: PopularRoutesProps) {
  if (routes.length === 0) return null

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
    }
    return `${mins}m`
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {showViewAll && (
          <Button variant="outline" asChild>
            <Link href="/routes">
              View All Routes
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => (
          <Link
            key={route.id}
            href={`/routes/${route.slug}`}
            className="block transition-transform hover:scale-[1.02]"
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{route.originCity}</span>
                      </div>
                      <h3 className="font-semibold">{route.originName}</h3>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {route.searchCount}
                    </Badge>
                  </div>

                  <div className="relative">
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="pl-8 space-y-2">
                      <div className="text-sm text-muted-foreground">
                        {route.distance} km • {formatDuration(route.duration)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{route.destinationCity}</span>
                    </div>
                    <h3 className="font-semibold">{route.destinationName}</h3>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">From</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(route.startingPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="text-center">
        <Badge variant="outline" className="text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          250+ rides booked this week
        </Badge>
      </div>
    </section>
  )
}