import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocationBySlug, getRoutesFromLocation } from './actions'
import { LocationRoutesList } from './components/location-routes-list'
import { SearchWidget } from '@/components/search/search-widget'
import { MapPin, Navigation } from 'lucide-react'
import { PublicLayout } from '@/components/layout/public-layout'

interface LocationPageProps {
  params: Promise<{
    country: string
    slug: string
  }>
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { country, slug } = await params
  const location = await getLocationBySlug(country, slug)
  
  if (!location) {
    return {
      title: 'Location Not Found',
    }
  }

  return {
    title: `Transfers from ${location.name} | Book Reliable Rides`,
    description: `Book comfortable transfers from ${location.name}. Professional drivers, fixed prices, and multiple vehicle options available.`,
  }
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { country, slug } = await params
  const location = await getLocationBySlug(country, slug)
  
  if (!location) {
    notFound()
  }

  const routes = await getRoutesFromLocation(location.id)

  return (
    <PublicLayout>
      <div className="bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{location.city}, {location.country_code}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Transfers from {location.name}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose from {routes.length} popular routes with professional drivers and comfortable vehicles
            </p>
          </div>

          {/* Search Widget */}
          <div className="mt-8 max-w-5xl mx-auto">
            <SearchWidget defaultOrigin={location} />
          </div>
        </div>
      </section>

      {/* Routes Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-8">
              <Navigation className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Popular Routes from {location.name}</h2>
            </div>
            
            <LocationRoutesList 
              routes={routes} 
              originLocation={location}
              countrySlug={country}
            />
          </div>
        </div>
      </section>
      </div>
    </PublicLayout>
  )
}