import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft, Settings, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { ApplicationStatusAlert } from "@/components/vendor-application/application-status-alert"
import { ApplicationDetailsCard } from "@/components/vendor-application/application-details-card"

export const metadata: Metadata = {
  title: "Vendor Application Status | Track Your Application",
  description: "Track the status of your vendor application",
}

const STATUS_BADGE_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
}

export default async function VendorApplicationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/vendor-application")
  }

  const { data: application, error } = await supabase
    .from("vendor_applications")
    .select(`*, reviewer:profiles!vendor_applications_reviewed_by_fkey(full_name, email)`)
    .eq("user_id", user.id)
    .single()

  if (error || !application) {
    redirect("/become-vendor")
  }

  const validStatuses = ["pending", "approved", "rejected"] as const
  const status = validStatuses.includes(application.status as any)
    ? (application.status as "pending" | "approved" | "rejected")
    : "pending"

  return (
    <div className="bg-[var(--black-void)]">
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
            badgeColor={STATUS_BADGE_COLORS[status]}
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
    <div className="account-section">
      <div className="account-section-header">
        <div className="account-section-icon">
          <Settings className="w-5 h-5 text-[var(--gold)]" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-[var(--text-primary)]">Application Actions</h3>
          <p className="text-sm text-[var(--text-muted)]">
            You can update your application while it&apos;s under review
          </p>
        </div>
      </div>
      <div className="account-section-content">
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Need to update your documents or business information?
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/vendor-application/edit" className="btn btn-primary">
            Edit Application
          </Link>
          <button className="btn btn-secondary">Contact Support</button>
        </div>
      </div>
    </div>
  )
}

function RejectedActionsCard() {
  return (
    <div className="account-section">
      <div className="account-section-header">
        <div className="account-section-icon">
          <AlertTriangle className="w-5 h-5 text-[var(--gold)]" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-[var(--text-primary)]">Next Steps</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Review the rejection reason and reapply
          </p>
        </div>
      </div>
      <div className="account-section-content">
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Please review the rejection reason carefully and ensure you meet all requirements before
          submitting a new application. If you have questions, please contact our support team.
        </p>
        <button className="btn btn-secondary">Contact Support</button>
      </div>
    </div>
  )
}
