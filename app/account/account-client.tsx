"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { AccountMobileHeader } from "@/components/account/account-mobile-header"
import { PersonalInfoTab } from "@/components/account/personal-info-tab"
import { SecurityTab } from "@/components/account/security-tab"
import { PreferencesTab } from "@/components/account/preferences-tab"
import { BookingsTab } from "@/components/account/bookings-tab"
import { ReviewsTab } from "@/components/account/reviews-tab"
import { NotificationsTab } from "@/components/account/notifications-tab"
import { VALID_TABS, type TabId } from "@/components/account/account-nav"

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
}

export function AccountClient({
  initialTab,
  user,
  notificationPrefs,
  deletionRequest,
  vendorApplication,
  unreadNotifications,
}: AccountClientProps) {
  const validatedTab: TabId = VALID_TABS.includes(initialTab as TabId) ? (initialTab as TabId) : "personal"
  const [activeTab, setActiveTabState] = useState(validatedTab)
  const pathname = usePathname()
  const contentRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const newTab: TabId = VALID_TABS.includes(initialTab as TabId)
      ? (initialTab as TabId)
      : "personal"
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
      const param = new URLSearchParams(window.location.search).get("tab")
      if (param && VALID_TABS.includes(param as TabId)) {
        setActiveTabState(param as TabId)
      }
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  return (
    <div className="account-layout">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AccountSidebar
          user={user}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unreadNotifications={unreadNotifications}
          vendorApplication={vendorApplication}
        />
      </div>

      {/* Mobile Header */}
      <AccountMobileHeader
        user={user}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        unreadNotifications={unreadNotifications}
      />

      {/* Content Area */}
      <main ref={contentRef} className="account-content" role="tabpanel" tabIndex={-1}>
        <div className={activeTab === "personal" ? "account-tab-active" : "account-tab-hidden"}>
          <PersonalInfoTab user={user} />
        </div>
        <div className={activeTab === "security" ? "account-tab-active" : "account-tab-hidden"}>
          <SecurityTab userId={user.id} pendingDeletionRequest={deletionRequest} />
        </div>
        <div className={activeTab === "preferences" ? "account-tab-active" : "account-tab-hidden"}>
          <PreferencesTab userId={user.id} preferences={notificationPrefs} />
        </div>
        <div className={activeTab === "bookings" ? "account-tab-active" : "account-tab-hidden"}>
          <BookingsTab userId={user.id} />
        </div>
        <div className={activeTab === "reviews" ? "account-tab-active" : "account-tab-hidden"}>
          <ReviewsTab userId={user.id} />
        </div>
        <div className={activeTab === "notifications" ? "account-tab-active" : "account-tab-hidden"}>
          <NotificationsTab userId={user.id} />
        </div>
      </main>
    </div>
  )
}
