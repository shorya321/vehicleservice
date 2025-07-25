import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VehicleFeatureForm } from "../../components/vehicle-feature-form"
import { getVehicleFeature } from "../../actions"
import { AdminLayout } from "@/components/layout/admin-layout"

export const metadata: Metadata = {
  title: "Edit Vehicle Feature | Admin",
  description: "Edit an existing vehicle feature",
}

interface EditVehicleFeaturePageProps {
  params: {
    id: string
  }
}

export default async function EditVehicleFeaturePage({ params }: EditVehicleFeaturePageProps) {
  const feature = await getVehicleFeature(params.id)

  if (!feature) {
    notFound()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/vehicle-features">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Vehicle Feature</h1>
            <p className="text-muted-foreground">
              Update the feature details
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <VehicleFeatureForm initialData={feature} />
        </div>
      </div>
    </AdminLayout>
  )
}