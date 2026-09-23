"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getBookingTimezone } from "@/lib/utils/timezone"
import { destinationLabel, legLabel, tripTypeLabel } from "@/lib/trips/display"
import type { BookingListItem } from "./types"

/** The reference a journey's own page is addressed by. */
export function journeyReference(journey: BookingListItem): string {
  return journey.trip_number || journey.booking_number
}

/** "Round trip · 2 journeys", or "2 of 3 journeys" when a filter left some out. */
export function tripSummary(trip: BookingListItem, journeys: BookingListItem[]): string {
  const count = trip.booking_group?.leg_count ?? journeys.length
  const shown = journeys.length === count ? `${count} journeys` : `${journeys.length} of ${count} journeys`
  return `${tripTypeLabel(trip)} · ${shown}`
}

/** The fare of the whole order: each journey carries its share. */
export function tripTotal(journeys: BookingListItem[]): number {
  return journeys.reduce((sum, journey) => sum + (Number(journey.total_price) || 0), 0)
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  const tz = getBookingTimezone()
  const date = d.toLocaleDateString("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" })
  const time = d.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit" })
  return `${date} at ${time}`
}

interface TripJourneyListProps {
  journeys: BookingListItem[]
  legCount: number
}

/**
 * The journeys of one order, each a link to its own page, where it can be cancelled on its own.
 * They sit inside the order's card or ledger row so they read as parts of one booking rather than
 * as separate bookings in the list.
 */
export function TripJourneyList({ journeys, legCount }: TripJourneyListProps) {
  return (
    <ol className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
      {journeys.map((journey) => {
        const reference = journeyReference(journey)
        const isCancelled = journey.booking_status === "cancelled"
        return (
          <li key={journey.id}>
            <Link
              href={`/account/bookings/${encodeURIComponent(reference)}`}
              className="group/journey flex items-center gap-4 py-3 focus-visible:outline-2 focus-visible:outline-[var(--gold)] focus-visible:outline-offset-2"
              aria-label={`View ${legLabel(journey, legCount) ?? "journey"} ${reference}`}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-[var(--gold-text)]">
                    {legLabel(journey, legCount)}
                  </span>
                  {isCancelled && <span className="account-chip account-chip-alert">Cancelled</span>}
                </div>
                <p className="truncate text-sm text-[var(--text-primary)]">
                  {journey.pickup_address} <span aria-hidden="true">&rarr;</span>
                  <span className="sr-only"> to </span> {destinationLabel(journey)}
                </p>
                <p className="text-[0.75rem] text-[var(--text-muted)] tabular-nums">
                  {formatWhen(journey.pickup_datetime)} · {reference}
                </p>
              </div>
              <ArrowRight
                aria-hidden="true"
                className="h-3.5 w-3.5 flex-shrink-0 text-[var(--text-muted)] transition-transform duration-200 group-hover/journey:translate-x-0.5 group-hover/journey:text-[var(--gold-text)]"
              />
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
