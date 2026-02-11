"use client"

import { Clock, CheckCircle2, XCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

const STATUS_CONFIG = {
  pending: {
    color: "border-yellow-500/30 bg-yellow-500/10",
    iconColor: "text-yellow-400",
    icon: Clock,
    title: "Application Under Review",
    description: "Your application is being reviewed by our team. We'll notify you within 48 hours.",
  },
  approved: {
    color: "border-green-500/30 bg-green-500/10",
    iconColor: "text-green-400",
    icon: CheckCircle2,
    title: "Application Approved!",
    description: "Congratulations! Your vendor application has been approved.",
  },
  rejected: {
    color: "border-red-500/30 bg-red-500/10",
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
    <div className={`luxury-card p-6 ${config.color}`}>
      <div className="flex gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${config.color}`}>
          <StatusIcon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        <div className="flex-1">
          <h2 className={`text-lg font-medium mb-1 ${config.iconColor}`}>{config.title}</h2>
          <p className="text-[var(--text-muted)] text-sm mb-4">{config.description}</p>

          {status === "approved" && (
            <Link href="/vendor/profile" className="inline-flex items-center gap-2 btn btn-primary">
              Complete Your Vendor Profile
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}

          {status === "rejected" && rejectionReason && (
            <div className="mt-4 p-4 rounded-lg bg-[var(--charcoal)] border border-red-500/20">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Reason for rejection:</p>
              <p className="text-sm text-[var(--text-muted)]">{rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
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
