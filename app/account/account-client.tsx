"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { AccountMobileHeader } from "@/components/account/account-mobile-header"
import { OverviewTab } from "@/components/account/overview-tab"
import { PersonalInfoTab } from "@/components/account/personal-info-tab"
import { SecurityTab } from "@/components/account/security-tab"
import { PreferencesTab } from "@/components/account/preferences-tab"
import { BookingsTab } from "@/components/account/bookings-tab"
import { ReviewsTab } from "@/components/account/reviews-tab"
import { NotificationsTab } from "@/components/account/notifications-tab"
import { VendorCTACompact } from "@/components/account/vendor-cta-compact"
import { resolveTab, type TabId } from "@/components/account/account-nav"
import { calculateCompletion, type NotificationListItem } from "@/components/account/types"
import type { AccountOverview } from "./overview-actions"
import { getBookingTimezone } from "@/lib/utils/timezone"

interface AccountClientProps {
  initialTab?: string
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
  notificationPrefs: {
    email_booking_updates: boolean
    email_payment_alerts: boolean
    email_security_alerts: boolean
    email_system_updates: boolean
  } | null
  deletionRequest: {
    id: string
    reason: string
    requested_at: string
  } | null
  vendorApplication: {
    id: string
    status: string
    business_name: string | null
    created_at: string
  } | null
  unreadNotifications: number
  /** Read on the server so the landing panel does not open on a skeleton. */
  overview: AccountOverview
  recentAlerts: NotificationListItem[]
}

export function AccountClient({
  initialTab,
  user,
  notificationPrefs,
  deletionRequest,
  vendorApplication,
  unreadNotifications,
  overview,
  recentAlerts,
}: AccountClientProps) {
  const [activeTab, setActiveTabState] = useState(() => resolveTab(initialTab))
  const pathname = usePathname()
  const contentRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const newTab = resolveTab(initialTab)
    if (newTab !== activeTab) {
      setActiveTabState(newTab)
    }
  }, [initialTab]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTabState(tab)
    window.history.replaceState({}, "", `${pathname}?tab=${tab}`)
    setTimeout(() => contentRef.current?.focus({ preventScroll: true }), 0)
  }, [pathname])

  useEffect(() => {
    const onPopState = () => {
      setActiveTabState(resolveTab(new URLSearchParams(window.location.search).get("tab")))
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    timeZone: getBookingTimezone(),
    month: "long",
    year: "numeric",
  })

  /** "Finish setup" is offered here rather than in the rail, and only while there is setup left. */
  const profileComplete = calculateCompletion(user) === 100

  return (
    <>
      {/* The page had no heading of any kind, so the largest type on it belonged
          to a tab. This is the CheckoutHeading recipe, so the account now opens
          the way checkout and the booking confirmation do.

          Identity is stated here and nowhere else. The rail used to repeat the name, the email
          and "Member since" directly beneath this block, so the page opened by telling the
          customer who they are twice. The rail keeps the avatar, because that is where the
          upload control lives. */}
      <header className="account-page-head mb-[clamp(2rem,5vw,3rem)]">
        <div className="min-w-0">
          <p className="account-eyebrow">Account</p>
          <h1 className="mt-[0.4rem] text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.028em] text-[var(--text-primary)] [text-wrap:balance]">
            {user.full_name || "Your account"}
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)] tabular-nums [overflow-wrap:anywhere]">
            {user.email} &middot; member since {memberSince}
          </p>
        </div>

        <div className="account-page-head-actions">
          {profileComplete ? null : (
            <button
              type="button"
              onClick={() => handleTabChange("personal")}
              className="checkout-btn-secondary"
            >
              Finish setup
            </button>
          )}
          <Link href="/" className="checkout-btn-primary">
            Book a transfer
          </Link>
        </div>
      </header>

      <div className="account-layout">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AccountSidebar
          user={user}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unreadNotifications={unreadNotifications}
          tripCount={overview.counts.total}
          vendorApplication={vendorApplication}
        />
      </div>

      {/* Mobile Header */}
      <AccountMobileHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        unreadNotifications={unreadNotifications}
      />

      {/* Content Area */}
      <main ref={contentRef} className="account-content" role="tabpanel" tabIndex={-1}>
        {/* The landing panel. The guarantees the confirmation page makes live inside it, so they
            are stated once instead of repeating under every form on all six tabs. */}
        <div className={activeTab === "overview" ? "account-tab-active" : "account-tab-hidden"}>
          <OverviewTab overview={overview} recentAlerts={recentAlerts} onTabChange={handleTabChange} />
        </div>
        <div className={activeTab === "personal" ? "account-tab-active" : "account-tab-hidden"}>
          <PersonalInfoTab user={user} onTabChange={handleTabChange} />
        </div>
        <div className={activeTab === "security" ? "account-tab-active" : "account-tab-hidden"}>
          <SecurityTab userId={user.id} pendingDeletionRequest={deletionRequest} />
        </div>
        <div className={activeTab === "bookings" ? "account-tab-active" : "account-tab-hidden"}>
          <BookingsTab userId={user.id} spend={overview.spend} />
        </div>
        <div className={activeTab === "reviews" ? "account-tab-active" : "account-tab-hidden"}>
          <ReviewsTab userId={user.id} />
        </div>
        {/* Alerts: the feed and the email switches that govern it, on one panel. They were two
            separate tabs, so turning off an email you had just read meant finding a different
            tab to do it on. `?tab=preferences` still resolves here. */}
        <div className={activeTab === "notifications" ? "account-tab-active" : "account-tab-hidden"}>
          <div className="account-split">
            <div className="min-w-0">
              <NotificationsTab userId={user.id} />
            </div>
            <PreferencesTab userId={user.id} preferences={notificationPrefs} />
          </div>
        </div>

        {/* The rail is `hidden lg:block` and the mobile header carries only the profile row and
            the tab bar, so on a phone this invitation did not exist anywhere on the page. Only
            where the rail is absent, so desktop never shows it twice. */}
        <VendorCTACompact
          vendorApplication={vendorApplication}
          className="lg:hidden mt-[clamp(2.5rem,6vw,4rem)] border-t border-[var(--border-subtle)] pt-[clamp(2rem,4vw,3rem)]"
        />
      </main>
      </div>
    </>
  )
}
