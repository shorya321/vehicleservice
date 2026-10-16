import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BusinessProfileForm } from "./components/business-profile-form"
import { requireVendor } from "@/lib/auth/user-actions"
import { Breadcrumb } from '@/components/ui/breadcrumb'

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
    <div className="max-w-4xl mx-auto">
      <Breadcrumb homeHref="/vendor/dashboard" homeLabel="Vendor" className="mb-6" items={[{ label: 'Business Profile' }]} />
      <div className="mb-8 space-y-2">
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
  )
}