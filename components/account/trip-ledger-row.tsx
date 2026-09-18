"use client"

import { memo, useMemo } from "react"
import Link from "next/link"
import { formatPrice } from "@/lib/currency/format"
import { useCurrency } from "@/lib/currency/context"
import { getBookingTimezone } from "@/lib/utils/timezone"
import type { BookingListItem } from "./types"

const tz = () => getBookingTimezone()

/**
 * One travelled transfer, as a ledger row.
 *
 * A trip already taken cannot be changed, so it does not need the card the upcoming one gets:
 * four identical grey plates said nothing about which of them mattered. The date holds the left
 * column, the route reads across, and the fare lines up on the right where a column of figures
 * can actually be compared.
 */
interface TripLedgerRowProps {
  booking: BookingListItem
  onReview?: () => void
}

export const TripLedgerRow = memo(function TripLedgerRow({ booking, onReview }: TripLedgerRowProps) {
  const { currentCurrency, exchangeRates } = useCurrency()

  const pickup = useMemo(() => new Date(booking.pickup_datetime), [booking.pickup_datetime])

  const day = new Intl.DateTimeFormat("en-GB", { timeZone: tz(), day: "numeric", month: "short" }).format(pickup)
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz(),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(pickup)

  const price = useMemo(
    () => formatPrice(booking.total_price, currentCurrency, exchangeRates),
    [booking.total_price, currentCurrency, exchangeRates]
  )

  const reference = booking.trip_number || booking.booking_number
  const vendorName = booking.booking_assignments?.[0]?.vendor?.business_name
  const isCancelled = booking.booking_status === "cancelled"
  const fareOutstanding = booking.payment_status === "pending" || booking.payment_status === "failed"

  const detail = [reference, booking.vehicle_type?.name, vendorName].filter(Boolean).join(" · ")

  return (
    <li className="account-trip-row">
      <div>
        <p className="numeric text-[1.0625rem] text-[var(--text-primary)]">{day}</p>
        <p className="editorial-list-meta mt-0.5 tabular-nums">{time}</p>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/account/bookings/${encodeURIComponent(reference)}`}
            className="editorial-list-title text-[var(--text-primary)] hover:text-[var(--gold-text)]"
          >
            {booking.pickup_address} <span aria-hidden="true">&rarr;</span>{" "}
            <span className="sr-only">to</span>
            {booking.dropoff_address}
          </Link>
          {/* A travelled trip in good standing carries no chip: the row is quiet unless
              something about it still wants the customer. */}
          {isCancelled && <span className="account-chip account-chip-alert">Cancelled</span>}
          {fareOutstanding && <span className="account-chip account-chip-alert">Fare outstanding</span>}
          {!isCancelled && !fareOutstanding && booking.booking_status === "pending" && (
            <span className="account-chip">Not yet confirmed</span>
          )}
        </div>
        <p className="editorial-list-body tabular-nums">{detail}</p>
      </div>

      {/* One action per row, and only where there is one worth offering. */}
      <div className="account-trip-row-action">
        {fareOutstanding ? (
          <Link
            href={`/account/bookings/${encodeURIComponent(reference)}`}
            className="account-action"
          >
            Settle the fare
          </Link>
        ) : isCancelled ? null : onReview ? (
          <button type="button" onClick={onReview} className="account-action">
            Leave a review
          </button>
        ) : (
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
