"use client"

import { Check } from "lucide-react"
import Link from "next/link"
import type { AccountUser } from "./types"

interface ProfileChecklistProps {
  user: Pick<AccountUser, "full_name" | "phone" | "address_street" | "address_city" | "address_country">
  onTabChange?: (tab: "security") => void
}

/**
 * What "Finish setup" actually wants.
 *
 * The header offers to finish setting the account up and never said what was missing, so the
 * customer had to compare a form against nothing. Each row states what it is for, because none
 * of it is required to book a transfer and saying so is more honest than a progress bar implying
 * the account is broken at 50%.
 */
export function ProfileChecklist({ user, onTabChange }: ProfileChecklistProps) {
  const items = [
    {
      label: "Name and phone",
      done: Boolean(user.full_name && user.phone),
      why: "The chauffeur calls this number when a pickup point is busy.",
    },
    {
      label: "Billing address",
      done: Boolean(user.address_street && user.address_city && user.address_country),
      why: "Makes a refund or a corporate receipt faster to issue.",
    },
  ]

  const remaining = items.filter((item) => !item.done).length

  return (
    <aside className="account-item-card account-aside-card" aria-labelledby="profile-checklist-heading">
      <p className="account-label">Profile</p>
      <p id="profile-checklist-heading" className="mt-1.5 text-[1.0625rem] font-medium text-[var(--text-primary)]">
        {remaining === 0 ? "Nothing left to add" : remaining === 1 ? "One thing left" : `${remaining} things left`}
      </p>

      <ul className="mt-5 space-y-4">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-3">
            {item.done ? (
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--success)]" aria-hidden="true" />
            ) : (
              /* Gold-tinted, not --graphite: in dark mode graphite is #2a2826 and the ring
                 disappeared into the card it sits on. */
              <span
                className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border border-[rgba(var(--gold-rgb),0.4)]"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0">
              <p
                className={`text-[0.875rem] font-medium ${item.done ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}
              >
                {item.label}
                <span className="sr-only">{item.done ? " — done" : " — still to add"}</span>
              </p>
              {!item.done && (
                <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">{item.why}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <hr className="my-5 h-px border-0 bg-[var(--border-subtle)]" />

      <p className="text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
        None of it is required to book. All of it makes a lost-and-found or a refund faster.
      </p>

      {/* The password is the only key this account has, so it is the only one offered here.
          Nothing is said about two-factor sign-in, because there is none to set up. */}
      {onTabChange ? (
        <button type="button" onClick={() => onTabChange("security")} className="account-action mt-3">
          Change your password &rarr;
        </button>
      ) : (
        <Link href="/account?tab=security" className="account-action mt-3">
          Change your password &rarr;
        </Link>
      )}
    </aside>
  )
}
