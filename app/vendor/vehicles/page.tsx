import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, Car } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
import Link from "next/link"
import { requireVendor } from "@/lib/auth/user-actions"
import { VehicleTableWithBulk } from "./components/vehicle-table-with-bulk"
import { ClientFilters } from "./components/client-filters"
import { getVehicles } from "./actions"
import type { VehicleFilters } from "@/lib/types/vehicle"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FilterToggle } from '@/components/admin/ui/filter-toggle'
import { PagePagination } from '@/components/admin/ui/page-pagination'

export const metadata: Metadata = {
  title: 'Vehicles - Vendor Portal',
  description: 'Manage your vehicle fleet',
}

interface VendorVehiclesPageProps {
  searchParams: Promise<{
    search?: string
    categoryId?: string
    status?: string
    fuelType?: string
    transmission?: string
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
    categoryId: params.categoryId || 'all',
    status: (params.status as any) || 'all',
    fuelType: (params.fuelType as any) || 'all',
    transmission: (params.transmission as any) || 'all',
    page: params.page ? parseInt(params.page) : 1,
    limit: 10,
    ...(params.seats && { seats: parseInt(params.seats) })
  }

  const { vehicles, total, page, totalPages } = await getVehicles(vendorApplication.id, filters)

  const activeFilterCount = [
    params.search,
    params.categoryId && params.categoryId !== 'all',
    params.status && params.status !== 'all',
    params.fuelType && params.fuelType !== 'all',
    params.transmission && params.transmission !== 'all',
    params.seats,
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      <Breadcrumb homeHref="/vendor/dashboard" homeLabel="Vendor" items={[{ label: 'Vehicle Fleet' }]} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Vehicle Fleet</h1>
            <p className="text-muted-foreground">
              Manage your rental vehicles
            </p>
          </div>
          <Button asChild size="sm">
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
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-700 dark:text-sky-400">{total}</span>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>

        <Card>
          <CardHeader>
            <FilterToggle
              activeCount={activeFilterCount}
              header={
                <div className="space-y-1.5">
                  <CardTitle>All Vehicles</CardTitle>
                  <CardDescription>
                    View and manage your vehicle fleet
                  </CardDescription>
                </div>
              }
            >
              <ClientFilters initialFilters={filters} />
            </FilterToggle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {vehicles.length > 0 ? (
              <>
                <VehicleTableWithBulk 
                  vehicles={vehicles} 
                  businessId={vendorApplication.id}
                />

                <PagePagination
                  pathname="/vendor/vehicles"
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  limit={filters.limit!}
                  noun="vehicles"
                  query={params}
                />
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
                    <Button asChild size="sm">
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
  )
}