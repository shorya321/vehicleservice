import { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VehicleFeatureForm } from "../components/vehicle-feature-form"
import { AdminLayout } from "@/components/layout/admin-layout"

export const metadata: Metadata = {
  title: "Add Vehicle Feature | Admin",
  description: "Add a new vehicle feature",
}

export default function NewVehicleFeaturePage() {
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
            <h1 className="text-3xl font-bold tracking-tight">Add Vehicle Feature</h1>
            <p className="text-muted-foreground">
              Create a new feature for vehicles
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <VehicleFeatureForm />
        </div>
      </div>
    </AdminLayout>
  )
}