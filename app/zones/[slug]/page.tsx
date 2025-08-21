import { notFound } from 'next/navigation'
import { PublicLayout } from '@/components/layout/public-layout'
import { ZoneHeader } from './components/zone-header'
import { DestinationZones } from './components/destination-zones'
import {
  getZoneBySlug,
  getZoneLocations,
  getDestinationZones
} from './actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Map, Info } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const zone = await getZoneBySlug(slug)
  
  if (!zone) {
    return {
      title: 'Zone Not Found',
      description: 'The requested zone could not be found.'
    }
  }

  return {
    title: `${zone.name} - Transfer Zone | Book Reliable Transfers`,
    description: zone.description || `Explore transfer options from ${zone.name}. Book reliable transfers with professional drivers and fixed prices.`
  }
}

export default async function ZoneDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  const zone = await getZoneBySlug(slug)
  
  if (!zone) {
    notFound()
  }

  const [locations, destinations] = await Promise.all([
    getZoneLocations(zone.id),
    getDestinationZones(zone.id)
  ])

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        <ZoneHeader zone={zone} locationCount={locations.length} />
        
        <div className="mt-8">
          {/* Main Content - Destination Zones */}
          <DestinationZones 
            destinations={destinations} 
            fromZoneId={zone.id}
            fromZoneName={zone.name}
          />
          
          {/* Information Cards */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Zone Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{locations.length}</div>
                  <p className="text-sm text-muted-foreground">
                    Pickup/dropoff locations in this zone
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Destinations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{destinations.length}</div>
                  <p className="text-sm text-muted-foreground">
                    Zones you can travel to from here
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {destinations.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold">
                        {formatCurrency(Math.min(...destinations.map(d => d.basePrice)))}+
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Base price varies by destination zone
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No pricing configured yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* How it Works */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How Zone-to-Zone Transfers Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Badge className="mb-2">Step 1</Badge>
                  <h4 className="font-medium">Select Transfer Route</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose your zone-to-zone transfer route from {zone.name}
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge className="mb-2">Step 2</Badge>
                  <h4 className="font-medium">View Available Vehicles</h4>
                  <p className="text-sm text-muted-foreground">
                    See all vehicle types with zone-based pricing
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge className="mb-2">Step 3</Badge>
                  <h4 className="font-medium">Book Your Transfer</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete booking with instant confirmation
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Zone-based pricing means the final price is calculated as base zone price × vehicle type multiplier. All locations within a zone have the same pricing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  )
}