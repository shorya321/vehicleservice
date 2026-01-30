import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Layers, Hash, Users, Luggage } from "lucide-react"
import { getVehicleTypes, VehicleTypeFilters } from "./actions"
import { VehicleTypesTable } from "./components/vehicle-types-table"
import { VehicleTypeFilters as VehicleTypeFiltersComponent } from "./components/vehicle-type-filters"
import { CustomPagination } from "@/components/ui/custom-pagination"
import { createClient } from '@/lib/supabase/server'
import { AdminLayout } from '@/components/layout/admin-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: "Vehicle Types | Admin",
  description: "Manage vehicle types",
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    categoryId?: string
    isActive?: string
    page?: string
  }>
}

export default async function VehicleTypesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()

  // Get categories for filters
  const { data: categories } = await supabase
    .from('vehicle_categories')
    .select('id, name, slug')
    .order('sort_order, name')

  const filters: VehicleTypeFilters = {
    search: resolvedSearchParams.search,
    categoryId: resolvedSearchParams.categoryId,
    isActive: resolvedSearchParams.isActive === 'true' ? true : resolvedSearchParams.isActive === 'false' ? false : 'all',
    page: resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1,
    limit: 10,
  }

  const { vehicleTypes, total, page, limit, totalPages } = await getVehicleTypes(filters)

  // Count stats
  const activeCount = vehicleTypes.filter(vt => vt.is_active).length
  const categoriesCount = new Set(vehicleTypes.filter(vt => vt.category_id).map(vt => vt.category_id)).size
  const avgPassengerCapacity = vehicleTypes.length > 0 
    ? Math.round(vehicleTypes.reduce((sum, vt) => sum + vt.passenger_capacity, 0) / vehicleTypes.length)
    : 0

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicle Types</h1>
            <p className="text-muted-foreground">
              Manage vehicle types and their capacities
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/vehicle-types/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle Type
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Types
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">
                Vehicle type configurations
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Types
              </CardTitle>
              <Hash className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-xs text-muted-foreground">
                Available for booking
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Categories Used
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoriesCount}</div>
              <p className="text-xs text-muted-foreground">
                Linked categories
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Capacity
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPassengerCapacity}</div>
              <p className="text-xs text-muted-foreground">
                Passengers per type
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Vehicle Types</CardTitle>
            <CardDescription>
              Define vehicle types with passenger and luggage capacities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <VehicleTypeFiltersComponent categories={categories || []} />
            <VehicleTypesTable vehicleTypes={vehicleTypes} />
            {totalPages > 1 && (
              <div className="flex justify-center">
                <CustomPagination
                  currentPage={page}
                  totalPages={totalPages}
                  baseUrl="/admin/vehicle-types"
                  searchParams={resolvedSearchParams}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}