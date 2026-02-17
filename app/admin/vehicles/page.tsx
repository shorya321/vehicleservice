import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Car, Building2, Layers } from 'lucide-react'
import { AnimatedCard } from '@/components/ui/animated-card'
import { AdminVehicleTableWithBulk } from './components/admin-vehicle-table-with-bulk'
import { ClientFilters } from './components/client-filters'
import { getAdminVehicles, getVendors, AdminVehicleFilters } from './actions'
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
                <p className="text-xs text-muted-foreground">Across all vendors</p>
              </CardContent>
            </Card>
          </AnimatedCard>
          <AnimatedCard delay={0.2}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Available</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                    <Car className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">{availableCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">Ready for booking</p>
              </CardContent>
            </Card>
          </AnimatedCard>
          <AnimatedCard delay={0.3}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Vendors</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20">
                    <Building2 className="h-4 w-4 text-sky-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-violet-400">{vendorCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">With vehicles</p>
              </CardContent>
            </Card>
          </AnimatedCard>
          <AnimatedCard delay={0.4}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Vehicle Types</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                    <Layers className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">
                    {new Set(vehicles.map(v => v.vehicle_type_id).filter(Boolean)).size}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Different vehicle types</p>
              </CardContent>
            </Card>
          </AnimatedCard>
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
  )
}