import { Metadata } from "next"
import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { VehicleFeatureTable } from "./components/vehicle-feature-table"
import { VehicleFeatureFilters } from "./components/vehicle-feature-filters"
import { getVehicleFeatures } from "./actions"
import { AdminLayout } from "@/components/layout/admin-layout"

export const metadata: Metadata = {
  title: "Vehicle Features | Admin",
  description: "Manage vehicle features",
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    is_active?: string
    page?: string
  }>
}

export default async function VehicleFeaturesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const filters = {
    search: params.search,
    category: params.category === 'all' ? undefined : params.category,
    is_active: params.is_active === undefined ? undefined : params.is_active === 'all' ? undefined : params.is_active === 'true',
    page: parseInt(params.page || '1'),
    limit: 10,
  }

  const { features, total, totalPages } = await getVehicleFeatures(filters)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicle Features</h1>
            <p className="text-muted-foreground">
              Manage the master list of available vehicle features
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/vehicle-features/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Feature
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Features</CardTitle>
            <CardDescription>
              A complete list of all vehicle features in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <VehicleFeatureFilters filters={filters} />
            <VehicleFeatureTable 
              features={features} 
              currentPage={filters.page}
              totalPages={totalPages}
              total={total}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}