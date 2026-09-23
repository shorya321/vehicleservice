"use client"

import { memo, useMemo } from "react"
import Link from "next/link"
import { formatPrice } from "@/lib/currency/format"
import { useCurrency } from "@/lib/currency/context"
import { getBookingTimezone } from "@/lib/utils/timezone"
import { journeyReference, TripJourneyList, tripSummary, tripTotal } from "./trip-journeys"
import type { BookingListItem } from "./types"

interface TripGroupLedgerRowProps {
  trip: BookingListItem
  journeys: BookingListItem[]
}

/**
 * A travelled round trip or multi-city order as one ledger row, in the same columns as
 * TripLedgerRow: when it began, the order and its journeys, one action, and the fare.
 */
export const TripGroupLedgerRow = memo(function TripGroupLedgerRow({ trip, journeys }: TripGroupLedgerRowProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const first = journeys[0]

  const pickup = useMemo(() => new Date(first.pickup_datetime), [first.pickup_datetime])
  const tz = getBookingTimezone()
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "numeric", month: "short" }).format(pickup)
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(pickup)

  const price = useMemo(
    () => formatPrice(tripTotal(journeys), currentCurrency, exchangeRates),
    [journeys, currentCurrency, exchangeRates]
  )

  const allCancelled = journeys.every((journey) => journey.booking_status === "cancelled")
  const fareOutstanding = trip.payment_status === "pending" || trip.payment_status === "failed"
  const legCount = trip.booking_group?.leg_count ?? journeys.length

  return (
    <li className="account-trip-row">
      <div>
        <p className="numeric text-[1.0625rem] text-[var(--text-primary)]">{day}</p>
        <p className="editorial-list-meta mt-0.5 tabular-nums">{time}</p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="editorial-list-title text-[var(--text-primary)]">{trip.booking_group?.group_number}</span>
          {allCancelled && <span className="account-chip account-chip-alert">Cancelled</span>}
          {fareOutstanding && <span className="account-chip account-chip-alert">Fare outstanding</span>}
        </div>
        <p className="editorial-list-body">{tripSummary(trip, journeys)}</p>
        <div className="mt-2">
          <TripJourneyList journeys={journeys} legCount={legCount} />
        </div>
      </div>

      {/* One action for the order. A trip is reviewed once, on its first journey. */}
      <div className="account-trip-row-action">
        {fareOutstanding ? (
          <Link href={`/account/bookings/${encodeURIComponent(journeyReference(first))}`} className="account-action">
            Settle the fare
          </Link>
        ) : allCancelled ? null : (
          <Link href="/account?tab=reviews" className="account-action">
            Leave a review
          </Link>
        )}
      </div>

      <span
        className={`numeric text-[1.0625rem] ${fareOutstanding ? "text-[var(--gold-text)]" : "text-[var(--text-primary)]"}`}
      >
        {price}
      </span>
    </li>
  )
})
