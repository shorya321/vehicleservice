'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { formatPrice, convertAmount, getCurrencyDecimalPlaces } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import { Copy, Check, Info, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { getBookingTimezone } from '@/lib/utils/timezone'
import { formatGuestSummary } from '@/components/home/hero/guest-breakdown'
import { formatChildAges } from '@/lib/utils/child-ages'
import { InvoiceDownloadButton } from './invoice-download-button'

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: getBookingTimezone(), weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(d)

const formatTime = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: getBookingTimezone(), hour: '2-digit', minute: '2-digit', hour12: false }).format(d)

/**
 * Hoisted so this page's label treatment cannot drift from the ledger the customer just came
 * through. These are the Tier 2 values from components/checkout/booking-ledger.tsx, verbatim.
 * The page previously used `.t-label` (0.75rem / 0.12em) for card headers, which is the Tier 1
 * section-eyebrow treatment doing a Tier 2 card-label job, so checkout and confirmation ran two
 * label systems inside one flow.
 */
const CARD_LABEL = 'text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]'
const CARD_LABEL_STRONG = 'text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]'

const CARD = 'bg-[var(--black-rich)] border border-[rgba(var(--gold-rgb),0.12)] rounded-[8px] overflow-hidden'
const BAND = 'px-6 xl:px-8 py-5'
const BAND_DIVIDER = 'border-t border-[rgba(var(--gold-rgb),0.1)]'

/** Value line inside an itinerary segment. Title role: 1.0625rem / 500. */
const SEGMENT_VALUE = 'mt-1.5 text-[1.0625rem] font-medium leading-snug text-[var(--text-primary)] break-words'
/** Tier 3 caption: sentence case, so a unit line cannot compete with the Tier 2 label above it. */
const SEGMENT_CAPTION = 'mt-1 text-[0.75rem] leading-snug text-[var(--text-muted)]'

const GHOST_BUTTON =
  'inline-flex min-h-[44px] items-center gap-2 rounded-[4px] border border-[var(--graphite)] px-4 text-[0.75rem] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]'

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1]

const MARK_CHECK = 'M21 33L28.5 40.5L43 26'
const MARK_CROSS = 'M24 24L40 40M40 24L24 40'

/**
 * The three guarantees, copied verbatim from components/checkout/trust-block.tsx, which sources
 * every claim to app/terms/components/terms-content.tsx. Do not add a claim here that is not in
 * the Terms, and do not reword these without changing the Terms first.
 */
const GUARANTEES = [
  {
    label: 'Cancellation',
    body: 'Free up to 24 hours before pickup. Full refund if we cancel on you.',
  },
  {
    label: 'Waiting time',
    body: '60 minutes free from your actual landing time, 45 minutes on other pickups.',
  },
  {
    label: 'Your chauffeur',
    body: 'Meets you inside arrivals with a name board and walks you to the vehicle.',
  },
] as const

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
}

interface Booking {
  booking_number: string
  trip_number?: string | null
  booking_status: string
  payment_status?: string | null
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
}

/**
 * The status mark. One component for all three outcomes: only the stroke colour and the glyph
 * change, and three near-identical 40-line copies had already started to disagree on stroke width.
 *
 * `animate` is ALWAYS supplied. The previous `animate={skip ? undefined : ...}` idiom looks
 * equivalent and is not: useReducedMotion() is false during SSR, so `pathLength: 0, opacity: 0`
 * is serialised into the markup, and with no `animate` to run after hydration flips the flag a
 * reduced-motion visitor is left staring at an invisible confirmation mark.
 */
function StatusMark({
  reduceMotion,
  stroke,
  path,
}: {
  reduceMotion: boolean
  stroke: string
  path: string
}) {
  return (
    <div className="mb-7 flex justify-center">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true" className="block">
        <motion.circle
          cx="32"
          cy="32"
          r="28"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: reduceMotion ? 1 : 0, opacity: reduceMotion ? 1 : 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: EASE_LUXURY }}
        />
        <motion.path
          d={path}
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: reduceMotion ? 1 : 0, opacity: reduceMotion ? 1 : 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : 0.55, ease: EASE_LUXURY }}
        />
      </svg>
    </div>
  )
}

/**
 * One stop on the route rail. DESIGN.md section 5 names the Itinerary Block as the product's
 * signature and requires the confirmation to re-use it; this screen was the last one still
 * drawing the journey as two sibling label/value cells, which states both ends and never the
 * direction between them. The rail is typographic per that spec: dots and a hairline, no icons.
 */
function RouteStop({
  label,
  address,
  terminal,
  reduceMotion,
}: {
  label: string
  address: string
  terminal?: boolean
  reduceMotion: boolean
}) {
  return (
    <li className="relative pl-7">
      {/* Dot sits on the optical centre of the LABEL line (10px type at 1.2 => 6px), not the
          address, so the rail stays true when a long address wraps to two lines. */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-[1.5px] h-[9px] w-[9px] rounded-full border border-[var(--gold-text)] ${
          terminal ? 'bg-[var(--gold-text)]' : 'bg-[var(--black-rich)]'
        }`}
      />
      {!terminal && (
        // Runs from this dot's underside into the next dot, so it must clear the 1.25rem list
        // gap plus that dot's own top offset. Scales from the origin it starts at.
        <motion.span
          aria-hidden="true"
          className="absolute bottom-[-1.4rem] left-[4px] top-[10.5px] w-px origin-top bg-[var(--graphite)]"
          initial={{ scaleY: reduceMotion ? 1 : 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.45, ease: EASE_LUXURY }}
        />
      )}
      <p className={CARD_LABEL}>{label}</p>
      <p className={SEGMENT_VALUE}>{address}</p>
    </li>
  )
}

/** A label/value pair in the passenger card. Kept as a grid cell, not a card. */
function Field({
  label,
  value,
  className,
  numeric = false,
}: {
  label: string
  value: React.ReactNode
  className?: string
  numeric?: boolean
}) {
  return (
    <div className={`min-w-0 ${className ?? ''}`}>
      <dt className={CARD_LABEL}>{label}</dt>
      <dd className={`${numeric ? 'numeric ' : ''}${SEGMENT_VALUE}`}>{value}</dd>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="min-w-0 truncate text-[0.875rem] text-[var(--text-secondary)]">{label}</dt>
      <dd className="numeric shrink-0 text-[0.875rem] text-[var(--text-primary)]">{value}</dd>
    </div>
  )
}

/** The reassurance rail. Hairline rows, no badges: trust here is the absence of a badge. */
function GuaranteeList() {
  return (
    <section aria-labelledby="guarantees-heading">
      <h2 id="guarantees-heading" className={CARD_LABEL_STRONG}>
        Included with every transfer
      </h2>
      <dl className="mt-5 flex flex-col">
        {GUARANTEES.map((item) => (
          <div key={item.label} className="mb-4 border-b border-[var(--graphite)] pb-4 last:mb-0">
            <dt className={CARD_LABEL}>{item.label}</dt>
            <dd className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
              {item.body}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function CardMotion({
  children,
  reduceMotion,
  delay,
  className,
  ...rest
}: {
  children: React.ReactNode
  reduceMotion: boolean
  delay: number
  className?: string
  id?: string
  'aria-labelledby'?: string
}) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : delay, ease: EASE_LUXURY }}
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
      headline: 'Transfer cancelled.',
      body: 'This booking has been cancelled. If you believe this is an error, please contact support.',
      showPricing: false,
      showGuarantees: false,
      markStroke: 'var(--text-muted)',
      markPath: MARK_CROSS,
    }
  }
  if (status === 'completed') {
    return {
      eyebrow: 'Completed',
      headline: 'Transfer completed.',
      body: 'We hope you had a pleasant journey. Thank you for choosing Infinia Transfers.',
      showPricing: true,
      showGuarantees: false,
      markStroke: 'var(--text-secondary)',
      markPath: MARK_CHECK,
    }
  }
  if (status === 'pending') {
    return {
      eyebrow: 'Pending',
      headline: 'Booking pending.',
      body: 'Your booking is being processed. You will receive a confirmation once it is approved.',
      showPricing: true,
      showGuarantees: true,
      markStroke: 'var(--text-secondary)',
      markPath: MARK_CHECK,
    }
  }
  return {
    eyebrow: 'Confirmed',
    headline: (
      <>
        Your transfer is <em>booked.</em>
      </>
    ),
    body: null,
    showPricing: true,
    showGuarantees: true,
    // --gold-text, not --gold. The raw brand gold holds #c6aa88 in both themes, which washes out
    // against the light ground; --gold-text darkens to #6b5530 there and stays #c6aa88 on dark.
    markStroke: 'var(--gold-text)',
    markPath: MARK_CHECK,
  }
}

export function ConfirmationContent({
  booking,
  primaryPassenger,
  childSeats,
  addons,
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

  /**
   * The same figure without its currency code. Seven repetitions of "AED" down the ledger's right
   * edge were noise and broke the tabular column; the code is stated once, on the card header.
   * Composed from the exported conversion helpers rather than re-deriving the rate maths.
   */
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
  const statusConfig = getStatusConfig(booking.booking_status)
  const reference = booking.trip_number || booking.booking_number

  // Only worth showing when the party isn't all adults. Otherwise it just restates passenger_count.
  // Legacy bookings were backfilled to all-adults, so they render exactly as they did before.
  const guestSummary =
    booking.adults != null && (booking.children ?? 0) + (booking.infants ?? 0) > 0
      ? formatGuestSummary({
          adults: booking.adults,
          children: booking.children ?? 0,
          infants: booking.infants ?? 0,
        })
      : null

  // "5 / 5" read as a capacity warning rather than a count, and a bare "4" under "Bags included"
  // carried no unit at all. The vehicle segment states both in words instead.
  const partySummary = [
    `${booking.passenger_count} passenger${booking.passenger_count === 1 ? '' : 's'}`,
    booking.vehicle_type?.luggage_capacity
      ? `${booking.vehicle_type.luggage_capacity} bag${booking.vehicle_type.luggage_capacity === 1 ? '' : 's'}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

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
          {childSeats.map((seat, idx) => (
            <SummaryRow
              key={`seat-${idx}`}
              label={`${seat.amenity_type === 'child_seat_infant' ? 'Infant seat' : 'Booster seat'}${(seat.quantity ?? 1) > 1 ? ` × ${seat.quantity}` : ''}`}
              value={formatUserAmount(seat.price)}
            />
          ))}
          {addons.map((addon, idx) => (
            <SummaryRow
              key={`addon-${idx}`}
              label={`${addon.addon?.name || 'Add-on'}${(addon.quantity ?? 1) > 1 ? ` × ${addon.quantity}` : ''}${formatChildAges(addon.child_ages)}`}
              value={formatUserAmount(addon.price)}
            />
          ))}
        </dl>
      </div>

      {/* The total band, matching booking-ledger.tsx exactly. The customer has now seen this
          treatment on checkout and on payment; drawing it a third way here was the last place
          the same ledger disagreed with itself. */}
      <div className={`${BAND} border-t border-[rgba(var(--gold-rgb),0.15)] bg-[rgba(var(--gold-rgb),0.03)]`}>
        <div className="flex items-baseline justify-between gap-3">
          <span className={CARD_LABEL_STRONG}>Total paid</span>
          <span className="t-price">{formatUserPrice(booking.total_price)}</span>
        </div>
        {/* The strongest claim the business has, stated where the number is. */}
        <p className="mt-2.5 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
          Includes the vehicle, chauffeur, fuel, tolls and parking. No surge, no tip prompt.
        </p>
        {isConverted && (
          <p className="mt-2 flex items-start gap-2 text-[0.75rem] text-[var(--text-muted)]">
            <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            <span>
              Shown in {currentCurrency}. Charged in AED ({formatPrice(booking.total_price ?? 0, 'AED', exchangeRates)}).
            </span>
          </p>
        )}
      </div>
    </div>
  )

  return (
    // No min-h-screen: this sits inside `main.pt-20`, so it forced every booking, however short,
    // to overflow the viewport by the header height plus the footer.
    <div className="bg-[var(--black-void)] pb-[clamp(4rem,9vw,6.5rem)] pt-[clamp(3rem,7vw,5rem)]">
      <div className="luxury-container max-w-6xl">

        {/* Hero */}
        <motion.header
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: EASE_LUXURY }}
        >
          <StatusMark reduceMotion={reduceMotion} stroke={statusConfig.markStroke} path={statusConfig.markPath} />

          {/* The system's own eyebrow device, gold rule included, instead of a hand-rolled copy. */}
          <p className="editorial-eyebrow justify-center">{statusConfig.eyebrow}</p>

          <h1 className="editorial-headline mt-5 text-[clamp(2.25rem,5vw,3.75rem)] [text-wrap:balance]">
            {statusConfig.headline}
          </h1>

          {statusConfig.body ? (
            <p className="mx-auto mt-5 max-w-[46ch] text-[1rem] leading-relaxed text-[var(--text-secondary)]">
              {statusConfig.body}
            </p>
          ) : (
            <p className="mx-auto mt-5 max-w-[46ch] text-[1rem] leading-relaxed text-[var(--text-secondary)]">
              A confirmation has been sent to{' '}
              <span className="text-[var(--text-primary)]">{primaryPassenger?.email || 'your email'}</span>.
              Your chauffeur will contact you 30 minutes before pickup.
            </p>
          )}

          {/* The reference is the one string a traveller reads back to a driver or a hotel desk,
              and it was set at eyebrow size in muted grey beside the status word. Per DESIGN.md's
              Numerals-Are-Display rule it gets the Numeric role and a line of its own. The extra
              tracking keeps a long alphanumeric code reading as a code, not as a word. */}
          <div className="mt-8 flex flex-col items-center">
            <p className={CARD_LABEL}>Booking reference</p>
            <p className="numeric mt-2 text-[1.0625rem] tracking-[0.08em] text-[var(--text-primary)]">
              {reference}
            </p>
          </div>

          {/* Ranked, not paired. Copying the reference is the act of this moment; the invoice is a
              later, deliberate one, so it steps down to the text-link treatment. */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 print:hidden">
            <button onClick={copyBookingNumber} className={GHOST_BUTTON} aria-label="Copy booking reference">
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy reference'}
            </button>
            {isPaid && (
              <InvoiceDownloadButton
                bookingNumber={booking.booking_number}
                invoiceNumber={reference}
                className="editorial-action min-h-[44px]"
              />
            )}
          </div>
        </motion.header>

        {/* Content zone: two-column */}
        <div className="mt-[clamp(3rem,7vw,4.5rem)] flex flex-col items-start gap-8 lg:flex-row lg:gap-10">

          {/* Main column. gap-8 against the cards' py-5 bands so card-to-card separation reads
              louder than band-to-band separation; at space-y-6 the two were indistinguishable. */}
          <div className="min-w-0 flex-1 space-y-8">

            {/* Itinerary. The signature block: route rail, then one hairline-separated segment
                per fact. */}
            <CardMotion reduceMotion={reduceMotion} delay={0.1} aria-labelledby="itinerary-heading" className={CARD}>
              <div className={`${BAND} border-b border-[rgba(var(--gold-rgb),0.1)]`}>
                <h2 id="itinerary-heading" className={CARD_LABEL}>Itinerary</h2>
              </div>

              <div className={BAND}>
                <ol className="space-y-5">
                  <RouteStop label="Pickup" address={booking.pickup_address} reduceMotion={reduceMotion} />
                  <RouteStop label="Destination" address={booking.dropoff_address} terminal reduceMotion={reduceMotion} />
                </ol>
              </div>

              {/* A departure is one fact. Date and time sat in separate grid columns, which made
                  the reader reassemble them. */}
              <div className={`${BAND_DIVIDER} ${BAND}`}>
                <p className={CARD_LABEL}>Departure</p>
                <p className={`numeric ${SEGMENT_VALUE}`}>
                  {pickupDate ? `${formatDate(pickupDate)} · ${formatTime(pickupDate)}` : 'To be confirmed'}
                </p>
              </div>

              {booking.vehicle_type && (
                <div className={`${BAND_DIVIDER} ${BAND}`}>
                  <p className={CARD_LABEL}>Vehicle</p>
                  {/* No thumbnail. The Itinerary Block is typographic by definition and DESIGN.md
                      section 6 rules out car icons; a 72x48 stamp of a premium vehicle read as a
                      thumbnail, which undersells the car rather than evidencing it. */}
                  <p className="mt-1.5 text-[1.125rem] font-medium leading-snug text-[var(--text-primary)]">
                    {booking.vehicle_type.name}
                  </p>
                  <p className={SEGMENT_CAPTION}>{partySummary}</p>
                  {guestSummary && <p className={SEGMENT_CAPTION}>{guestSummary}</p>}
                </div>
              )}
            </CardMotion>

            {/* Passenger details */}
            {primaryPassenger && (
              <CardMotion reduceMotion={reduceMotion} delay={0.15} aria-labelledby="passenger-heading" className={CARD}>
                <div className={`${BAND} border-b border-[rgba(var(--gold-rgb),0.1)]`}>
                  <h2 id="passenger-heading" className={CARD_LABEL}>Passenger details</h2>
                </div>
                <div className={BAND}>
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                    <Field label="Name" value={`${primaryPassenger.first_name} ${primaryPassenger.last_name}`} />
                    <Field label="Phone" value={primaryPassenger.phone} numeric />
                    <Field label="Email" value={primaryPassenger.email} className="sm:col-span-2" />
                  </dl>
                </div>
              </CardMotion>
            )}

            {/* Customer notes (conditional) */}
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

            {/* Payment summary, mobile position */}
            {statusConfig.showPricing && (
              <motion.div
                className="lg:hidden"
                role="region"
                aria-label="Payment summary"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.25, ease: EASE_LUXURY }}
              >
                {pricingCard}
              </motion.div>
            )}

            {/* What happens next. 01 and 02 are a genuine sequence and keep their numerals;
                cancellation is a standing policy, so numbering it made the device decorative and
                buried the support route inside step 03's indent. It now sits at the card foot,
                on the card's own padding edge. */}
            <CardMotion reduceMotion={reduceMotion} delay={0.25} aria-labelledby="next-heading" className={CARD}>
              <div className={`${BAND} border-b border-[rgba(var(--gold-rgb),0.1)]`}>
                <h2 id="next-heading" className={CARD_LABEL}>What happens next</h2>
              </div>

              <div className={BAND}>
                <ol className="space-y-4 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
                  <li className="flex gap-4">
                    <span aria-hidden="true" className="numeric shrink-0 text-[0.75rem] tracking-[0.14em] text-[var(--gold-text)]">01</span>
                    <span>Be ready at your pickup location 5 minutes before the scheduled time.</span>
                  </li>
                  <li className="flex gap-4">
                    <span aria-hidden="true" className="numeric shrink-0 text-[0.75rem] tracking-[0.14em] text-[var(--gold-text)]">02</span>
                    <span>Your chauffeur will wait up to 15 minutes past the scheduled pickup (60 minutes for airport pickups).</span>
                  </li>
                </ol>
              </div>

              {/* Stacked, not a justify-between row: the main column is narrower than the text
                  plus the button, so a row wrapped the sentence one word early and left a ragged
                  "for any changes." on its own line. */}
              <div className={`${BAND_DIVIDER} ${BAND} flex flex-col items-start gap-4`}>
                <p className="text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
                  Free cancellation up to 24 hours before pickup. Contact us for any changes.
                </p>
                <a href="mailto:info@infiniatransfers.com" className={`${GHOST_BUTTON} print:hidden`}>
                  Email support
                </a>
              </div>
            </CardMotion>
          </div>

          {/* Payment summary and reassurance rail. Desktop only. */}
          {statusConfig.showPricing && (
            <motion.aside
              className="hidden w-[380px] flex-shrink-0 lg:sticky lg:top-24 lg:block xl:w-[420px]"
              aria-label="Payment summary"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.15, ease: EASE_LUXURY }}
            >
              {pricingCard}
              {/* The rail used to stop here, leaving the right half of the page empty beside three
                  stacked cards. These three facts are what a just-charged customer wants next. */}
              {statusConfig.showGuarantees && (
                <div className="mt-8">
                  <GuaranteeList />
                </div>
              )}
            </motion.aside>
          )}
        </div>

        {/* Mobile reassurance, following the ledger into the main flow. Gated on the same flag as
            the desktop rail, and on status: every claim here is future tense, so a completed trip
            would be told its chauffeur "meets you inside arrivals" and a cancelled one would be
            sold a cancellation policy it has already used. */}
        {statusConfig.showGuarantees && (
          <motion.div
            className="mt-8 lg:hidden"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.3, ease: EASE_LUXURY }}
          >
            <GuaranteeList />
          </motion.div>
        )}

        {/* Closing. Centred on the hero's measure: the page opened on the centre axis and used to
            end left-aligned against nothing, with the sign-off orphaned below the buttons. */}
        <motion.div
          className="mx-auto mt-[clamp(3rem,7vw,4.5rem)] max-w-2xl border-t border-[var(--graphite)] pt-10 text-center print:hidden"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.35, ease: EASE_LUXURY }}
        >
          <p className="text-[0.9375rem] text-[var(--text-secondary)]">We look forward to welcoming you.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <Link href="/account" className="btn btn-primary">
              View my bookings
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/" className="editorial-action min-h-[44px]">
              Book another transfer
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
