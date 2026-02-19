import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
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
    <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/vendor/vehicles">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Add New Vehicle</h1>
              <p className="text-muted-foreground">
                Add a new vehicle to your rental fleet
              </p>
            </div>
          </div>
        </div>

        <VehicleForm businessId={vendorApplication.id} />
    </div>
  )
}