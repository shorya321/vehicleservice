import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getRouteBySlug, getRoutesVehicles } from './actions'
import { RouteVehiclesList } from './components/route-vehicles-list'
import { SearchWidget } from '@/components/search/search-widget'
import { MapPin, Navigation, Clock, Car } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PublicLayout } from '@/components/layout/public-layout'

interface RoutePageProps {
  params: Promise<{
    country: string
    slug: string
  }>
}

export async function generateMetadata({ params }: RoutePageProps): Promise<Metadata> {
  const { country, slug } = await params
  const route = await getRouteBySlug(slug)
  
  if (!route) {
    return {
      title: 'Route Not Found',
    }
  }

  return {
    title: `${route.origin.name} to ${route.destination.name} Transfer | Book Your Ride`,
    description: `Book reliable transfer from ${route.origin.name} to ${route.destination.name}. ${route.distance_km}km journey with professional drivers and multiple vehicle options.`,
  }
}

export default async function RoutePage({ params }: RoutePageProps) {
  const { country, slug } = await params
  const route = await getRouteBySlug(slug)
  
  if (!route) {
    notFound()
  }

  const vehicleTypes = await getRoutesVehicles(route.id)
  const duration = route.estimated_duration_minutes
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  return (
    <PublicLayout>
      <div className="bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              {route.origin.name} to {route.destination.name}
            </h1>
            
            <div className="flex items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                <span>{route.distance_km} km</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{durationText}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                <span>{vehicleTypes.length} vehicle types</span>
              </div>
            </div>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose from {vehicleTypes.length} vehicle types for your comfortable journey
            </p>
          </div>

          {/* Search Widget */}
          <div className="mt-8 max-w-5xl mx-auto">
            <SearchWidget 
              defaultOrigin={route.origin} 
              defaultDestination={route.destination}
            />
          </div>
        </div>
      </section>

      {/* Vehicle Types Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-8">
              <Car className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Available Vehicle Types</h2>
            </div>
            
            <RouteVehiclesList 
              vehicleTypes={vehicleTypes} 
              route={route}
              countrySlug={country}
            />
          </div>
        </div>
      </section>
      </div>
    </PublicLayout>
  )
}