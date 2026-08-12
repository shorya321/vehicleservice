import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { AdminVehicleForm } from "../components/admin-vehicle-form"
import { getVendors } from "../actions"
export const metadata: Metadata = {
  title: "Add Vehicle - Admin",
  description: "Add a new vehicle to the system",
}

export default async function AdminAddVehiclePage() {
  const { vendors, error } = await getVendors()

  if (error || !vendors) {
    notFound()
  }

  // Filter to only show approved vendors
  const approvedVendors = vendors.filter(vendor => vendor.application_status === 'approved')

  if (approvedVendors.length === 0) {
    return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/vehicles">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Add Vehicle</h1>
              <p className="text-muted-foreground">
                Add a new vehicle to the system
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <h3 className="font-semibold">No Approved Vendors</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              There are no approved vendors in the system. Please approve at least one vendor application before adding vehicles.
            </p>
            <Button asChild className="mt-4">
              <Link href="/admin/vendor-applications">
                View Vendor Applications
              </Link>
            </Button>
          </div>
        </div>
    )
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Vehicle</h1>
            <p className="text-muted-foreground">
              Add a new vehicle to the system
            </p>
          </div>
        </div>

        <AdminVehicleForm vendors={approvedVendors} />
      </div>
  )
}