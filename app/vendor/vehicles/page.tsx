import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VendorLayout } from "@/components/layout/vendor-layout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { requireVendor } from "@/lib/auth/user-actions"
import { VehiclesList } from "./components/vehicles-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function VendorVehiclesPage() {
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

  // Get vehicles for this business
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('business_id', vendorApplication.id)
    .order('created_at', { ascending: false })

  return (
    <VendorLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicle Fleet</h1>
            <p className="text-muted-foreground">
              Manage your rental vehicles
            </p>
          </div>
          <Button asChild>
            <Link href="/vendor/vehicles/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Link>
          </Button>
        </div>

        {vehicles && vehicles.length > 0 ? (
          <VehiclesList vehicles={vehicles} businessId={vendorApplication.id} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No vehicles yet</CardTitle>
              <CardDescription>
                Add your first vehicle to start accepting bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/vendor/vehicles/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Vehicle
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </VendorLayout>
  )
}