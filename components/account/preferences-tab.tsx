"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { updateNotificationPreferences } from "@/app/account/actions"
import { toast } from "sonner"

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
  { key: "email_booking_updates" as const, id: "booking-updates", label: "Booking Confirmations", description: "Receive emails about booking confirmations and updates" },
  { key: "email_payment_alerts" as const, id: "payment-alerts", label: "Payment Receipts", description: "Receive emails about payments and receipts" },
  { key: "email_security_alerts" as const, id: "security-alerts", label: "Security Alerts", description: "Receive emails about account security and login activity" },
  { key: "email_system_updates" as const, id: "promotional", label: "Promotional Offers", description: "Receive emails about special offers and promotions" },
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

  /**
   * The switches sit beside the feed they govern rather than on a tab of their own, so this is a
   * column heading rather than a page heading: turning off an email you have just read should not
   * mean going to look for somewhere else to do it.
   */
  return (
    <aside className="min-w-0" aria-labelledby="email-prefs-heading">
      <p id="email-prefs-heading" className="account-eyebrow editorial-eyebrow--pill">
        <i aria-hidden="true" />
        Which of these reach you by email
      </p>
      <div className="mt-5 divide-y divide-[var(--border-subtle)]">
        {PREFERENCE_ITEMS.map((item) => (
          <div key={item.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex-1 min-w-0">
              <label htmlFor={item.id} className="block text-sm font-medium text-[var(--text-primary)] cursor-pointer">
                {item.label}
              </label>
              <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-0.5">{item.description}</p>
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
        <p className="text-xs leading-relaxed text-[var(--text-muted)]">
          Whatever these say, a transfer that changes on the day still reaches you. That one is not
          optional.
        </p>
      </div>
    </aside>
  )
}
