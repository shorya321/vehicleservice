"use client"

import { useState } from "react"
import { User, Shield, Settings, Car, Star, Bell } from "lucide-react"
import { ProfileCard } from "@/components/account/profile-card"
import { VendorCTA } from "@/components/account/vendor-cta"
import { PersonalInfoTab } from "@/components/account/personal-info-tab"
import { SecurityTab } from "@/components/account/security-tab"
import { PreferencesTab } from "@/components/account/preferences-tab"
import { BookingsTab } from "@/components/account/bookings-tab"
import { ReviewsTab } from "@/components/account/reviews-tab"
import { NotificationsTab } from "@/components/account/notifications-tab"

const VALID_TABS = ["personal", "security", "preferences", "bookings", "reviews", "notifications"] as const
type TabId = (typeof VALID_TABS)[number]

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
  stats: {
    total: number
    upcoming: number
    completed: number
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
}

const TABS = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "preferences", label: "Preferences", icon: Settings },
  { id: "bookings", label: "Bookings", icon: Car },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "notifications", label: "Notifications", icon: Bell },
]

export function AccountClient({ initialTab, user, stats, notificationPrefs, deletionRequest, vendorApplication }: AccountClientProps) {
  const validatedTab: TabId = VALID_TABS.includes(initialTab as TabId) ? (initialTab as TabId) : "personal"
  const [activeTab, setActiveTab] = useState(validatedTab)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] mb-2">
          My Account
        </h1>
        <p className="text-[var(--text-muted)]">
          Manage your profile, bookings, and preferences
        </p>
      </div>

      {/* Profile Overview Card */}
      <ProfileCard user={user} stats={stats} />

      {/* Vendor Application CTA */}
      <VendorCTA vendorApplication={vendorApplication} />

      {/* Tabs Navigation */}
      <div className="account-tabs-card overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`account-tab ${activeTab === tab.id ? "active" : ""}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "personal" && <PersonalInfoTab user={user} />}
        {activeTab === "security" && (
          <SecurityTab userId={user.id} pendingDeletionRequest={deletionRequest} />
        )}
        {activeTab === "preferences" && (
          <PreferencesTab userId={user.id} preferences={notificationPrefs} />
        )}
        {activeTab === "bookings" && (
          <BookingsTab
            userId={user.id}
          />
        )}
        {activeTab === "reviews" && <ReviewsTab userId={user.id} />}
        {activeTab === "notifications" && <NotificationsTab userId={user.id} />}
      </div>
    </div>
  )
}
