import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Layers, Hash, Users, Luggage } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { getVehicleTypes, VehicleTypeFilters } from "./actions"
import { VehicleTypesTable } from "./components/vehicle-types-table"
import { VehicleTypeFilters as VehicleTypeFiltersComponent } from "./components/vehicle-type-filters"
import { CustomPagination } from "@/components/ui/custom-pagination"
import { createClient } from '@/lib/supabase/server'
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
          <AnimatedCard delay={0.1}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Total Types</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{total}</span>
                </div>
                <p className="text-xs text-muted-foreground">Vehicle type configurations</p>
              </CardContent>
            </Card>
          </AnimatedCard>
          <AnimatedCard delay={0.2}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Active Types</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                    <Hash className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">{activeCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">Available for booking</p>
              </CardContent>
            </Card>
          </AnimatedCard>
          <AnimatedCard delay={0.3}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Categories Used</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20">
                    <Layers className="h-4 w-4 text-sky-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-violet-400">{categoriesCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">Linked categories</p>
              </CardContent>
            </Card>
          </AnimatedCard>
          <AnimatedCard delay={0.4}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Avg. Capacity</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                    <Users className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">{avgPassengerCapacity}</span>
                </div>
                <p className="text-xs text-muted-foreground">Passengers per type</p>
              </CardContent>
            </Card>
          </AnimatedCard>
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
  )
}