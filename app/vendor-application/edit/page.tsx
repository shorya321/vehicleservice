import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { VendorApplicationEditForm } from "./vendor-application-edit-form"

export const metadata: Metadata = {
  title: "Edit Vendor Application | Update Your Details",
  description: "Update your vendor application details and documents",
}

export default async function EditVendorApplicationPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/vendor-application/edit")
  }

  // Get existing vendor application
  const { data: application, error } = await supabase
    .from("vendor_applications")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (error || !application) {
    redirect("/become-vendor")
  }

  // Only allow editing pending applications
  if (application.status !== "pending") {
    redirect("/vendor-application")
  }

  // Get user profile for default values
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, phone")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-[var(--black-void)]">
      <div className="luxury-container py-8 md:py-12">
        {/* Back Link */}
        <Link
          href="/vendor-application"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Application Status
        </Link>

        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] mb-2">
              Edit Application
            </h1>
            <p className="text-[var(--text-muted)]">
              Update your vendor application details and documents
            </p>
          </div>

          {/* Edit Form */}
          <div className="luxury-card p-6 md:p-8">
            <VendorApplicationEditForm
              userId={user.id}
              application={application}
              defaultValues={{
                businessEmail: application.business_email || profile?.email,
                businessPhone: application.business_phone || profile?.phone,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
