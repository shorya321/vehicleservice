"use client"

import { useMemo, type ReactNode } from "react"
import Link from "next/link"
import { Clock } from "lucide-react"
import { formatPrice } from "@/lib/currency/format"
import { useCurrency } from "@/lib/currency/context"
import { getBookingTimezone, bookingDayKey } from "@/lib/utils/timezone"
import type { NextTransfer } from "@/app/account/overview-actions"

/**
 * The next transfer, given the whole top of the page.
 *
 * The headline is the confirmation page's treatment rather than a new one: a customer who booked
 * yesterday has already read "Saturday, 26 September / at 10:00" in that type, and meeting it
 * again here is what makes the two surfaces one product. See
 * app/booking/confirmation/components/confirmation-content.tsx for the original.
 */

const tz = () => getBookingTimezone()

/** "Saturday, 26 September", with the year only when the pickup is not in the current year. */
function formatHeadlineDate(d: Date): string {
  const part = (opts: Intl.DateTimeFormatOptions, date: Date = d) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: tz(), ...opts }).format(date)
  const sameYear = part({ year: "numeric" }) === part({ year: "numeric" }, new Date())
  const date = `${part({ day: "numeric" })} ${part({ month: "long" })}${sameYear ? "" : ` ${part({ year: "numeric" })}`}`
  return `${part({ weekday: "long" })}, ${date}`
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz(),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)
}

/**
 * Whole days between today and the pickup, both read in the operating timezone.
 *
 * Differencing the two day keys as UTC midnights is what keeps this a whole number: subtracting
 * the instants would answer "in 0 days" for a pickup eleven hours away tomorrow morning, and
 * parsing the keys in the browser's zone would shift one of them across a date line.
 */
function daysUntil(pickupIso: string, asOf: string): number {
  const startOfPickupDay = Date.parse(`${bookingDayKey(pickupIso)}T00:00:00Z`)
  const startOfToday = Date.parse(`${bookingDayKey(asOf)}T00:00:00Z`)
  return Math.round((startOfPickupDay - startOfToday) / 86_400_000)
}

function countdownLabel(days: number): string {
  if (days <= 0) return "Next transfer · today"
  if (days === 1) return "Next transfer · tomorrow"
  return `Next transfer · in ${days} days`
}

/**
 * The free-cancellation deadline, stated as a date rather than as a rule.
 *
 * cancelBooking in app/account/booking-actions.ts refuses inside 24 hours of pickup, so this is
 * that same boundary written out. Twenty-four hours before the instant, not the wall clock, which
 * is what keeps it right across a DST edge.
 */
const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000

interface DispatchBandProps {
  transfer: NextTransfer
  /**
   * The instant the data was read, from the server. Rendering against this rather than against
   * `Date.now()` is what keeps the markup deterministic: a clock read in a render body gives the
   * server and the browser two different answers and the hydrated output disagrees with the sent
   * HTML. It also means this band and the counts beside it are measured against one instant.
   */
  asOf: string
  /**
   * The street map behind the band, handed in as a slot.
   *
   * RouteBandMap builds ~20KB of path data in a pair of nested loops at module load, and this is
   * a client component: imported here, that build would run in the browser on every visit and
   * the paths would join the route's JS bundle. The confirmation page passes it the same way.
   */
  routeMap?: ReactNode
}

export function DispatchBand({ transfer, asOf, routeMap }: DispatchBandProps) {
  const { currentCurrency, exchangeRates } = useCurrency()

  const pickup = useMemo(() => new Date(transfer.pickup_datetime), [transfer.pickup_datetime])
  const days = useMemo(
    () => daysUntil(transfer.pickup_datetime, asOf),
    [transfer.pickup_datetime, asOf]
  )

  const freeUntil = useMemo(() => {
    const deadline = new Date(pickup.getTime() - CANCELLATION_WINDOW_MS)
    if (deadline.getTime() <= Date.parse(asOf)) return null
    return `${formatHeadlineDate(deadline)}, ${formatTime(deadline)}`
  }, [pickup, asOf])

  const price = useMemo(
    () => formatPrice(transfer.total_price, currentCurrency, exchangeRates),
    [transfer.total_price, currentCurrency, exchangeRates]
  )

  const reference = transfer.trip_number || transfer.booking_number
  const isPaid = transfer.payment_status === "completed"
  const paymentWants =
    transfer.payment_status === "failed" || transfer.payment_status === "pending"

  const guests =
    transfer.passenger_count && transfer.passenger_count > 0
      ? `${transfer.passenger_count} ${transfer.passenger_count === 1 ? "guest" : "guests"}`
      : null

  return (
    <section className="account-dispatch" aria-labelledby="account-dispatch-heading">
      {routeMap && <div className="account-dispatch__map print:hidden">{routeMap}</div>}

      <div className="account-dispatch-head">
        <div className="min-w-0">
          <p className="account-eyebrow">{countdownLabel(days)}</p>
          {/* One heading, two lines, as the confirmation sets it: the day above, the hour in
              italic gold beneath. */}
          <h2 id="account-dispatch-heading" className="account-dispatch-big">
            <span>{formatHeadlineDate(pickup)}</span>
            <span>
              <em>at {formatTime(pickup)}.</em>
            </span>
          </h2>
        </div>

        <div className="account-dispatch-meta">
          {/* The countdown as a figure, in the hollow numeral the confirmation spends on its
              pickup time. A customer scanning this page reads the number before the sentence. */}
          {days >= 0 && (
            <div className="account-dispatch-countdown">
              <span className="account-label">{days === 0 ? "Today" : days === 1 ? "Tomorrow" : "Days to go"}</span>
              {days > 1 && <p className="account-figure mt-1">{String(days).padStart(2, "0")}</p>}
            </div>
          )}
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="account-ref">{reference}</span>
            <span className={`account-chip ${paymentWants ? "account-chip-alert" : ""}`}>
              {paymentWants
                ? transfer.payment_status === "failed"
                  ? "Payment failed"
                  : "Payment pending"
                : isPaid
                  ? "Confirmed · paid"
                  : "Confirmed"}
            </span>
          </div>
        </div>
      </div>

      <div className="account-dispatch-body">
        <div className="account-route">
          <div className="account-route-stop">
            <span className="account-label">Pickup</span>
            <p className="account-route-value">{transfer.pickup_address}</p>
          </div>
          <div className="account-route-stop">
            <span className="account-label">Drop-off</span>
            <p className="account-route-value">{transfer.dropoff_address}</p>
          </div>
        </div>

        <div className="account-dispatch-aside">
          {transfer.vehicle_type?.name && (
            <div>
              <span className="account-label">Vehicle</span>
              <p className="mt-1 text-[1.0625rem] font-medium text-[var(--text-primary)]">
                {transfer.vehicle_type.name}
              </p>
            </div>
          )}
          <div>
            <span className="account-label">Chauffeur</span>
            {/* The honest empty state. A customer eight days out has no driver yet, and "not
                assigned" reads like something went wrong; this says when it fills instead. */}
            {transfer.driver_name ? (
              <>
                <p className="mt-1 text-[1.0625rem] font-medium text-[var(--text-primary)]">
                  {transfer.driver_name}
                </p>
                {transfer.vendor_name && (
                  <p className="mt-0.5 text-[0.8125rem] text-[var(--text-muted)]">
                    {transfer.vendor_name}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 flex items-start gap-2 text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--gold)]" aria-hidden="true" />
                <span>Named 12 hours before pickup, with the plate and a direct number.</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* The fare row, in the ledger the search results and the confirmation both use. */}
      <dl className="trip-ledger account-dispatch-ledger">
        <div className="trip-ledger__item">
          <dt className="trip-ledger__label">Pickup</dt>
          <dd className="trip-ledger__value">
            {new Intl.DateTimeFormat("en-GB", {
              timeZone: tz(),
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(pickup)}
            , {formatTime(pickup)}
          </dd>
        </div>
        {guests && (
          <div className="trip-ledger__item">
            <dt className="trip-ledger__label">Guests</dt>
            <dd className="trip-ledger__value">{guests}</dd>
          </div>
        )}
        <div className="trip-ledger__item trip-ledger__item--price">
          <dt className="trip-ledger__label">{isPaid ? "Paid" : "Fare"}</dt>
          <dd className="trip-ledger__value">{price}</dd>
        </div>
      </dl>

      <div className="account-dispatch-foot">
        {freeUntil ? (
          <p className="text-[0.8125rem] leading-relaxed text-[var(--text-secondary)] tabular-nums">
            Cancel free until {freeUntil}.
          </p>
        ) : (
          <p className="text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
            Inside 24 hours of pickup, so the fare is no longer refundable. The desk can still help.
          </p>
        )}
        <div className="account-dispatch-actions">
          {/* Anything the chauffeur should know — a flight number, a different meeting point —
              is the notes field on the transfer itself, so this is a link to it rather than a
              second place to type the same thing. */}
          <Link
            href={`/account/bookings/${encodeURIComponent(reference)}#notes-heading`}
            className="checkout-btn-secondary"
          >
            Add a flight number
          </Link>
          <Link
            href={`/account/bookings/${encodeURIComponent(reference)}`}
            className="checkout-btn-primary"
          >
            View transfer
          </Link>
        </div>
      </div>
    </section>
  )
}
