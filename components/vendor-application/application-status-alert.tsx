"use client"

import { Clock, CheckCircle2, XCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

const STATUS_CONFIG = {
  pending: {
    borderColor: "border-yellow-500/20",
    iconBg: "bg-yellow-500/15 border-yellow-500/30",
    iconColor: "text-yellow-400",
    icon: Clock,
    title: "Application Under Review",
    description: "Your application is being reviewed by our team. We'll notify you within 48 hours.",
  },
  approved: {
    borderColor: "border-green-500/20",
    iconBg: "bg-green-500/15 border-green-500/30",
    iconColor: "text-green-400",
    icon: CheckCircle2,
    title: "Application Approved!",
    description: "Congratulations! Your vendor application has been approved.",
  },
  rejected: {
    borderColor: "border-red-500/20",
    iconBg: "bg-red-500/15 border-red-500/30",
    iconColor: "text-red-400",
    icon: XCircle,
    title: "Application Rejected",
    description: "Unfortunately, your application was not approved at this time.",
  },
} as const

interface ApplicationStatusAlertProps {
  status: "pending" | "approved" | "rejected"
  rejectionReason?: string | null
}

export function ApplicationStatusAlert({ status, rejectionReason }: ApplicationStatusAlertProps) {
  const config = STATUS_CONFIG[status]
  const StatusIcon = config.icon

  return (
    <div className={`account-section ${config.borderColor}`}>
      <div className="account-section-header">
        <div className={`account-section-icon ${config.iconBg}`}>
          <StatusIcon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div>
          <h3 className={`text-lg font-medium ${config.iconColor}`}>{config.title}</h3>
          <p className="text-sm text-[var(--text-muted)]">{config.description}</p>
        </div>
      </div>

      {(status === "approved" || (status === "rejected" && rejectionReason)) && (
        <div className="account-section-content">
          {status === "approved" && (
            <Link href="/vendor/profile" className="inline-flex items-center gap-2 btn btn-primary">
              Complete Your Vendor Profile
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}

          {status === "rejected" && rejectionReason && (
            <div className="p-4 rounded-lg bg-[var(--charcoal)] border border-red-500/20">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Reason for rejection:</p>
              <p className="text-sm text-[var(--text-muted)]">{rejectionReason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function getStatusBadgeColor(status: "pending" | "approved" | "rejected"): string {
  const colors = {
    pending: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-green-500/20 text-green-400",
    rejected: "bg-red-500/20 text-red-400",
  }
  return colors[status]
}
