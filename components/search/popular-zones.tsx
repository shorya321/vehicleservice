import Link from 'next/link'
import { MapPin, Map, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PopularZone } from '@/app/actions'

interface PopularZonesProps {
  zones: PopularZone[]
  title?: string
  showViewAll?: boolean
}

export function PopularZones({ 
  zones, 
  title = "Popular Zones",
  showViewAll = true 
}: PopularZonesProps) {
  if (zones.length === 0) return null

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground mt-1">Explore transfer options by zone</p>
        </div>
        {showViewAll && (
          <Button variant="outline" asChild>
            <Link href="/zones">
              View All Zones
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => (
          <Link
            key={zone.id}
            href={`/zones/${zone.slug}`}
            className="block transition-transform hover:scale-[1.02]"
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Map className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{zone.name}</h3>
                        {zone.locationCount > 0 && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{zone.locationCount} locations</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {zone.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {zone.description}
                    </p>
                  )}

                  <div className="pt-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Zone Transfer</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Explore →
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {zones.length > 0 && (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            <Map className="h-3 w-3 mr-1" />
            {zones.length} zones available for transfers
          </Badge>
        </div>
      )}
    </section>
  )
}