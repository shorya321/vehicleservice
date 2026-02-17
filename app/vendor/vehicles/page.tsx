import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VendorLayout } from "@/components/layout/vendor-layout"
import { Button } from "@/components/ui/button"
import { Plus, Car } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
import Link from "next/link"
import { requireVendor } from "@/lib/auth/user-actions"
import { VehicleTableWithBulk } from "./components/vehicle-table-with-bulk"
import { ClientFilters } from "./components/client-filters"
import { getVehicles, VehicleFilters } from "./actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: 'Vehicles - Vendor Portal',
  description: 'Manage your vehicle fleet',
}

interface VendorVehiclesPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    fuelType?: string
    transmission?: string
    minPrice?: string
    maxPrice?: string
    seats?: string
    page?: string
  }>
}

export default async function VendorVehiclesPage({ searchParams }: VendorVehiclesPageProps) {
  const user = await requireVendor()
  const supabase = await createClient()
  
  const params = await searchParams

  // Check if vendor application is approved
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!vendorApplication || vendorApplication.status !== 'approved') {
    redirect('/vendor/profile')
  }

  const filters: VehicleFilters = {
    search: params.search,
    status: (params.status as any) || 'all',
    fuelType: (params.fuelType as any) || 'all',
    transmission: (params.transmission as any) || 'all',
    page: params.page ? parseInt(params.page) : 1,
    limit: 10,
    ...(params.minPrice && { minPrice: parseFloat(params.minPrice) }),
    ...(params.maxPrice && { maxPrice: parseFloat(params.maxPrice) }),
    ...(params.seats && { seats: parseInt(params.seats) })
  }

  const { vehicles, total, page, totalPages } = await getVehicles(vendorApplication.id, filters)

  return (
    <VendorLayout user={user} vendorApplication={vendorApplication}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicle Fleet</h1>
            <p className="text-muted-foreground">
              Manage your rental vehicles
            </p>
          </div>
          <Button asChild>
            <Link href="/vendor/vehicles/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <AnimatedCard delay={0.1}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Total Vehicles</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                    <Car className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{total}</span>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Vehicles</CardTitle>
            <CardDescription>
              View and manage your vehicle fleet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClientFilters initialFilters={filters} />
            
            {vehicles.length > 0 ? (
              <>
                <VehicleTableWithBulk 
                  vehicles={vehicles} 
                  businessId={vendorApplication.id}
                />

                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {((page - 1) * filters.limit!) + 1} to{" "}
                      {Math.min(page * filters.limit!, total)} of {total} vehicles
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        asChild
                      >
                        <Link
                          href={{
                            pathname: "/vendor/vehicles",
                            query: {
                              ...params,
                              page: page - 1,
                            },
                          }}
                        >
                          Previous
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        asChild
                      >
                        <Link
                          href={{
                            pathname: "/vendor/vehicles",
                            query: {
                              ...params,
                              page: page + 1,
                            },
                          }}
                        >
                          Next
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Car className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No vehicles found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filters.search || filters.status !== 'all' || filters.fuelType !== 'all' 
                    ? "Try adjusting your filters" 
                    : "Get started by adding your first vehicle"}
                </p>
                {!filters.search && filters.status === 'all' && filters.fuelType === 'all' && (
                  <div className="mt-6">
                    <Button asChild>
                      <Link href="/vendor/vehicles/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Vehicle
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  )
}