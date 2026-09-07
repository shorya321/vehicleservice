import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { normalizeApplicationStatus } from "@/lib/vendor-application/status"
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

  // Two writes reach this page: amending a row still in review, and answering a decision
  // by resubmitting a declined one. An approved application is no longer an application,
  // and its holder edits their business profile in the vendor portal instead.
  const status = normalizeApplicationStatus(application.status)

  if (status === "approved") {
    redirect("/vendor-application")
  }

  const isResubmit = status === "rejected"

  // Get user profile for default values
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, phone")
    .eq("id", user.id)
    .single()

  return (
    <div className="bg-[var(--black-void)]">
      <div className="luxury-container pt-[clamp(3rem,7vw,5rem)] pb-[clamp(4rem,9vw,6.5rem)]">
        {/* The status page's own container and grid, so the eyebrow and the headline land
            on the same pixels on both pages. This was `max-w-3xl` inside a 1400px
            container: aligned with neither the header nor the footer. */}
        <div className="mx-auto max-w-[1100px]">
          <Link href="/vendor-application" className="account-action">
            <span aria-hidden="true">&larr;</span> Back to your application
          </Link>

          <header className="mt-6">
            <p className="editorial-eyebrow">Partner programme</p>
            <h1 className="mt-[0.5rem] text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.028em] text-[var(--text-primary)] [text-wrap:balance]">
              {isResubmit ? "Update and resubmit" : "Edit your application"}
            </h1>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)] max-w-[52ch]">
              {isResubmit
                ? "Answer the decision below, then resubmit. Your application goes back to our team with the same reference."
                : "Changes are saved against the application already in review. Nothing is resubmitted."}
            </p>
          </header>

          <VendorApplicationEditForm
            application={application}
            mode={isResubmit ? "resubmit" : "edit"}
            rejectionReason={application.rejection_reason}
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
