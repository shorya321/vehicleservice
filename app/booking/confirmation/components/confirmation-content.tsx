'use client'

import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { formatPrice, convertAmount, getCurrencyDecimalPlaces } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import { Copy, Check, Info, ArrowRight, Lock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { getBookingTimezone } from '@/lib/utils/timezone'
import { formatGuestSummary } from '@/components/home/hero/guest-breakdown'
import { formatChildAges } from '@/lib/utils/child-ages'
import { RouteConnector } from '@/app/search/results/components/route-connector'
import { EASE_LUXURY } from '@/components/booking/itinerary-primitives'
import { InvoiceDownloadButton } from './invoice-download-button'

const tz = () => getBookingTimezone()

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: tz(), weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(d)

/** "Sat 26 Sep", for the transfer card's cap. */
const formatShortDate = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: tz(), weekday: 'short', day: 'numeric', month: 'short' })
    .format(d)
    .replace(',', '')

/**
 * "Saturday, 26 September" for the headline, with the year added only when the pickup is not in
 * the current year, so a booking made in December for January still reads unambiguously.
 */
const formatHeadlineDate = (d: Date) => {
  const part = (opts: Intl.DateTimeFormatOptions, date: Date = d) =>
    new Intl.DateTimeFormat('en-GB', { timeZone: tz(), ...opts }).format(date)
  const sameYear = part({ year: 'numeric' }) === part({ year: 'numeric' }, new Date())
  const date = `${part({ day: 'numeric' })} ${part({ month: 'long' })}${sameYear ? '' : ` ${part({ year: 'numeric' })}`}`
  return `${part({ weekday: 'long' })}, ${date}`
}

const formatTime = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: tz(), hour: '2-digit', minute: '2-digit', hour12: false }).format(d)

/** "17 September", for the charge line. */
const formatDay = (d: Date) => new Intl.DateTimeFormat('en-GB', { timeZone: tz(), day: 'numeric', month: 'long' }).format(d)

/**
 * Clock time shifted by whole minutes. Elapsed time needs no timezone: the shift happens on the
 * instant and only the formatting resolves in the operating zone, so this stays right across a
 * DST edge where a wall-clock shift would not.
 */
const shiftedTime = (d: Date, minutes: number) => formatTime(new Date(d.getTime() + minutes * 60_000))

const MARK_CHECK = 'M21 33L28.5 40.5L43 26'
const MARK_CROSS = 'M24 24L40 40M40 24L24 40'

interface BookingPassenger {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  is_primary: boolean | null
}

interface BookingAmenity {
  amenity_type: string
  quantity: number | null
  price: number
  addon_id: string | null
  /** One age per seat on child-seat add-ons; null everywhere else. */
  child_ages: number[] | null
  addon: { id: string; name: string; icon: string | null } | null
}

interface VehicleType {
  id: string
  name: string
  passenger_capacity: number | null
  luggage_capacity: number | null
  description: string | null
  image_url: string | null
  category?: { name: string } | null
}

interface Booking {
  booking_number: string
  trip_number?: string | null
  booking_status: string
  payment_status?: string | null
  /** When the charge went through. Null on a booking that has not been paid. */
  paid_at?: string | null
  pickup_address: string
  dropoff_address: string
  pickup_datetime: string | null
  passenger_count: number
  // Optional despite being NOT NULL in the DB: matches the email's `adults != null` fallback, so a
  // caller that narrows its select degrades to the plain total instead of rendering undefined.
  adults?: number
  children?: number
  infants?: number
  base_price: number
  total_price: number
  customer_notes: string | null
  vehicle_type: VehicleType | null
  booking_passengers: BookingPassenger[]
  booking_amenities: BookingAmenity[]
}

interface ConfirmationContentProps {
  booking: Booking
  primaryPassenger: BookingPassenger | undefined
  childSeats: BookingAmenity[]
  addons: BookingAmenity[]
  /** The route's scheduled drive, when one could be found. Only the arrival estimate uses it. */
  route?: { distance_km: number | null; estimated_duration_minutes: number | null } | null
  /** The search page's street map, server-rendered and passed in as a slot. */
  routeMap?: ReactNode
}

/**
 * The small status mark beside the eyebrow. `animate` is ALWAYS supplied: useReducedMotion() is
 * false during SSR, so an `animate={skip ? undefined : ...}` idiom would serialise the hidden
 * initial state and leave a reduced-motion visitor with an invisible mark.
 */
function StatusMark({ reduceMotion, stroke, path }: { reduceMotion: boolean; stroke: string; path: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true" className="block flex-none">
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        stroke={stroke}
        strokeWidth="2.2"
        fill="none"
        initial={{ pathLength: reduceMotion ? 1 : 0, opacity: reduceMotion ? 1 : 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.7, ease: EASE_LUXURY }}
      />
      <motion.path
        d={path}
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: reduceMotion ? 1 : 0, opacity: reduceMotion ? 1 : 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : 0.55, ease: EASE_LUXURY }}
      />
    </svg>
  )
}

/** A card's entrance. Mount-driven, never scroll-driven, and `animate` always supplied. */
function Rise({
  children,
  reduceMotion,
  delay,
  className,
  ...rest
}: {
  children: ReactNode
  reduceMotion: boolean
  delay: number
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : delay, ease: EASE_LUXURY }}
      {...rest}
    >
      {children}
    </motion.section>
  )
}

function getStatusConfig(status: string) {
  if (status === 'cancelled') {
    return {
      eyebrow: 'Cancelled',
      sentence: 'Transfer cancelled.',
      body: 'This booking has been cancelled. If you believe this is an error, please contact support.',
      showPricing: false,
      showDay: false,
      markStroke: 'var(--text-muted)',
      markPath: MARK_CROSS,
    }
  }
  if (status === 'completed') {
    return {
      eyebrow: 'Completed',
      sentence: 'Transfer completed.',
      body: 'We hope you had a pleasant journey. Thank you for choosing Infinia Transfers.',
      showPricing: true,
      showDay: false,
      markStroke: 'var(--text-secondary)',
      markPath: MARK_CHECK,
    }
  }
  if (status === 'pending') {
    return {
      eyebrow: 'Pending',
      sentence: 'Booking pending.',
      body: 'Your booking is being processed. You will receive a confirmation once it is approved.',
      showPricing: true,
      showDay: true,
      markStroke: 'var(--text-secondary)',
      markPath: MARK_CHECK,
    }
  }
  return {
    eyebrow: 'Confirmed',
    sentence: 'Your transfer is booked.',
    body: null,
    showPricing: true,
    showDay: true,
    // --gold-text, not --gold: the raw brand gold washes out against the light ground.
    markStroke: 'var(--gold-text)',
    markPath: MARK_CHECK,
  }
}

export function ConfirmationContent({
  booking,
  primaryPassenger,
  childSeats,
  addons,
  route,
  routeMap,
}: ConfirmationContentProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const reduceMotion = !!useReducedMotion()
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  const formatUserPrice = (amount: number) => formatPrice(amount ?? 0, currentCurrency, exchangeRates)

  /** The same figure without its currency code; the code is stated once, on the card's cap. */
  const formatUserAmount = (amount: number) => {
    const decimals = getCurrencyDecimalPlaces(currentCurrency)
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(convertAmount(amount ?? 0, 'AED', currentCurrency, exchangeRates))
  }

  const isConverted = currentCurrency !== 'AED'
  const isPaid = booking.payment_status === 'completed'
  const pickupDate = booking.pickup_datetime ? new Date(booking.pickup_datetime) : null
  const paidOn = isPaid && booking.paid_at ? new Date(booking.paid_at) : null
  const statusConfig = getStatusConfig(booking.booking_status)
  const reference = booking.trip_number || booking.booking_number
  const duration = route?.estimated_duration_minutes ?? null

  // Only a live booking with a known pickup gets the day-and-time statement. A cancelled or
  // completed trip, or one still waiting for a time, is told what happened in a sentence instead.
  const headlineIsTime = !!pickupDate && statusConfig.showDay
  const eyebrow = booking.booking_status === 'confirmed' && isPaid ? 'Confirmed and paid' : statusConfig.eyebrow

  const guestSummary =
    booking.adults != null && (booking.children ?? 0) + (booking.infants ?? 0) > 0
      ? formatGuestSummary({
          adults: booking.adults,
          children: booking.children ?? 0,
          infants: booking.infants ?? 0,
        })
      : null

  const vehicleSpecs = [
    booking.vehicle_type?.passenger_capacity
      ? `${booking.vehicle_type.passenger_capacity} seat${booking.vehicle_type.passenger_capacity === 1 ? '' : 's'}`
      : null,
    booking.vehicle_type?.luggage_capacity
      ? `${booking.vehicle_type.luggage_capacity} bag${booking.vehicle_type.luggage_capacity === 1 ? '' : 's'}`
      : null,
    guestSummary ?? `${booking.passenger_count} passenger${booking.passenger_count === 1 ? '' : 's'}`,
  ].filter((s): s is string => !!s)

  const copyBookingNumber = async () => {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      toast.success('Booking reference copied')
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    // No min-h-screen: this sits inside `main.pt-20`, so it forced every booking, however short,
    // to overflow the viewport by the header height plus the footer.
    <div className="confirm-sat">
      {routeMap && <div className="confirm-sat__map print:hidden">{routeMap}</div>}

      <div className="luxury-container confirm-sat__split">
        {/* ---- the statement, held while the column scrolls ---- */}
        <motion.div
          className="confirm-sat__left"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: EASE_LUXURY }}
        >
          <div className="confirm-sat__status">
            <StatusMark reduceMotion={reduceMotion} stroke={statusConfig.markStroke} path={statusConfig.markPath} />
            <p className="editorial-eyebrow">{eyebrow}</p>
          </div>

          {headlineIsTime && pickupDate ? (
            <h1 className="confirm-sat__big">
              <span>{formatHeadlineDate(pickupDate)}</span>
              <span>
                <em>{formatTime(pickupDate)}.</em>
              </span>
              <span className="sr-only"> {statusConfig.sentence}</span>
            </h1>
          ) : (
            <h1 className="confirm-sat__big confirm-sat__big--sentence">{statusConfig.sentence}</h1>
          )}

          {statusConfig.body ? (
            <p className="confirm-sat__lede">{statusConfig.body}</p>
          ) : (
            <p className="confirm-sat__lede">
              Your chauffeur will be at <strong>{booking.pickup_address}</strong>, and a copy of everything is on its
              way to {primaryPassenger?.email || 'your email'}.
            </p>
          )}

          <dl className="trip-ledger">
            <div className="trip-ledger__item">
              <dt className="trip-ledger__label">Reference</dt>
              <dd className="trip-ledger__value confirm-sat__reference">{reference}</dd>
            </div>
            {statusConfig.showPricing && (
              <div className="trip-ledger__item trip-ledger__item--price">
                <dt className="trip-ledger__label">{isPaid ? 'Paid' : 'Total'}</dt>
                <dd className="trip-ledger__value">{formatUserPrice(booking.total_price)}</dd>
              </div>
            )}
          </dl>

          <div className="confirm-sat__actions print:hidden">
            {isPaid && (
              <InvoiceDownloadButton
                bookingNumber={booking.booking_number}
                invoiceNumber={reference}
                className="checkout-btn-primary"
              />
            )}
            <button type="button" onClick={copyBookingNumber} className="checkout-btn-secondary" aria-label="Copy booking reference">
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy reference'}
            </button>
          </div>

          {/* Kept from the page this replaces: the two ways onward. */}
          <div className="confirm-sat__links print:hidden">
            <Link href="/account" className="editorial-action min-h-[44px]">
              View my bookings
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/" className="editorial-action min-h-[44px]">
              Book another transfer
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </motion.div>

        {/* ---- the booking, as a column of the checkout's own stubs ---- */}
        <div className="confirm-sat__right">
          <Rise reduceMotion={reduceMotion} delay={0.1} className="checkout-summary-card confirm-sat__card--lift" aria-labelledby="transfer-heading">
            <div className="checkout-stub-cap">
              <h2 id="transfer-heading" className="editorial-eyebrow">Your transfer</h2>
              {pickupDate && <span className="checkout-stub-ref">{formatShortDate(pickupDate)}</span>}
            </div>

            <div className="confirm-sat__band" style={{ paddingBottom: '1rem' }}>
              <div className="checkout-stub-route">
                <span className="checkout-stub-route__place">
                  <span className="checkout-stub-route__name">{booking.pickup_address}</span>
                  <span className="checkout-stub-route__note">
                    {pickupDate ? `Pickup ${formatTime(pickupDate)}` : 'Pickup'}
                  </span>
                </span>
                <RouteConnector />
                <span className="sr-only"> to </span>
                <span className="checkout-stub-route__place">
                  <span className="checkout-stub-route__name">{booking.dropoff_address}</span>
                  <span className="checkout-stub-route__note">
                    {pickupDate && duration ? `Arrive about ${shiftedTime(pickupDate, duration)}` : 'Destination'}
                  </span>
                </span>
              </div>
            </div>

            <div className="checkout-stub-perf" aria-hidden="true">
              <span />
              <span />
            </div>

            <div className="confirm-sat__band" style={{ paddingTop: '0.75rem' }}>
              {booking.vehicle_type ? (
                <>
                  {booking.vehicle_type.category?.name && (
                    <p className="confirm-sat__cat">{booking.vehicle_type.category.name}</p>
                  )}
                  <p className="confirm-sat__vehicle">{booking.vehicle_type.name}</p>
                </>
              ) : (
                <p className="confirm-sat__cat">{pickupDate ? formatDate(pickupDate) : 'Date to be confirmed'}</p>
              )}
              <p className="checkout-stub-specs">
                {vehicleSpecs.map((spec) => (
                  <span key={spec}>{spec}</span>
                ))}
              </p>
            </div>
          </Rise>

          {statusConfig.showDay && (
            <Rise reduceMotion={reduceMotion} delay={0.18} className="checkout-summary-card" aria-labelledby="day-heading">
              <div className="checkout-stub-cap">
                <h2 id="day-heading" className="confirm-sat__label">On the day</h2>
              </div>
              <div className="confirm-sat__band">
                {pickupDate ? (
                  <ol className="confirm-sat__day">
                    <li>
                      <span className="confirm-sat__time">{shiftedTime(pickupDate, -30)}</span>
                      <span className="confirm-sat__what">Your chauffeur calls with their name and plate.</span>
                    </li>
                    <li>
                      <span className="confirm-sat__time">{shiftedTime(pickupDate, -5)}</span>
                      <span className="confirm-sat__what">Be ready at your pickup location, five minutes early.</span>
                    </li>
                    <li>
                      <span className="confirm-sat__time">{shiftedTime(pickupDate, 45)}</span>
                      <span className="confirm-sat__what">
                        The car waits until this time at no charge, or 45 minutes past landing on airport pickups.
                      </span>
                    </li>
                  </ol>
                ) : (
                  <ol className="confirm-sat__day">
                    <li>
                      <span className="confirm-sat__time">01</span>
                      <span className="confirm-sat__what">Be ready at your pickup location 5 minutes before the scheduled time.</span>
                    </li>
                    <li>
                      <span className="confirm-sat__time">02</span>
                      <span className="confirm-sat__what">
                        Your chauffeur will wait up to 45 minutes past the scheduled pickup, or past your actual landing
                        time on airport pickups.
                      </span>
                    </li>
                  </ol>
                )}
              </div>
            </Rise>
          )}

          {statusConfig.showPricing && (
            <Rise reduceMotion={reduceMotion} delay={0.26} className="checkout-summary-card" aria-labelledby="payment-heading">
              <div className="checkout-stub-cap">
                <h2 id="payment-heading" className="confirm-sat__label">Payment summary</h2>
                <span className="checkout-stub-ref">{currentCurrency}</span>
              </div>

              <dl className="confirm-sat__band confirm-sat__ledger">
                <div>
                  <dt>{`Base fare · ${booking.passenger_count} passenger${booking.passenger_count === 1 ? '' : 's'}`}</dt>
                  <dd>{formatUserAmount(booking.base_price)}</dd>
                </div>
                {childSeats.map((seat, idx) => (
                  <div key={`seat-${idx}`}>
                    <dt>{`${seat.amenity_type === 'child_seat_infant' ? 'Infant seat' : 'Booster seat'}${(seat.quantity ?? 1) > 1 ? ` × ${seat.quantity}` : ''}`}</dt>
                    <dd>{formatUserAmount(seat.price)}</dd>
                  </div>
                ))}
                {addons.map((addon, idx) => (
                  <div key={`addon-${idx}`}>
                    <dt>{`${addon.addon?.name || 'Add-on'}${(addon.quantity ?? 1) > 1 ? ` × ${addon.quantity}` : ''}${formatChildAges(addon.child_ages)}`}</dt>
                    <dd>{formatUserAmount(addon.price)}</dd>
                  </div>
                ))}
              </dl>

              <div className="confirm-sat__band confirm-sat__total">
                <div className="confirm-sat__total-row">
                  <span className="confirm-sat__label">{isPaid ? 'Total paid' : 'Total'}</span>
                  <span className="confirm-sat__total-figure">{formatUserPrice(booking.total_price)}</span>
                </div>
                {isConverted && (
                  <p className="mt-2 flex items-start gap-2 text-[0.75rem] text-[var(--text-muted)]">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>
                      Shown in {currentCurrency}. Charged in AED ({formatPrice(booking.total_price ?? 0, 'AED', exchangeRates)}).
                    </span>
                  </p>
                )}
                {paidOn && (
                  <p className="confirm-sat__charge">
                    <Lock className="h-3 w-3" aria-hidden="true" />
                    <span>Charged {formatDay(paidOn)} · paid in full</span>
                  </p>
                )}
              </div>
            </Rise>
          )}

          <Rise reduceMotion={reduceMotion} delay={0.34} className="checkout-summary-card" aria-labelledby="passenger-heading">
            <div className="checkout-stub-cap">
              <h2 id="passenger-heading" className="confirm-sat__label">Lead passenger</h2>
            </div>
            <div className="confirm-sat__band">
              {primaryPassenger && (
                <dl className="confirm-sat__fields">
                  <div>
                    <dt className="confirm-sat__field-label">Name</dt>
                    <dd className="confirm-sat__field">{`${primaryPassenger.first_name} ${primaryPassenger.last_name}`}</dd>
                  </div>
                  {primaryPassenger.phone && (
                    <div>
                      <dt className="confirm-sat__field-label">Phone</dt>
                      <dd className="confirm-sat__field numeric">{primaryPassenger.phone}</dd>
                    </div>
                  )}
                  {primaryPassenger.email && (
                    <div className="confirm-sat__wide">
                      <dt className="confirm-sat__field-label">Email</dt>
                      <dd className="confirm-sat__field">{primaryPassenger.email}</dd>
                    </div>
                  )}
                </dl>
              )}
              <p className="confirm-sat__hint">
                Free cancellation up to 24 hours before pickup. Changes:{' '}
                <a href="mailto:info@infiniatransfers.com">info@infiniatransfers.com</a>.
              </p>
            </div>
          </Rise>

          {booking.customer_notes && (
            <Rise reduceMotion={reduceMotion} delay={0.4} className="checkout-summary-card" aria-labelledby="notes-heading">
              <div className="checkout-stub-cap">
                <h2 id="notes-heading" className="confirm-sat__label">Your notes</h2>
              </div>
              <div className="confirm-sat__band">
                <p className="max-w-[65ch] text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
                  {booking.customer_notes}
                </p>
              </div>
            </Rise>
          )}
        </div>
      </div>
    </div>
  )
}
