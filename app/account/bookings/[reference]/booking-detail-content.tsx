'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice, convertAmount, getCurrencyDecimalPlaces } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import { getBookingTimezone, bookingToday } from '@/lib/utils/timezone'
import { formatGuestSummary } from '@/components/home/hero/guest-breakdown'
import { formatChildAges } from '@/lib/utils/child-ages'
import { InvoiceDownloadButton } from '@/app/booking/confirmation/components/invoice-download-button'
import { BookingCancelAction } from '@/components/account/booking-cancel-action'
import {
  CARD,
  CARD_LABEL,
  CARD_LABEL_STRONG,
  BAND,
  BAND_DIVIDER,
  TOTAL_BAND,
  SEGMENT_VALUE,
  SEGMENT_CAPTION,
  GHOST_BUTTON,
  EASE_LUXURY,
  RouteStop,
  SummaryRow,
  GuaranteeList,
  CardMotion,
} from '@/components/booking/itinerary-primitives'

/* ------------------------------------------------------------------ shape */

interface DetailAmenity {
  id: string
  amenity_type: string
  quantity: number | null
  price: number
  child_ages: number[] | null
  addon: { name: string | null } | null
}

interface DetailAssignment {
  status: string | null
  assigned_at: string | null
  accepted_at: string | null
  completed_at: string | null
  vendor: { business_name: string | null; business_phone: string | null; business_email: string | null } | null
  driver: { first_name: string | null; last_name: string | null; phone: string | null } | null
  vehicle: { make: string | null; model: string | null; year: number | null; registration_number: string | null } | null
}

/**
 * A structural type, not the generated Row. The page hands over a Supabase result with five joins
 * on it; naming only what this component reads keeps the two free to move independently, which is
 * how ConfirmationContent already declares its own `Booking`.
 */
export interface DetailBooking {
  id: string
  booking_number: string
  trip_number: string | null
  booking_status: string
  payment_status: string | null
  pickup_address: string
  dropoff_address: string
  pickup_datetime: string
  passenger_count: number
  adults?: number | null
  children?: number | null
  infants?: number | null
  luggage_count?: number | null
  base_price: number
  total_price: number
  customer_notes: string | null
  created_at: string | null
  paid_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  from_location_id: string | null
  to_location_id: string | null
  vehicle_type: { name: string | null; passenger_capacity: number | null; luggage_capacity: number | null } | null
  booking_assignments: DetailAssignment[] | null
  booking_amenities: DetailAmenity[] | null
}

/* ------------------------------------------------------------------ time */

const TZ = () => getBookingTimezone()

/** "Wed 2 Sep 2026", matching the confirmation page's departure line exactly. */
const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: TZ(), weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(d)

const formatTime = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: TZ(), hour: '2-digit', minute: '2-digit', hour12: false }).format(d)

/** "2 Sep 2026 · 12:56" for the history stops on the rail. */
const formatStamp = (iso: string) => {
  const d = new Date(iso)
  const date = new Intl.DateTimeFormat('en-GB', { timeZone: TZ(), day: 'numeric', month: 'short', year: 'numeric' }).format(d)
  return `${date} · ${formatTime(d)}`
}

/* ------------------------------------------------------------------ status */

/**
 * One status, in the list card's vocabulary.
 *
 * The drawer ran a private badge system that printed the raw database string in semantic red,
 * green and blue fills, so a customer read "completed" here and "Travelled" on the card one click
 * away. These are the card's own labels, and the chip stays gold.
 */
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed',
  completed: 'Travelled',
  cancelled: 'Cancelled',
  pending: 'Pending',
  assigned: 'Confirmed',
  in_progress: 'On the road',
  refunded: 'Refunded',
}

/** Sentence case for anything the map above does not name, never raw DB casing. */
function titleCase(value: string): string {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/_/g, ' ')
}

/* ------------------------------------------------------------------ ledger labels */

function amenityLabel(a: DetailAmenity): string {
  const base =
    a.amenity_type === 'child_seat_infant'
      ? 'Infant seat'
      : a.amenity_type === 'child_seat_booster'
        ? 'Booster seat'
        : a.amenity_type === 'extra_luggage'
          ? 'Extra luggage'
          : a.addon?.name || 'Add-on'
  const qty = (a.quantity ?? 1) > 1 ? ` × ${a.quantity}` : ''
  return `${base}${qty}${formatChildAges(a.child_ages)}`
}

/* ------------------------------------------------------------------ component */

export function BookingDetailContent({ booking }: { booking: DetailBooking }) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const reduceMotion = !!useReducedMotion()
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  /**
   * Frozen at mount rather than read per render, so the cancellation window cannot flip
   * mid-interaction and take the control away under the customer's cursor.
   */
  const [now] = useState(() => Date.now())

  const reference = booking.trip_number || booking.booking_number
  const assignment = booking.booking_assignments?.[0]

  const isCancelled = booking.booking_status === 'cancelled'
  const isTravelled = booking.booking_status === 'completed'
  const isPaid = booking.payment_status === 'completed'
  const statusLabel = STATUS_LABEL[booking.booking_status] ?? titleCase(booking.booking_status)

  /**
   * Gated on the same flags the confirmation page uses. Every guarantee is written in the future
   * tense, so a travelled trip would be promised a chauffeur who "meets you inside arrivals" and a
   * cancelled one would be sold a cancellation policy it has already used.
   */
  const showGuarantees = !isCancelled && !isTravelled

  const canCancel =
    (booking.booking_status === 'confirmed' || booking.booking_status === 'pending') &&
    new Date(booking.pickup_datetime).getTime() - now > 24 * 60 * 60 * 1000

  const pickupDate = booking.pickup_datetime ? new Date(booking.pickup_datetime) : null

  /* ---------------- money */

  const formatUserPrice = (amount: number) => formatPrice(amount ?? 0, currentCurrency, exchangeRates)

  /**
   * The same figure without its currency code. Nine repetitions of "AED" down the right edge were
   * noise and broke the tabular column; the code is stated once, on the card header.
   */
  const formatUserAmount = (amount: number) => {
    const decimals = getCurrencyDecimalPlaces(currentCurrency)
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(convertAmount(amount ?? 0, 'AED', currentCurrency, exchangeRates))
  }

  const isConverted = currentCurrency !== 'AED'
  const amenities = booking.booking_amenities ?? []

  /* ---------------- the rail */

  /**
   * The signature. The route rail already draws pickup and destination as two dots on a hairline;
   * here it keeps going, and the booking's own events hang off the same spine. A transfer is a
   * line from A to B, and the record of that transfer is a line through time.
   *
   * This replaces three separate devices: the floating "Booked / Paid" stamps above the journey,
   * the assignment timeline buried inside the vehicle section, and the green-and-red dots that put
   * the end of a journey in the cancellation colour.
   */
  const history: Array<{ label: string; at: string }> = []
  if (booking.created_at) history.push({ label: 'Booked', at: booking.created_at })
  if (booking.paid_at) history.push({ label: 'Paid', at: booking.paid_at })
  if (assignment?.accepted_at) history.push({ label: 'Chauffeur assigned', at: assignment.accepted_at })
  else if (assignment?.assigned_at) history.push({ label: 'Chauffeur assigned', at: assignment.assigned_at })
  if (assignment?.completed_at) history.push({ label: 'Travelled', at: assignment.completed_at })
  if (booking.cancelled_at) history.push({ label: 'Cancelled', at: booking.cancelled_at })

  /* ---------------- vehicle */

  // "5 / 5" read as a capacity warning rather than a count, and a bare "4" under "Bags" carried no
  // unit at all. The vehicle segment states both in words instead.
  const partySummary = [
    `${booking.passenger_count} passenger${booking.passenger_count === 1 ? '' : 's'}`,
    booking.vehicle_type?.luggage_capacity
      ? `${booking.vehicle_type.luggage_capacity} bag${booking.vehicle_type.luggage_capacity === 1 ? '' : 's'}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  // Only worth showing when the party isn't all adults. Otherwise it restates passenger_count.
  const guestSummary =
    booking.adults != null && (booking.children ?? 0) + (booking.infants ?? 0) > 0
      ? formatGuestSummary({
          adults: booking.adults,
          children: booking.children ?? 0,
          infants: booking.infants ?? 0,
        })
      : null

  /* ---------------- chauffeur */

  const driverName = assignment?.driver
    ? [assignment.driver.first_name, assignment.driver.last_name].filter(Boolean).join(' ').trim()
    : ''
  const vehicleLine = assignment?.vehicle
    ? [
        [assignment.vehicle.make, assignment.vehicle.model, assignment.vehicle.year].filter(Boolean).join(' '),
        assignment.vehicle.registration_number,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''
  const showChauffeur = Boolean(driverName || assignment?.vendor?.business_name)

  /* ---------------- rebook */

  /**
   * Rebooking a route already travelled is the highest intent action a returning customer has, and
   * it lived only on the list card. /search/results resolves locations by id, so the link renders
   * only when the booking carries both.
   */
  const rebookHref = useMemo(() => {
    if (!booking.from_location_id || !booking.to_location_id) return null
    const params = new URLSearchParams({
      from: booking.from_location_id,
      to: booking.to_location_id,
      date: bookingToday(),
      passengers: String(booking.passenger_count > 0 ? booking.passenger_count : 1),
    })
    return `/search/results?${params.toString()}`
  }, [booking.from_location_id, booking.to_location_id, booking.passenger_count])

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      toast.success('Booking reference copied')
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy the reference')
    }
  }

  /* ---------------- ledger card */

  const pricingCard = (
    <div className={CARD}>
      <div className={`${BAND} flex items-baseline justify-between gap-3 border-b border-[rgba(var(--gold-rgb),0.1)]`}>
        <h2 className={CARD_LABEL}>Payment summary</h2>
        {/* The legend for the bare figures below. */}
        <span className={`${CARD_LABEL} numeric`}>{currentCurrency}</span>
      </div>

      <div className={BAND}>
        <dl className="space-y-2.5">
          <SummaryRow
            label={`Base fare · ${booking.passenger_count} passenger${booking.passenger_count === 1 ? '' : 's'}`}
            value={formatUserAmount(booking.base_price)}
          />
          {amenities.map((a) => (
            <SummaryRow key={a.id} label={amenityLabel(a)} value={formatUserAmount(a.price)} />
          ))}
        </dl>
      </div>

      {/* The total band, matching booking-ledger.tsx exactly. The customer has now seen this
          treatment at checkout, at payment and on the confirmation. */}
      <div className={`${BAND} ${TOTAL_BAND}`}>
        <div className="flex items-baseline justify-between gap-3">
          <span className={CARD_LABEL_STRONG}>{isPaid ? 'Total paid' : 'Total'}</span>
          <span className="t-price whitespace-nowrap">{formatUserPrice(booking.total_price)}</span>
        </div>
        <p className="mt-2.5 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
          Includes the vehicle, chauffeur, fuel, tolls and parking. No surge, no tip prompt.
        </p>
        {isConverted && (
          <p className="mt-2 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
            Shown in {currentCurrency}. Charged in AED ({formatPrice(booking.total_price ?? 0, 'AED', exchangeRates)}).
          </p>
        )}
      </div>
    </div>
  )

  const actions = (
    <div className="flex flex-col gap-4 print:hidden">
      {rebookHref && (
        <Link href={rebookHref} className="btn btn-primary w-full">
          Book this route again
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={copyReference} className={GHOST_BUTTON} aria-label="Copy booking reference">
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy reference'}
        </button>
        {isPaid && (
          <InvoiceDownloadButton
            bookingNumber={booking.booking_number}
            invoiceNumber={reference}
            className={GHOST_BUTTON}
          />
        )}
        {/* The account's most engaged screen had no route to a person on it. Same address the
            confirmation page gives, so a customer who replies to either reaches the same desk. */}
        <a href="mailto:info@infiniatransfers.com" className={GHOST_BUTTON}>
          Email support
        </a>
      </div>
    </div>
  )

  return (
    <div>
      {/* Back before anything else. The drawer's only exit was a close button that returned the
          customer to an unscrolled list. */}
      <Link href="/account?tab=bookings" className="account-action print:hidden">
        <span aria-hidden="true">&larr;</span>
        All bookings
      </Link>

      {/* The route is the fact that identifies this booking, and it was set at 14px under two
          chips and two timestamps. It is the headline now. */}
      <motion.header
        className="mt-6"
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE_LUXURY }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <h1 className="min-w-0 text-[clamp(1.6rem,3.4vw,2.4rem)] font-medium leading-[1.1] tracking-[-0.028em] text-[var(--text-primary)] [text-wrap:balance]">
            {booking.pickup_address}{' '}
            <span className="font-normal text-[var(--text-muted)]">to</span>{' '}
            {booking.dropoff_address}
          </h1>
          <span className="account-chip self-start">{statusLabel}</span>
        </div>
        <p className="numeric mt-3 text-[0.875rem] tracking-[0.08em] text-[var(--text-secondary)]">{reference}</p>
      </motion.header>

      {isCancelled && booking.cancellation_reason && (
        <p className="mt-5 max-w-[65ch] text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
          {booking.cancellation_reason}
        </p>
      )}

      <div className="mt-[clamp(2rem,4vw,3rem)] flex flex-col items-start gap-8 xl:flex-row xl:gap-10">
        {/* Main column */}
        <div className="min-w-0 w-full flex-1 space-y-8">

          <CardMotion reduceMotion={reduceMotion} delay={0.1} aria-labelledby="itinerary-heading" className={CARD}>
            <div className={`${BAND} border-b border-[rgba(var(--gold-rgb),0.1)]`}>
              <h2 id="itinerary-heading" className={CARD_LABEL}>Itinerary</h2>
            </div>

            <div className={BAND}>
              <ol className="space-y-5">
                {/* Origin hollow, destination filled once the trip has actually been made. That is
                    the confirmation rail's own treatment, with the fill now saying something. */}
                <RouteStop label="Pickup" address={booking.pickup_address} reduceMotion={reduceMotion} />
                <RouteStop
                  label="Destination"
                  address={booking.dropoff_address}
                  state={isTravelled ? 'done' : 'pending'}
                  terminal={history.length === 0}
                  reduceMotion={reduceMotion}
                />
                {history.map((row, i) => (
                  <RouteStop
                    key={`${row.label}-${row.at}`}
                    label={row.label}
                    meta={formatStamp(row.at)}
                    state="done"
                    terminal={i === history.length - 1}
                    reduceMotion={reduceMotion}
                  />
                ))}
              </ol>
            </div>

            {/* A departure is one fact. Date and time sat in separate grid columns, which made the
                reader reassemble them, and wrapped "Wednesday," onto a line of its own. */}
            <div className={`${BAND_DIVIDER} ${BAND}`}>
              <p className={CARD_LABEL}>Departure</p>
              <p className={`numeric ${SEGMENT_VALUE}`}>
                {pickupDate ? `${formatDate(pickupDate)} · ${formatTime(pickupDate)}` : 'To be confirmed'}
              </p>
            </div>

            {booking.vehicle_type?.name && (
              <div className={`${BAND_DIVIDER} ${BAND}`}>
                <p className={CARD_LABEL}>Vehicle</p>
                {/* No thumbnail. The Itinerary Block is typographic by definition and DESIGN.md
                    section 6 rules out car icons. */}
                <p className="mt-1.5 text-[1.125rem] font-medium leading-snug text-[var(--text-primary)]">
                  {booking.vehicle_type.name}
                </p>
                <p className={SEGMENT_CAPTION}>{partySummary}</p>
                {guestSummary && <p className={SEGMENT_CAPTION}>{guestSummary}</p>}
              </div>
            )}
          </CardMotion>

          {/* "Service Provider" promised a provider and delivered a car, and vanished entirely
              when nobody was assigned yet. Naming the person is the oldest trust signal there is. */}
          {showChauffeur && (
            <CardMotion reduceMotion={reduceMotion} delay={0.15} aria-labelledby="chauffeur-heading" className={CARD}>
              <div className={`${BAND} border-b border-[rgba(var(--gold-rgb),0.1)]`}>
                <h2 id="chauffeur-heading" className={CARD_LABEL}>Chauffeur</h2>
              </div>
              <div className={BAND}>
                <p className={SEGMENT_VALUE}>{driverName || assignment?.vendor?.business_name}</p>
                {(driverName && assignment?.vendor?.business_name) || vehicleLine ? (
                  <p className={SEGMENT_CAPTION}>
                    {[driverName ? assignment?.vendor?.business_name : null, vehicleLine].filter(Boolean).join(' · ')}
                  </p>
                ) : null}

                {(assignment?.driver?.phone || assignment?.vendor?.business_phone) && (
                  <p className="mt-3.5">
                    <a
                      href={`tel:${assignment.driver?.phone || assignment.vendor?.business_phone}`}
                      className="numeric text-[0.9375rem] text-[var(--gold-text)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--gold)] focus-visible:outline-offset-2"
                    >
                      {assignment.driver?.phone || assignment.vendor?.business_phone}
                    </a>
                  </p>
                )}
              </div>
            </CardMotion>
          )}

          {booking.customer_notes && (
            <CardMotion reduceMotion={reduceMotion} delay={0.2} aria-labelledby="notes-heading" className={CARD}>
              <div className={`${BAND} border-b border-[rgba(var(--gold-rgb),0.1)]`}>
                <h2 id="notes-heading" className={CARD_LABEL}>Your notes</h2>
              </div>
              <div className={BAND}>
                <p className="max-w-[65ch] text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
                  {booking.customer_notes}
                </p>
              </div>
            </CardMotion>
          )}

          {/* Ledger and actions follow the itinerary on anything narrower than the two-column
              breakpoint, rather than being stranded below the fold. */}
          <div className="space-y-8 xl:hidden">
            {pricingCard}
            {actions}
            {showGuarantees && <GuaranteeList id="guarantees-heading-mobile" />}
          </div>

          {canCancel && (
            <div className="border-t border-[var(--border-subtle)] pt-6 print:hidden">
              <BookingCancelAction bookingId={booking.id} />
            </div>
          )}
        </div>

        {/* Ledger rail. The account content column is narrower than the confirmation page's, so
            this splits at xl rather than lg. */}
        <motion.aside
          className="hidden w-[360px] flex-shrink-0 xl:sticky xl:top-24 xl:block"
          aria-label="Payment summary"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.15, ease: EASE_LUXURY }}
        >
          {pricingCard}
          <div className="mt-8">{actions}</div>
          {showGuarantees && (
            <div className="mt-8">
              <GuaranteeList />
            </div>
          )}
        </motion.aside>
      </div>
    </div>
  )
}
