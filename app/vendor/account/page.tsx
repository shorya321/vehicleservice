import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccountForm } from "./account-form"
import { requireVendor } from "@/lib/auth/user-actions"

export const metadata: Metadata = {
  title: "Account Settings | Vendor Portal",
  description: "Manage your personal account settings",
}

export default async function VendorAccountPage() {
  const user = await requireVendor()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'vendor') {
    redirect('/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal account settings and preferences
        </p>
      </div>

      <AccountForm user={profile} />
    </div>
  )
}