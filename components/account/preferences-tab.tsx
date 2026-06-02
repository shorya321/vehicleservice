"use client"

import { useState } from "react"
import { Mail, CreditCard, Shield, Megaphone, Loader2 } from "lucide-react"
import { updateNotificationPreferences } from "@/app/account/actions"
import { toast } from "sonner"
import { ContentSection } from "./content-section"

interface PreferencesTabProps {
  userId: string
  preferences: {
    email_booking_updates: boolean
    email_payment_alerts: boolean
    email_security_alerts: boolean
    email_system_updates: boolean
  } | null
}

const PREFERENCE_ITEMS = [
  { key: "email_booking_updates" as const, id: "booking-updates", label: "Booking Confirmations", description: "Receive emails about booking confirmations and updates", icon: Mail },
  { key: "email_payment_alerts" as const, id: "payment-alerts", label: "Payment Receipts", description: "Receive emails about payments and receipts", icon: CreditCard },
  { key: "email_security_alerts" as const, id: "security-alerts", label: "Security Alerts", description: "Receive emails about account security and login activity", icon: Shield },
  { key: "email_system_updates" as const, id: "promotional", label: "Promotional Offers", description: "Receive emails about special offers and promotions", icon: Megaphone },
]

export function PreferencesTab({ userId, preferences }: PreferencesTabProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [prefs, setPrefs] = useState({
    email_booking_updates: preferences?.email_booking_updates ?? true,
    email_payment_alerts: preferences?.email_payment_alerts ?? true,
    email_security_alerts: preferences?.email_security_alerts ?? true,
    email_system_updates: preferences?.email_system_updates ?? false,
  })

  const handleToggle = async (key: keyof typeof prefs, value: boolean) => {
    const previousValue = prefs[key]
    setPrefs((prev) => ({ ...prev, [key]: value }))
    setIsLoading(true)

    const result = await updateNotificationPreferences(userId, { [key]: value })
    setIsLoading(false)

    if (result.error) {
      setPrefs((prev) => ({ ...prev, [key]: previousValue }))
      toast.error(result.error)
    } else {
      toast.success("Preference updated")
    }
  }

  return (
    <ContentSection
      title="Email Notifications"
      eyebrow="Settings"
      description="Choose which email notifications you'd like to receive"
    >
      <div className="divide-y divide-[var(--border-subtle)]">
        {PREFERENCE_ITEMS.map((item) => (
          <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
            <item.icon className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <label htmlFor={item.id} className="block text-sm font-medium text-[var(--text-primary)] cursor-pointer">
                {item.label}
              </label>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.description}</p>
            </div>
            <button
              id={item.id}
              role="switch"
              aria-checked={prefs[item.key]}
              aria-label={`Toggle ${item.label}`}
              disabled={isLoading}
              onClick={() => handleToggle(item.key, !prefs[item.key])}
              className={`
                relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200
                ${prefs[item.key] ? "bg-[var(--gold)]" : "bg-[var(--graphite)] border border-[var(--border-subtle)]"}
                ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[var(--bone)] shadow-md
                  transition-transform duration-200
                  ${prefs[item.key] ? "translate-x-5" : "translate-x-0"}
                `}
              />
            </button>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
        <p className="text-xs text-[var(--text-muted)]">
          We&apos;ll always send you important account-related emails regardless of these settings.
        </p>
      </div>
    </ContentSection>
  )
}
