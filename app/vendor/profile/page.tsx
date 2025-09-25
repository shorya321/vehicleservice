import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VendorLayout } from "@/components/layout/vendor-layout"
import { BusinessProfileForm } from "./components/business-profile-form"
import { requireVendor } from "@/lib/auth/user-actions"

export default async function VendorProfilePage() {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application data (which serves as business profile)
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('*')
    .eq('user_id', user.id)
    .single()


  return (
    <VendorLayout user={user} vendorApplication={vendorApplication}>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
          <p className="text-muted-foreground">
            {vendorApplication 
              ? "Manage your business information and settings"
              : "Set up your business profile to start listing vehicles"
            }
          </p>
        </div>

        <BusinessProfileForm 
          vendorId={user.id}
          initialData={vendorApplication}
          isApproved={vendorApplication?.status === 'approved'}
        />
      </div>
    </VendorLayout>
  )
}