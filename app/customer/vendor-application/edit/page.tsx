import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CustomerLayout } from "@/components/layout/customer-layout"
import { requireCustomer } from "@/lib/auth/user-actions"
import { VendorApplicationEditForm } from "./vendor-application-edit-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Edit Vendor Application",
  description: "Update your vendor application details",
}

export default async function EditVendorApplicationPage() {
  const user = await requireCustomer()
  const supabase = await createClient()

  // Get existing vendor application
  const { data: application, error } = await supabase
    .from('vendor_applications')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !application) {
    redirect('/customer/apply-vendor')
  }

  // Only allow editing pending applications
  if (application.status !== 'pending') {
    redirect('/customer/vendor-application')
  }

  // Get user profile for default values
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', user.id)
    .single()

  return (
    <CustomerLayout user={user}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Vendor Application</h1>
            <p className="text-muted-foreground">
              Update your vendor application details and documents
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/customer/vendor-application">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Application
            </Link>
          </Button>
        </div>

        <VendorApplicationEditForm 
          userId={user.id}
          application={application}
          defaultValues={{
            businessEmail: application.business_email || profile?.email,
            businessPhone: application.business_phone || profile?.phone,
          }}
        />
      </div>
    </CustomerLayout>
  )
}