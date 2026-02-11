export const dynamic = 'force-dynamic'

import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ApplicationStatusAlert, getStatusBadgeColor } from "@/components/vendor-application/application-status-alert"
import { ApplicationDetailsCard } from "@/components/vendor-application/application-details-card"

export const metadata: Metadata = {
  title: "Vendor Application Status | Track Your Application",
  description: "Track the status of your vendor application",
}

export default async function VendorApplicationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/vendor-application")
  }

  const { data: application, error } = await supabase
    .from("vendor_applications")
    .select(`*, reviewer:reviewed_by(full_name, email)`)
    .eq("user_id", user.id)
    .single()

  if (error || !application) {
    redirect("/become-vendor")
  }

  const status = application.status as "pending" | "approved" | "rejected"

  return (
    <div className="min-h-screen bg-[var(--black-void)]">
      <div className="luxury-container py-8 md:py-12">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Account
        </Link>

        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] mb-2">
              Vendor Application
            </h1>
            <p className="text-[var(--text-muted)]">Track the status of your vendor application</p>
          </div>

          <ApplicationStatusAlert status={status} rejectionReason={application.rejection_reason} />

          <ApplicationDetailsCard
            application={application}
            status={status}
            badgeColor={getStatusBadgeColor(status)}
          />

          {status === "pending" && <PendingActionsCard />}
          {status === "rejected" && <RejectedActionsCard />}
        </div>
      </div>
    </div>
  )
}

function PendingActionsCard() {
  return (
    <div className="luxury-card p-6">
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Application Actions</h3>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        You can update your application while it&apos;s under review. Need to update your documents
        or business information?
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/vendor-application/edit" className="btn btn-primary">
          Edit Application
        </Link>
        <button className="btn btn-secondary">Contact Support</button>
      </div>
    </div>
  )
}

function RejectedActionsCard() {
  return (
    <div className="luxury-card p-6">
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Next Steps</h3>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Please review the rejection reason carefully and ensure you meet all requirements before
        submitting a new application. If you have questions, please contact our support team.
      </p>
      <button className="btn btn-secondary">Contact Support</button>
    </div>
  )
}
