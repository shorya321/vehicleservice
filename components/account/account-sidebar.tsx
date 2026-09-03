"use client"

import { getBookingTimezone } from "@/lib/utils/timezone"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Camera } from "lucide-react"
import { uploadAvatar } from "@/app/account/actions"
import { toast } from "sonner"
import { NAV_ITEMS, type TabId } from "./account-nav"
import { calculateCompletion } from "./types"
import { VendorCTACompact } from "./vendor-cta-compact"

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
  /**
   * Omitted on the booking detail route, where the sidebar must navigate rather than swap a tab.
   * The tab callback rewrites the URL against the current pathname, so on /account/bookings/[ref]
   * it would produce /account/bookings/[ref]?tab=personal and render the wrong panel under the
   * wrong address. Without it every item renders as a real link back to /account.
   */
  onTabChange?: (tab: TabId) => void
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
  const profileComplete = calculateCompletion(user) === 100

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", { timeZone: getBookingTimezone(), 
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
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-base font-medium text-[var(--gold-text)]">
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
            <p className="text-[1.125rem] font-medium leading-snug text-[var(--text-primary)] [overflow-wrap:anywhere]">
              {user.full_name || "Welcome"}
            </p>
            <p className="text-[0.8125rem] leading-snug text-[var(--text-muted)] [overflow-wrap:anywhere]">
              {user.email}
            </p>
          </div>
        </div>

        {/* A progress bar tells a customer they are incomplete. A record of
            what they have travelled tells them they are known. Same space. */}
        <dl className="account-dl account-dl-inline mt-5">
          <div>
            <dt>Member since</dt>
            <dd>{memberSince}</dd>
          </div>
          {profileComplete ? null : (
            <div>
              <dt>Profile</dt>
              <dd>
                {onTabChange ? (
                  <button
                    type="button"
                    onClick={() => onTabChange("personal")}
                    className="account-action"
                  >
                    Finish setup
                  </button>
                ) : (
                  <Link href="/account?tab=personal" className="account-action">
                    Finish setup
                  </Link>
                )}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Zone B: Navigation */}
      <nav className="account-sidebar-zone flex-1" aria-label="Account">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            const itemBody = (
              <>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === "notifications" && unreadNotifications > 0 && (
                  <span className="account-badge">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>
                )}
              </>
            )
            return (
              <li key={item.id}>
                {onTabChange ? (
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={`account-nav-item ${isActive ? "active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {itemBody}
                  </button>
                ) : (
                  <Link
                    href={`/account?tab=${item.id}`}
                    className={`account-nav-item ${isActive ? "active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {itemBody}
                  </Link>
                )}
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
