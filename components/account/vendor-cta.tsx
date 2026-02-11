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

export function VendorCTA({ vendorApplication }: VendorCTAProps) {
  if (!vendorApplication) {
    return (
      <Link href="/become-vendor" className="block">
        <div className="luxury-card p-6 border border-[var(--gold)]/20 hover:border-[var(--gold)]/40 transition-all duration-300 group cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
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
            <ArrowRight className="w-5 h-5 text-[var(--gold)] group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      </Link>
    )
  }

  const { status, business_name } = vendorApplication

  if (status === "pending") {
    return (
      <Link href="/vendor-application" className="block">
        <div className="luxury-card p-6 border border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[var(--text-primary)]">
                  {business_name || "Vendor Application"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
                    Under Review
                  </span>
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--text-muted)]" />
          </div>
        </div>
      </Link>
    )
  }

  if (status === "approved") {
    return (
      <Link href="/vendor/dashboard" className="block">
        <div className="luxury-card p-6 border border-green-500/30 hover:border-green-500/50 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[var(--text-primary)]">
                  {business_name || "Vendor Portal"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                    Approved
                  </span>
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--text-muted)]" />
          </div>
        </div>
      </Link>
    )
  }

  if (status === "rejected") {
    return (
      <Link href="/vendor-application" className="block">
        <div className="luxury-card p-6 border border-red-500/30 hover:border-red-500/50 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[var(--text-primary)]">
                  Application Rejected
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                    Rejected
                  </span>
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--text-muted)]" />
          </div>
        </div>
      </Link>
    )
  }

  return null
}
