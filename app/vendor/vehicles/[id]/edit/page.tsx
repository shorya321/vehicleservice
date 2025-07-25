import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VendorLayout } from "@/components/layout/vendor-layout"
import { requireVendor } from "@/lib/auth/user-actions"
import { VehicleForm } from "../../components/vehicle-form"
import { getVehicleFeatures } from "../../actions"

interface EditVehiclePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const user = await requireVendor()
  const supabase = await createClient()
  const { id } = await params

  // Check if vendor application is approved
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!vendorApplication || vendorApplication.status !== 'approved') {
    redirect('/vendor/profile')
  }

  // Get the specific vehicle
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .eq('business_id', vendorApplication.id)
    .single()

  if (!vehicle) {
    notFound()
  }

  // Get existing feature selections
  const featureIds = await getVehicleFeatures(id)
  const vehicleWithFeatures = {
    ...vehicle,
    feature_ids: featureIds
  }

  return (
    <VendorLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Edit Vehicle</h1>
          <p className="text-muted-foreground">
            Update vehicle information for {vehicle.make} {vehicle.model}
          </p>
        </div>

        <VehicleForm businessId={vendorApplication.id} initialData={vehicleWithFeatures} />
      </div>
    </VendorLayout>
  )
}