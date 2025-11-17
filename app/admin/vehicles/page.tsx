import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Car, Building2 } from 'lucide-react'
import { AdminVehicleTableWithBulk } from './components/admin-vehicle-table-with-bulk'
import { ClientFilters } from './components/client-filters'
import { getAdminVehicles, getVendors, AdminVehicleFilters } from './actions'
import { AdminLayout } from '@/components/layout/admin-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'

export const metadata: Metadata = {
  title: 'Vehicles - Admin',
  description: 'Manage all vehicles across vendors',
}

export const dynamic = 'force-dynamic'

interface AdminVehiclesPageProps {
  searchParams: Promise<{
    search?: string
    vendorId?: string
    categoryId?: string
    vehicleTypeId?: string
    status?: string
    fuelType?: string
    transmission?: string
    seats?: string
    page?: string
  }>
}

export default async function AdminVehiclesPage({ searchParams }: AdminVehiclesPageProps) {
  const params = await searchParams

  const filters: AdminVehicleFilters = {
    search: params.search,
    vendorId: params.vendorId || 'all',
    categoryId: params.categoryId || 'all',
    vehicleTypeId: params.vehicleTypeId || 'all',
    status: (params.status as any) || 'all',
    fuelType: (params.fuelType as any) || 'all',
    transmission: (params.transmission as any) || 'all',
    seats: params.seats ? parseInt(params.seats) : undefined,
    page: params.page ? parseInt(params.page) : 1,
    limit: 10,
  }

  const { vehicles, total, page, totalPages } = await getAdminVehicles(filters)
  const { vendors } = await getVendors()

  // Count stats
  const availableCount = vehicles.filter(v => v.is_available).length
  const vendorCount = new Set(vehicles.map(v => v.business_id)).size

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Vehicles</h1>
            <p className="text-muted-foreground">
              Manage vehicles across all vendors
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/vehicles/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Vehicles
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">
                Across all vendors
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available
              </CardTitle>
              <Car className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableCount}</div>
              <p className="text-xs text-muted-foreground">
                Ready for booking
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vendors
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendorCount}</div>
              <p className="text-xs text-muted-foreground">
                With vehicles
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vehicle Types
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(vehicles.map(v => v.vehicle_type_id).filter(Boolean)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                Different vehicle types
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Vehicles</CardTitle>
            <CardDescription>
              View and manage vehicles from all vendors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClientFilters vendors={vendors} />
            <AdminVehicleTableWithBulk vehicles={vehicles} />
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  baseUrl="/admin/vehicles"
                  queryParams={params}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}