"use client"

import Link from "next/link"
import { Building2, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react"

interface VendorApplication {
  id: string
  status: string
  business_name: string | null
  created_at: string
}

interface VendorCTAProps {
  vendorApplication: VendorApplication | null
}

const STATUS_CONFIG: Record<string, {
  icon: typeof Clock
  iconColor: string
  bgColor: string
  borderColor: string
  hoverBorderColor: string
  badgeLabel: string
  badgeTextColor: string
  fallbackTitle: string
  href: string
}> = {
  pending: {
    icon: Clock,
    iconColor: "text-[var(--status-pending-text)]",
    bgColor: "bg-[var(--status-pending-bg)]",
    borderColor: "border-[var(--status-pending-border)]",
    hoverBorderColor: "hover:border-[var(--status-pending-text)]/50",
    badgeLabel: "Under Review",
    badgeTextColor: "text-[var(--status-pending-text)]",
    fallbackTitle: "Vendor Application",
    href: "/vendor-application",
  },
  approved: {
    icon: CheckCircle2,
    iconColor: "text-[var(--status-completed-text)]",
    bgColor: "bg-[var(--status-completed-bg)]",
    borderColor: "border-[var(--status-completed-border)]",
    hoverBorderColor: "hover:border-[var(--status-completed-text)]/50",
    badgeLabel: "Approved",
    badgeTextColor: "text-[var(--status-completed-text)]",
    fallbackTitle: "Vendor Portal",
    href: "/vendor/dashboard",
  },
  rejected: {
    icon: XCircle,
    iconColor: "text-[var(--error-text)]",
    bgColor: "bg-[var(--status-cancelled-bg)]",
    borderColor: "border-[var(--status-cancelled-border)]",
    hoverBorderColor: "hover:border-[var(--error-text)]/50",
    badgeLabel: "Rejected",
    badgeTextColor: "text-[var(--error-text)]",
    fallbackTitle: "Application Rejected",
    href: "/vendor-application",
  },
}

export function VendorCTA({ vendorApplication }: VendorCTAProps) {
  if (!vendorApplication) {
    return (
      <Link href="/become-vendor" className="block">
        <div className="account-item-card border-[var(--gold)]/20 hover:border-[var(--gold)]/40 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[var(--gold)]" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[var(--text-primary)]">
                  Become a Vendor Partner
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  List your vehicles and grow your transfer business with us
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--gold)] group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </div>
      </Link>
    )
  }

  const config = STATUS_CONFIG[vendorApplication.status]
  if (!config) return null

  const StatusIcon = config.icon

  return (
    <Link href={config.href} className="block">
      <div className={`account-item-card ${config.borderColor} ${config.hoverBorderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg ${config.bgColor} flex items-center justify-center`}>
              <StatusIcon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-[var(--text-primary)]">
                {vendorApplication.business_name || config.fallbackTitle}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium uppercase mt-1 ${config.bgColor} ${config.badgeTextColor}`}>
                {config.badgeLabel}
              </span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[var(--text-muted)]" />
        </div>
      </div>
    </Link>
  )
}
