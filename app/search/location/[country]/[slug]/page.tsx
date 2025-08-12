import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocationBySlug, getRoutesFromLocation } from './actions'
import { LocationRoutesList } from './components/location-routes-list'
import { MapPin } from 'lucide-react'
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
        {/* Search Summary Section - Similar to SearchSummary component */}
        <div className="bg-muted/30 border-b">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-semibold mb-2">Popular Routes from {location.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{location.city}, {location.country_code}</span>
            </div>
          </div>
        </div>
        
        {/* Routes List Section */}
        <div className="container mx-auto px-4 py-8">
          <LocationRoutesList 
            routes={routes} 
            originLocation={location}
            countrySlug={country}
          />
        </div>
      </div>
    </PublicLayout>
  )
}