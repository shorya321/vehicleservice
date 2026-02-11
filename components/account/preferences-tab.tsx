"use client"

import { useState } from "react"
import { Bell, Mail, CreditCard, Shield, Megaphone, Loader2 } from "lucide-react"
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

interface PreferenceToggleProps {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function PreferenceToggle({ id, label, description, icon, checked, onChange, disabled }: PreferenceToggleProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-[var(--charcoal)]/50 border border-[var(--gold)]/10 hover:border-[var(--gold)]/20 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="block text-sm font-medium text-[var(--text-primary)] cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200
          ${checked ? "bg-[var(--gold)]" : "bg-[var(--graphite)]"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md
            transition-transform duration-200
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  )
}

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
    <div className="account-section">
      <div className="account-section-header">
        <div className="account-section-icon">
          <Bell className="w-5 h-5 text-[var(--gold)]" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-[var(--text-primary)]">Email Notifications</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Choose which email notifications you&apos;d like to receive
          </p>
        </div>
      </div>

      <div className="account-section-content">
        <div className="space-y-3">
        <PreferenceToggle
          id="booking-updates"
          label="Booking Confirmations"
          description="Receive emails about booking confirmations and updates"
          icon={<Mail className="w-5 h-5" />}
          checked={prefs.email_booking_updates}
          onChange={(checked) => handleToggle("email_booking_updates", checked)}
          disabled={isLoading}
        />

        <PreferenceToggle
          id="payment-alerts"
          label="Payment Receipts"
          description="Receive emails about payments and receipts"
          icon={<CreditCard className="w-5 h-5" />}
          checked={prefs.email_payment_alerts}
          onChange={(checked) => handleToggle("email_payment_alerts", checked)}
          disabled={isLoading}
        />

        <PreferenceToggle
          id="security-alerts"
          label="Security Alerts"
          description="Receive emails about account security and login activity"
          icon={<Shield className="w-5 h-5" />}
          checked={prefs.email_security_alerts}
          onChange={(checked) => handleToggle("email_security_alerts", checked)}
          disabled={isLoading}
        />

        <PreferenceToggle
          id="promotional"
          label="Promotional Offers"
          description="Receive emails about special offers and promotions"
          icon={<Megaphone className="w-5 h-5" />}
          checked={prefs.email_system_updates}
          onChange={(checked) => handleToggle("email_system_updates", checked)}
          disabled={isLoading}
        />
        </div>

        {isLoading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-[var(--gold)]/10">
          <p className="text-xs text-[var(--text-muted)]">
            Note: We&apos;ll always send you important account-related emails regardless of these settings.
          </p>
        </div>
      </div>
    </div>
  )
}
