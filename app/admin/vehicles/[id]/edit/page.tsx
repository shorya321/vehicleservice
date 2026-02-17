import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { AdminVehicleForm } from "../../components/admin-vehicle-form"
import { getAdminVehicle, getVendors } from "../../actions"
export const metadata: Metadata = {
  title: "Edit Vehicle - Admin",
  description: "Edit vehicle information",
}

interface AdminEditVehiclePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminEditVehiclePage({ params }: AdminEditVehiclePageProps) {
  const { id } = await params
  
  const [vehicleResult, vendorsResult] = await Promise.all([
    getAdminVehicle(id),
    getVendors()
  ])

  if (vehicleResult.error || !vehicleResult.vehicle) {
    notFound()
  }

  if (vendorsResult.error || !vendorsResult.vendors) {
    notFound()
  }

  // Filter to only show approved vendors
  const approvedVendors = vendorsResult.vendors.filter(vendor => vendor.application_status === 'approved')

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Vehicle</h1>
            <p className="text-muted-foreground">
              Update vehicle information for {vehicleResult.vehicle.make} {vehicleResult.vehicle.model}
            </p>
          </div>
        </div>

        <AdminVehicleForm 
          initialData={vehicleResult.vehicle} 
          vendors={approvedVendors} 
        />
      </div>
  )
}