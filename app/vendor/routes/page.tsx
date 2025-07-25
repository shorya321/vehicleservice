import { Metadata } from "next"
import { VendorLayout } from "@/components/layout/vendor-layout"
import { requireVendor } from "@/lib/auth/user-actions"
import { getAvailableRoutes, getVendorRoutes, getVendorRouteServices, getLocationsForRouteCreation } from "./actions"
import { VendorRoutesWithTabs } from "./components/vendor-routes-with-tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Route, MapPin } from "lucide-react"
import { RouteFilters } from "@/lib/types/route"

export const metadata: Metadata = {
  title: 'Routes - Vendor Portal',
  description: 'Manage your route services',
}

export const dynamic = 'force-dynamic'

interface VendorRoutesPageProps {
  searchParams: Promise<{
    search?: string
    isActive?: string
    isPopular?: string
    isShared?: string
    originLocationId?: string
    destinationLocationId?: string
    page?: string
    limit?: string
    tab?: string
  }>
}

export default async function VendorRoutesPage({ searchParams }: VendorRoutesPageProps) {
  await requireVendor()

  const params = await searchParams

  const filters: RouteFilters = {
    search: params.search,
    isActive: params.isActive === 'true' ? true : params.isActive === 'false' ? false : 'all',
    isPopular: params.isPopular === 'true' ? true : params.isPopular === 'false' ? false : 'all',
    isShared: params.isShared === 'true' ? true : params.isShared === 'false' ? false : 'all',
    originLocationId: params.originLocationId,
    destinationLocationId: params.destinationLocationId,
    page: params.page ? parseInt(params.page) : 1,
    limit: params.limit ? parseInt(params.limit) : 10
  }

  const [vendorRoutes, availableRoutes, vendorRouteServices, locations] = await Promise.all([
    getVendorRoutes(filters),
    getAvailableRoutes(filters),
    getVendorRouteServices(),
    getLocationsForRouteCreation()
  ])

  // Create a map of route services for quick lookup
  const vendorRouteMap = new Map()
  vendorRouteServices.forEach(service => {
    vendorRouteMap.set(service.route_id, service)
  })

  // Add vendor service info to available routes
  const availableRoutesWithVendorInfo = availableRoutes.map(route => ({
    ...route,
    vendorService: vendorRouteMap.get(route.id) || null
  }))

  const activeRoutes = vendorRouteServices.filter(service => service.is_active).length
  const totalVendorRoutes = vendorRoutes.length
  const totalAvailableRoutes = availableRoutes.length

  return (
    <VendorLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Route className="h-8 w-8" />
              Routes
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage the routes you want to serve
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                My Routes
              </CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVendorRoutes}</div>
              <p className="text-xs text-muted-foreground">
                Routes you created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Routes
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAvailableRoutes}</div>
              <p className="text-xs text-muted-foreground">
                Routes you can join
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Services
              </CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRoutes}</div>
              <p className="text-xs text-muted-foreground">
                Routes you currently serve
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Routes
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVendorRoutes + activeRoutes}</div>
              <p className="text-xs text-muted-foreground">
                All routes you have
              </p>
            </CardContent>
          </Card>
        </div>

        <VendorRoutesWithTabs 
          vendorRoutes={vendorRoutes}
          availableRoutes={availableRoutesWithVendorInfo}
          locations={locations}
          filters={filters}
          activeTab={params.tab as 'my-routes' | 'available-routes' || 'my-routes'}
        />
      </div>
    </VendorLayout>
  )
}