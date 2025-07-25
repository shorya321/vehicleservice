import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getVehicleFeatures } from "./actions"
import { VehicleFeatureTable } from "./components/vehicle-feature-table"
import { VehicleFeatureFilters } from "./components/vehicle-feature-filters"
import { VendorLayout } from "@/components/layout/vendor-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export const metadata: Metadata = {
  title: "Vehicle Features | Vendor",
  description: "Manage vehicle features for your vehicles",
}

interface VehicleFeaturesPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    category?: string
    is_active?: string
  }>
}

export default async function VehicleFeaturesPage({ searchParams }: VehicleFeaturesPageProps) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const filters = {
    page: currentPage,
    search: params.search,
    category: params.category,
    is_active: params.is_active === undefined ? undefined : params.is_active === 'true' ? true : params.is_active === 'false' ? false : undefined,
  }

  const { features, totalPages, total } = await getVehicleFeatures(filters)

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicle Features</h1>
            <p className="text-muted-foreground">
              Browse available features for your vehicles
            </p>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Vehicle features are managed by administrators. You can view and filter available features here. 
            When adding or editing vehicles, you&apos;ll be able to select from the active features shown below.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Available Vehicle Features</CardTitle>
            <CardDescription>
              View all features that can be assigned to your vehicles. Features are managed by administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <VehicleFeatureFilters filters={filters} />
            <VehicleFeatureTable 
              features={features} 
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
            />
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  )
}