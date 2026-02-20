"use client"

import { Building2, Mail, Phone, MapPin, FileText, Calendar, User, ClipboardList } from "lucide-react"
import { format } from "date-fns"

interface ApplicationDetailsCardProps {
  application: {
    created_at: string
    business_name: string
    business_email?: string | null
    business_phone?: string | null
    business_address?: string | null
    business_city?: string | null
    business_description?: string | null
    reviewed_at?: string | null
    admin_notes?: string | null
    reviewer?: { full_name?: string | null; email?: string | null } | null
  }
  status: "pending" | "approved" | "rejected"
  badgeColor: string
}

export function ApplicationDetailsCard({ application, status, badgeColor }: ApplicationDetailsCardProps) {
  return (
    <div className="account-section">
      <div className="account-section-header">
        <div className="account-section-icon">
          <FileText className="w-5 h-5 text-[var(--gold)]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">Application Details</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Submitted on {format(new Date(application.created_at), "PPP")}
          </p>
        </div>
      </div>

      <div className="account-section-content">
        <div className="space-y-0">
          {/* Business Information */}
          <div>
            <div className="form-subsection-header">
              <Building2 className="w-4 h-4" />
              Business Information
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoItem icon={Building2} label="Business Name" value={application.business_name} />
              {application.business_email && (
                <InfoItem icon={Mail} label="Business Email" value={application.business_email} />
              )}
              {application.business_phone && (
                <InfoItem icon={Phone} label="Business Phone" value={application.business_phone} />
              )}
              {(application.business_address || application.business_city) && (
                <InfoItem
                  icon={MapPin}
                  label="Business Location"
                  value={[application.business_address, application.business_city].filter(Boolean).join(", ")}
                />
              )}
              {application.business_description && (
                <div className="md:col-span-2">
                  <InfoItem icon={FileText} label="Business Description" value={application.business_description} />
                </div>
              )}
            </div>
          </div>

          {/* Review Information */}
          {application.reviewed_at && (
            <div className="form-subsection">
              <div className="form-subsection-header">
                <ClipboardList className="w-4 h-4" />
                Review Information
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoItem icon={Calendar} label="Reviewed On" value={format(new Date(application.reviewed_at), "PPP")} />
                {application.reviewer && (
                  <InfoItem
                    icon={User}
                    label="Reviewed By"
                    value={application.reviewer.full_name || application.reviewer.email || "Admin"}
                  />
                )}
                {application.admin_notes && (
                  <div className="md:col-span-2">
                    <InfoItem icon={FileText} label="Admin Notes" value={application.admin_notes} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-[var(--text-muted)] mb-0.5">{label}</p>
        <p className="text-sm text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  )
}
