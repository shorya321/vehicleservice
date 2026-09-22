"use client"

import { useEffect, useState } from "react"
import { RouteConnector } from "@/app/search/results/components/route-connector"
import { formatBookingDate } from "@/lib/utils/timezone"
import {
  APPLICATION_STATUS_LABEL,
  decisionDueAt,
  REVIEW_WINDOW_HOURS,
  type ApplicationStatus,
} from "@/lib/vendor-application/status"
import { STUB_PLATE } from "./stub-plate"

/** Weekday first, the way the checkout stub and the status page's review stub date a trip. */
const ROUTE_DATE = "EEE d MMM"

/**
 * The edit page's left rail.
 *
 * The form column was `max-w-3xl` inside a 1400px container, so it lined up with neither
 * the header nor the footer and left roughly half the viewport empty. This is the status
 * page's own `2fr 3fr` grid, and this is what goes in the 2fr: the context the applicant
 * loses the moment they click Edit.
 *
 * It opens on the status page's review stub, so clicking Edit details keeps the applicant
 * on the same object: the cap with the status chip, then submitted to decision on the
 * route connector. The index and the change register below it stay flat, as the rail
 * beside the form on `/become-vendor` is.
 */

/** Mirrors the ids SectionShell puts on the three fieldsets in the edit form. */
const SECTIONS = [
  { id: "vendor-section-business", ordinal: "01", label: "Business information" },
  { id: "vendor-section-documents", ordinal: "02", label: "Required documents" },
  { id: "vendor-section-banking", ordinal: "03", label: "Banking details", meta: "Optional" },
] as const

interface EditRailProps {
  status: ApplicationStatus
  createdAt: string
  updatedAt: string
  /** When the decision being answered was made. Only read on the resubmit path. */
  reviewedAt?: string | null
  /** Field labels the applicant has changed since the page loaded, in form order. */
  changes: string[]
  /** The decision being answered, on the resubmit path. Null on an ordinary edit. */
  rejectionReason?: string | null
  className?: string
}

export function EditRail({
  status,
  createdAt,
  updatedAt,
  reviewedAt = null,
  changes,
  rejectionReason,
  className,
}: EditRailProps) {
  const [currentId, setCurrentId] = useState<string>(SECTIONS[0].id)
  const edited = updatedAt > createdAt
  const decided = status !== "pending"

  useEffect(() => {
    const nodes = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (node): node is HTMLElement => node !== null
    )
    if (nodes.length === 0) return

    // Same band and reduction as the create form's index: tracks the topmost section still
    // intersecting the upper viewport, so the marker moves once per boundary rather than
    // flickering between two neighbours.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length === 0) return
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b
        )
        setCurrentId(topmost.target.id)
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: 0 }
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return (
    <aside className={className}>
      {/* The status page's review stub. The dates are the ones the row already stores;
          nothing is computed that the status page does not show too. */}
      <section className={STUB_PLATE} aria-labelledby="edit-review-heading">
        <div className="checkout-stub-cap">
          <h2 id="edit-review-heading" className="checkout-stub-ref">
            Review
          </h2>
          <span className={`account-chip self-center ${status === "rejected" ? "account-chip-alert" : ""}`}>
            {APPLICATION_STATUS_LABEL[status]}
          </span>
        </div>

        <div className="px-6 pb-6 pt-4">
          <p className="checkout-stub-route">
            <span className="checkout-stub-route__place">
              <span className="checkout-stub-route__name">Submitted</span>
              <span className="checkout-stub-route__note">{formatBookingDate(createdAt, ROUTE_DATE)}</span>
            </span>
            <RouteConnector />
            <span className="checkout-stub-route__place">
              <span className="checkout-stub-route__name">
                {decided ? APPLICATION_STATUS_LABEL[status] : "Decision"}
              </span>
              <span className="checkout-stub-route__note">
                {decided
                  ? formatBookingDate(reviewedAt ?? updatedAt, ROUTE_DATE)
                  : `By ${formatBookingDate(decisionDueAt(createdAt).toISOString(), ROUTE_DATE)}`}
              </span>
            </span>
          </p>
          <p className="checkout-stub-facts">
            {decided ? (
              <span>Resubmitting keeps the same reference</span>
            ) : (
              <>
                <span>
                  <strong>{REVIEW_WINDOW_HOURS} hours</strong> review window
                </span>
                <span>Saving does not restart it</span>
              </>
            )}
            {edited && (
              <span>
                Last saved <strong>{formatBookingDate(updatedAt)}</strong>
              </span>
            )}
          </p>
        </div>
      </section>

      {/* The applicant is being asked to fix something. They should be able to read what,
          while they type, rather than holding it from the page they came off. */}
      {rejectionReason && (
        <section className="mt-6 border-y border-[var(--graphite)] py-4" aria-labelledby="decision-heading">
          <h2 id="decision-heading" className="checkout-field-label">
            Why it was not approved
          </h2>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
            {rejectionReason}
          </p>
        </section>
      )}

      {/* Decorative to assistive technology: the fieldsets and their legends are the real
          structure, and repeating them here would only add a second, weaker copy.

          Desktop only. Below lg the rail is not sticky, so a running marker for a form
          that starts underneath it can never be seen while the form is being filled in,
          and it pushes the first field most of a screen further down. */}
      <nav aria-hidden="true" className="mt-8 max-lg:hidden">
        <ol className="m-0 list-none p-0">
          {SECTIONS.map((section) => {
            const isCurrent = section.id === currentId
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  tabIndex={-1}
                  className={`
                    grid grid-cols-[2.25rem_1fr_auto] items-baseline gap-x-3.5 py-3
                    border-t border-[var(--graphite)]
                    transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                    motion-reduce:transition-none
                    ${isCurrent ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}
                  `}
                >
                  <span
                    className={`text-xs tracking-[0.14em] tabular-nums ${
                      isCurrent ? "text-[var(--gold-text)]" : ""
                    }`}
                  >
                    {section.ordinal}
                  </span>
                  <span className={`text-sm ${isCurrent ? "font-medium" : ""}`}>
                    {section.label}
                  </span>
                  <span className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] opacity-75">
                    {"meta" in section ? section.meta : ""}
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
      </nav>

      {/* The register of what is being amended.
          This screen's whole job is filing a change against a document already in review,
          so the rail keeps the list. Read from react-hook-form's dirtyFields: no schema,
          no server action, no stored column. It is also the honest version of a
          leave-warning, which tells you nothing until it is too late to act on it. */}
      <section className="mt-8 max-lg:hidden" aria-labelledby="amendment-ledger-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="amendment-ledger-heading" className="checkout-field-label">
            Unsaved changes
          </h2>
          <span className="numeric text-xs text-[var(--gold-text)]">{changes.length}</span>
        </div>

        {changes.length === 0 ? (
          <p className="mt-3 border-y border-[var(--graphite)] py-3 text-[0.8125rem] text-[var(--text-muted)]">
            No changes yet.
          </p>
        ) : (
          <ul className="mt-3 m-0 list-none p-0">
            {changes.map((label) => (
              <li
                key={label}
                className="flex items-baseline justify-between gap-4 border-t border-[var(--graphite)] py-2.5 text-[0.8125rem] text-[var(--text-secondary)] last:border-b"
              >
                <span>{label}</span>
                <span className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--gold-text)]">
                  Edited
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  )
}
