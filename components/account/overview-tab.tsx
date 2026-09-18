"use client"

import Link from "next/link"
import { Car } from "lucide-react"
import { formatBookingDate } from "@/lib/utils/timezone"
import type { AccountOverview } from "@/app/account/overview-actions"
import { DispatchBand } from "./dispatch-band"
import { AccountTrustRail } from "./trust-rail"
import { EmptyState } from "./empty-state"
import type { NotificationListItem } from "./types"
import type { TabId } from "./account-nav"

interface OverviewTabProps {
  /**
   * Read on the server in app/account/page.tsx and handed down.
   *
   * The other tabs fetch from an effect on mount, which is right for a panel nobody may open.
   * This one is the landing panel, so the next transfer would have arrived as a skeleton on
   * every single visit. It is also the only content here that is worth server-rendering.
   */
  overview: AccountOverview
  recentAlerts: NotificationListItem[]
  /** Switches panel in place, the way the rail does. Omitted where the shell has to navigate. */
  onTabChange?: (tab: TabId) => void
}

/**
 * The landing panel.
 *
 * The account opened on the personal-details form, which put "Full Name" in the largest type on
 * the page and left the one question a transfer customer actually arrives with — when does the
 * car come, and who is driving — three tabs away. This answers that first and carries the
 * standing figures and the latest movement on the account underneath it.
 *
 * Every figure here is derived from rows the account already owns; nothing new is written.
 */
export function OverviewTab({ overview, recentAlerts, onTabChange }: OverviewTabProps) {
  const counts = overview.counts
  const nextTransfer = overview.nextTransfer
  const alerts = recentAlerts

  return (
    <section className="account-section" aria-labelledby="account-overview-heading">
      <h2 id="account-overview-heading" className="sr-only">
        Overview
      </h2>

      {nextTransfer ? (
        <DispatchBand transfer={nextTransfer} asOf={overview.asOf} />
      ) : (
        <EmptyState
          icon={Car}
          title={
            counts.travelled > 0
              ? "Nothing on the road at the moment"
              : "Your next transfer will show up here"
          }
          description={
            counts.travelled > 0
              ? "When you book again, the day, the vehicle and your chauffeur appear on this page."
              : "Book a transfer and this page will carry the day, the vehicle and your chauffeur."
          }
          action={
            <Link href="/" className="btn btn-primary">
              Book a Transfer
            </Link>
          }
        />
      )}

      <div className="account-overview-split">
        <div className="min-w-0">
          <div className="flex items-baseline justify-between gap-4">
            <p className="account-eyebrow">Latest on your transfers</p>
            {onTabChange ? (
              <button type="button" onClick={() => onTabChange("notifications")} className="account-action">
                All alerts
              </button>
            ) : (
              <Link href="/account?tab=notifications" className="account-action">
                All alerts
              </Link>
            )}
          </div>

          {alerts.length === 0 ? (
            <p className="mt-4 text-[0.875rem] leading-relaxed text-[var(--text-muted)]">
              Nothing yet. A driver being assigned, a vehicle being held or a payment clearing all
              land here, and by email.
            </p>
          ) : (
            /* The site's editorial list: an index column, the row, and the date. Unread rows
               are marked in the index in words rather than by a coloured dot, which is how the
               rest of the site marks state. */
            <ul className="editorial-list mt-4">
              {alerts.map((alert) => (
                <li key={alert.id} className="account-alert-row">
                  <span className={`editorial-list-index ${alert.is_read ? "account-alert-index-read" : ""}`}>
                    {alert.is_read ? "—" : "New"}
                  </span>
                  <div className="min-w-0">
                    <p className="editorial-list-title">{alert.title}</p>
                    <p className="editorial-list-body tabular-nums [overflow-wrap:anywhere]">
                      {alert.message}
                    </p>
                  </div>
                  <span className="editorial-list-meta flex-shrink-0 tabular-nums">
                    {formatBookingDate(alert.created_at, "d MMM")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* The guarantees used to repeat on all six tabs. They belong once, here, beside the
            movement on the account rather than under every form on the site. */}
        <AccountTrustRail className="min-w-0" />
      </div>
    </section>
  )
}
