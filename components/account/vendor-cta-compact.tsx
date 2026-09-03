"use client"

import Link from "next/link"
import { Clock, CheckCircle2, XCircle } from "lucide-react"
import { APPLICATION_STATUS_LABEL } from "@/lib/vendor-application/status"

export interface VendorApplicationSummary {
  id: string
  status: string
  business_name: string | null
  created_at: string
}

/**
 * The account's standing invitation to list a fleet, and the application status once one exists.
 *
 * Lifted out of account-sidebar.tsx unchanged. The sidebar is `hidden lg:block`, so this was the
 * one thing in the rail with no mobile counterpart at all: the mobile header renders a profile row
 * and the tab bar and nothing else, and git shows /become-vendor was never referenced in either
 * that file or account-client. It renders in both layouts now, which is why the wrapper class is a
 * prop: the rail keeps its zone treatment and the mobile block takes the trust rail's.
 */
export function VendorCTACompact({
  vendorApplication,
  className = "account-sidebar-zone",
}: {
  vendorApplication: VendorApplicationSummary | null
  className?: string
}) {

  if (!vendorApplication) {
    return (
      <div className={className}>
        {/* This was `.account-action`, the text-link treatment, so the one CTA in the rail read as
            a sentence rather than as something to press. It is the sanctioned secondary button
            now: transparent fill and a 1px gold edge, which is loud enough to be found and quiet
            enough not to compete with the gold-filled primary on the booking detail. Pitch, then
            the control, rather than a control followed by an explanation of itself. */}
        <p className="account-label">Partner with Infinia</p>
        <p className="mt-2 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
          Run a fleet in the UAE? List your vehicles and take bookings through us.
        </p>
        <Link href="/become-vendor" className="btn btn-secondary mt-4 w-full">
          Apply to partner
        </Link>
      </div>
    )
  }

  const statusConfig: Record<string, { icon: typeof Clock; label: string; className: string; href: string }> = {
    pending: { icon: Clock, label: APPLICATION_STATUS_LABEL.pending, className: "text-[var(--status-pending-text)]", href: "/vendor-application" },
    approved: { icon: CheckCircle2, label: APPLICATION_STATUS_LABEL.approved, className: "text-[var(--status-completed-text)]", href: "/vendor/dashboard" },
    rejected: { icon: XCircle, label: APPLICATION_STATUS_LABEL.rejected, className: "text-[var(--error-text)]", href: "/vendor-application" },
  }

  const config = statusConfig[vendorApplication.status]
  if (!config) return null

  return (
    <div className={className}>
      <Link href={config.href} className="account-nav-item group">
        <config.icon className={`w-4 h-4 flex-shrink-0 ${config.className}`} />
        <span className="flex-1 text-left truncate">{vendorApplication.business_name || "Vendor Application"}</span>
        <span className={`account-label flex-shrink-0 ${config.className}`}>{config.label}</span>
      </Link>
    </div>
  )
}
