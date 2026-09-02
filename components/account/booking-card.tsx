"use client"

import { memo, useMemo } from "react"
import Link from "next/link"
import { formatPrice } from "@/lib/currency/format"
import { useCurrency } from '@/lib/currency/context'
import { getBookingTimezone, bookingToday } from '@/lib/utils/timezone'
import type { BookingListItem } from "./types"

interface BookingCardProps {
  booking: BookingListItem
  onClick: () => void
}

/**
 * One chip, not two. The card previously carried a booking status badge and a
 * payment status badge side by side, both as semantic fills, so a single row
 * put blue, green and amber next to gold. Booking status is the chip; payment
 * only speaks when it wants something, which is what makes the colour mean
 * anything when it does appear.
 */
const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  completed: "Travelled",
  cancelled: "Cancelled",
  pending: "Pending",
  assigned: "Confirmed",
}

/**
 * Only states that want something from the customer, or that they would be
 * surprised not to see. "processing" is transient and the booking status
 * already covers it, so surfacing it just puts a second chip back on the row.
 */
const PAYMENT_LABEL: Record<string, string> = {
  pending: "Payment pending",
  failed: "Payment failed",
  refunded: "Refunded",
}

/** Sentence case for anything the maps above do not name, never raw DB casing. */
function titleCase(value: string): string {
  if (!value) return ""
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

export const BookingCard = memo(function BookingCard({ booking, onClick }: BookingCardProps) {
  const { currentCurrency, exchangeRates } = useCurrency()

  /** Date and time were split across two grid columns. They are one fact. */
  const formattedWhen = useMemo(() => {
    const d = new Date(booking.pickup_datetime)
    const date = d.toLocaleDateString("en-US", {
      timeZone: getBookingTimezone(),
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    const time = d.toLocaleTimeString("en-US", {
      timeZone: getBookingTimezone(),
      hour: "2-digit",
      minute: "2-digit",
    })
    return `${date} at ${time}`
  }, [booking.pickup_datetime])

  const formattedPrice = useMemo(
    () => formatPrice(booking.total_price, currentCurrency, exchangeRates),
    [booking.total_price, currentCurrency, exchangeRates]
  )

  const assignment = booking.booking_assignments?.[0]
  const vendorName = assignment?.vendor?.business_name

  const statusLabel = STATUS_LABEL[booking.booking_status] ?? titleCase(booking.booking_status)
  const isCancelled = booking.booking_status === "cancelled"

  /** Hidden on the happy path. Anything abnormal still surfaces. */
  const paymentLabel = booking.payment_status
    ? PAYMENT_LABEL[booking.payment_status] ?? null
    : null
  const paymentNeedsAction =
    booking.payment_status === "failed" || booking.payment_status === "pending"

  /**
   * Rebooking a route already travelled is the highest intent action a
   * returning customer has. /search/results needs location ids rather than
   * addresses, so the link only renders when the booking carries both.
   */
  const rebookHref = useMemo(() => {
    if (!booking.from_location_id || !booking.to_location_id) return null
    const params = new URLSearchParams({
      from: booking.from_location_id,
      to: booking.to_location_id,
      date: bookingToday(),
      passengers: String(booking.passenger_count && booking.passenger_count > 0 ? booking.passenger_count : 1),
    })
    return `/search/results?${params.toString()}`
  }, [booking.from_location_id, booking.to_location_id, booking.passenger_count])

  const reference = booking.trip_number || booking.booking_number

  return (
    <div className="account-item-card account-item-card-interactive">
      <button
        onClick={onClick}
        className="w-full text-left"
        aria-label={`View booking ${reference}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          {/* Reference, status, route, and when. One reading order at every width. */}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="account-ref">{reference}</span>
              <span className={`account-chip ${isCancelled ? "account-chip-alert" : ""}`}>
                {statusLabel}
              </span>
              {paymentLabel && (
                <span className={`account-chip ${paymentNeedsAction ? "account-chip-alert" : ""}`}>
                  {paymentLabel}
                </span>
              )}
            </div>

            <div className="account-route">
              <div className="account-route-stop">
                <p className="account-route-value">{booking.pickup_address}</p>
              </div>
              <div className="account-route-stop">
                <p className="account-route-value">{booking.dropoff_address}</p>
              </div>
            </div>

            <p className="text-[0.75rem] leading-snug text-[var(--text-muted)] tabular-nums">
              {formattedWhen}
              {booking.vehicle_type?.name ? ` · ${booking.vehicle_type.name}` : ""}
            </p>
          </div>

          {/* The figure the customer opened the page to check. */}
          <div className="flex flex-shrink-0 flex-col items-start gap-1 sm:items-end sm:text-right">
            <span className="t-price">{formattedPrice}</span>
            {vendorName && <span className="text-xs text-[var(--text-muted)]">{vendorName}</span>}
          </div>
        </div>
      </button>

      {rebookHref && (
        <div className="mt-4 border-t border-[var(--border-subtle)] pt-3">
          <Link href={rebookHref} className="account-action">
            Book this route again
          </Link>
        </div>
      )}
    </div>
  )
})
