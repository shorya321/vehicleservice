import { notFound } from "next/navigation"
import { UserForm } from "../components/user-form"
import { getUser } from "../actions"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

interface EditUserPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params
  const user = await getUser(id)

  if (!user) {
    notFound()
  }

  // Fetch vendor application if user is a vendor
  let businessProfile = null
  if (user.role === 'vendor') {
    const supabase = await createClient()
    const { data: vendorApp } = await supabase
      .from('vendor_applications')
      .select('*')
      .eq('user_id', id)
      .single()
    
    // Convert vendor_applications fields to match business profile format
    if (vendorApp) {
      businessProfile = {
        business_name: vendorApp.business_name,
        business_email: vendorApp.business_email,
        business_phone: vendorApp.business_phone,
        address: vendorApp.business_address,
        city: vendorApp.business_city,
        country_code: vendorApp.business_country_code,
        description: vendorApp.business_description,
      }
    }
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
            <p className="text-muted-foreground">
              Update user information and permissions
            </p>
          </div>
        </div>

        <UserForm mode="edit" user={user} businessProfile={businessProfile} />
      </div>
  )
}