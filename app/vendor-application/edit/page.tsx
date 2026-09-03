import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
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
    <div className="bg-[var(--black-void)]">
      <div className="luxury-container pt-[clamp(3rem,7vw,5rem)] pb-[clamp(4rem,9vw,6.5rem)]">
        <div className="max-w-3xl mx-auto">
          <Link href="/vendor-application" className="account-action">
            <span aria-hidden="true">&larr;</span> Back to your application
          </Link>

          <header className="mt-6 mb-[clamp(2.5rem,5vw,3.5rem)]">
            <p className="editorial-eyebrow">Partner programme</p>
            <h1 className="mt-[0.5rem] text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.028em] text-[var(--text-primary)] [text-wrap:balance]">
              Edit your application
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)] max-w-[52ch]">
              Changes are saved against the application already in review. Nothing is resubmitted.
            </p>
          </header>

          {/* Edit Form */}
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
  )
}
