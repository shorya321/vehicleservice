import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VendorLayout } from "@/components/layout/vendor-layout"
import { requireVendor } from "@/lib/auth/user-actions"
import { VehicleForm } from "../components/vehicle-form"

export default async function NewVehiclePage() {
  const user = await requireVendor()
  const supabase = await createClient()

  // Check if vendor application is approved
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!vendorApplication || vendorApplication.status !== 'approved') {
    redirect('/vendor/profile')
  }

  return (
    <VendorLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Add New Vehicle</h1>
          <p className="text-muted-foreground">
            Add a new vehicle to your rental fleet
          </p>
        </div>

        <VehicleForm businessId={vendorApplication.id} />
      </div>
    </VendorLayout>
  )
}