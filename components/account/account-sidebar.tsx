"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Camera, Building2, ChevronRight, Clock, CheckCircle2, XCircle } from "lucide-react"
import { uploadAvatar } from "@/app/account/actions"
import { toast } from "sonner"
import { NAV_ITEMS, type TabId } from "./account-nav"
import { calculateCompletion } from "./types"

interface AccountSidebarProps {
  user: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
    phone: string | null
    date_of_birth: string | null
    address_street: string | null
    address_city: string | null
    address_country: string | null
    created_at: string
  }
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  unreadNotifications: number
  vendorApplication: {
    id: string
    status: string
    business_name: string | null
    created_at: string
  } | null
}

export function AccountSidebar({ user, activeTab, onTabChange, unreadNotifications, vendorApplication }: AccountSidebarProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url)
  const completion = calculateCompletion(user)

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    const result = await uploadAvatar(user.id, formData)
    setIsUploading(false)

    if (result.error) {
      toast.error(result.error)
    } else if (result.url) {
      setAvatarUrl(result.url)
      toast.success("Avatar updated")
    }
  }

  return (
    <aside className="account-sidebar">
      {/* Zone A: Profile Summary */}
      <div className="account-sidebar-zone">
        <div className="flex items-center gap-3">
          <div className="relative group flex-shrink-0">
            <div className="account-avatar-ring">
              <div className="account-avatar-inner">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={user.full_name || "User"}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-lg font-medium text-[var(--gold-text)]">
                    {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <label
              className="absolute inset-0 flex items-center justify-center bg-[var(--onyx)]/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200"
              aria-label="Upload profile photo"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-[var(--gold)]" aria-hidden="true" />
              )}
            </label>
          </div>
          <div className="min-w-0">
            <p className="text-[1.375rem] font-semibold text-[var(--text-primary)] leading-tight truncate">
              {user.full_name || "Welcome"}
            </p>
            <p className="text-sm text-[var(--text-secondary)] truncate">{user.email}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="account-label">Member since {memberSince}</span>
            <span className="text-xs font-medium text-[var(--gold-text)] tabular-nums">{completion}%</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--charcoal)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--gold)] transition-all duration-200"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Zone B: Navigation */}
      <nav className="account-sidebar-zone flex-1" aria-label="Account">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`account-nav-item ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.id === "notifications" && unreadNotifications > 0 && (
                    <span className="account-badge">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Zone C: Vendor CTA */}
      <VendorCTACompact vendorApplication={vendorApplication} />
    </aside>
  )
}

function VendorCTACompact({ vendorApplication }: { vendorApplication: AccountSidebarProps["vendorApplication"] }) {
  if (!vendorApplication) {
    return (
      <div className="account-sidebar-zone">
        <Link
          href="/become-vendor"
          className="account-nav-item group"
        >
          <Building2 className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Become a Vendor</span>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--gold-text)] transition-colors" />
        </Link>
      </div>
    )
  }

  const statusConfig: Record<string, { icon: typeof Clock; label: string; className: string; href: string }> = {
    pending: { icon: Clock, label: "Under Review", className: "text-[var(--status-pending-text)]", href: "/vendor-application" },
    approved: { icon: CheckCircle2, label: "Approved", className: "text-[var(--status-completed-text)]", href: "/vendor/dashboard" },
    rejected: { icon: XCircle, label: "Rejected", className: "text-[var(--error-text)]", href: "/vendor-application" },
  }

  const config = statusConfig[vendorApplication.status]
  if (!config) return null

  return (
    <div className="account-sidebar-zone">
      <Link href={config.href} className="account-nav-item group">
        <config.icon className={`w-4 h-4 flex-shrink-0 ${config.className}`} />
        <span className="flex-1 text-left">{vendorApplication.business_name || "Vendor Application"}</span>
        <span className={`account-label ${config.className}`}>{config.label}</span>
      </Link>
    </div>
  )
}
