import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getRouteBySlug, getRoutesVehicles } from './actions'

export const dynamic = 'force-dynamic'
import { VehicleTypeCategoryTabs } from '@/app/search/results/components/vehicle-type-category-tabs'
import { MapPin, Clock } from 'lucide-react'
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

  const vehicleTypesData = await getRoutesVehicles(route.id)
  const duration = route.estimated_duration_minutes
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

  // Transform vehicle types to match the expected format
  const vehicleTypes: any[] = vehicleTypesData.map(vt => ({
    id: vt.id,
    name: vt.name,
    slug: vt.slug,
    category: vt.category?.name || 'Standard',
    categoryId: vt.category?.id || 'standard',
    categorySlug: vt.category?.slug || 'standard',
    capacity: vt.passenger_capacity,
    luggageCapacity: vt.luggage_capacity,
    description: vt.description || '',
    price: vt.price,
    currency: 'AED',
    availableVehicles: vt.available_count,
    vendorCount: 1,
    features: [],
    image: vt.image_url || undefined
  }))

  // Group by category
  const categoryMap = new Map()
  vehicleTypes.forEach(vt => {
    if (!categoryMap.has(vt.categoryId)) {
      categoryMap.set(vt.categoryId, {
        categoryId: vt.categoryId,
        categoryName: vt.category,
        categorySlug: vt.categorySlug,
        vehicleTypes: [],
        minPrice: Number.MAX_VALUE
      })
    }
    const category = categoryMap.get(vt.categoryId)
    category.vehicleTypes.push(vt)
    category.minPrice = Math.min(category.minPrice, vt.price)
  })

  const vehicleTypesByCategory = Array.from(categoryMap.values())
    .filter(cat => cat.vehicleTypes.length > 0)
    .sort((a, b) => a.minPrice - b.minPrice)

  // Create search params for the vehicle type cards
  const searchParams = {
    from: route.origin_location_id,
    to: route.destination_location_id,
    date: new Date().toISOString().split('T')[0],
    passengers: '2'
  }

  return (
    <PublicLayout>
      <div className="bg-background">
        {/* Search Summary Style Header */}
        <div className="bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 flex-shrink-0" />
                <div>
                  <div className="text-sm opacity-80">Route</div>
                  <div className="font-semibold">
                    {route.origin.name} → {route.destination.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 flex-shrink-0" />
                <div>
                  <div className="text-sm opacity-80">Distance & Duration</div>
                  <div className="font-semibold">
                    {route.distance_km} km • {durationText}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-5 w-5 flex-shrink-0 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-semibold">
                  {vehicleTypes.length}
                </div>
                <div>
                  <div className="text-sm opacity-80">Available</div>
                  <div className="font-semibold">
                    Vehicle Types
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <VehicleTypeCategoryTabs
            vehicleTypesByCategory={vehicleTypesByCategory}
            allVehicleTypes={vehicleTypes}
            routeId={route.id}
            searchParams={searchParams}
          />
        </div>
      </div>
    </PublicLayout>
  )
}