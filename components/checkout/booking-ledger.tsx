'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Info, X } from 'lucide-react'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import { RouteConnector } from '@/app/search/results/components/route-connector'
import {
  CARD_LABEL,
  CARD_LABEL_STRONG,
  BAND,
  BAND_DIVIDER,
} from '@/components/booking/itinerary-primitives'

export interface LedgerAddon {
  id: string
  name: string
  quantity: number
  total_price: number
}

interface BookingLedgerProps {
  category?: string | null
  vehicleName: string
  originName: string
  destinationName: string
  /** Pre-formatted in the operating timezone by the caller. */
  dateLabel?: string
  timeLabel?: string
  passengers: number
  luggage?: number | null
  /** Seats the vehicle has, as opposed to `passengers`, the number travelling. Stated on the
      stub's vehicle band, above the tear, because it describes the product rather than the trip. */
  seats?: number | null
  /** Adults/children/infants, where the caller knows the split. The trip's guest line reads
      better as the real breakdown than as a single total, and a 6-pax booking with 2 infants is
      a materially different trip from six adults. Falls back to `{passengers} pax`. */
  guestBreakdown?: { adults: number; children: number; infants: number } | null
  /** Pickup and arrival, pre-formatted by the caller in the operating timezone. */
  pickupNote?: string | null
  arrivalNote?: string | null
  /** Checkout shows `Base fare` from the start, so the ledger is a ledger before any extra is
      added. The payment page keeps the original behaviour: no breakdown until there is one. */
  alwaysShowBase?: boolean
  /** Kilometres, where the route has a figure. The checkout header used to carry this
      on its own; the card is now its only home, so it must not silently vanish. */
  distanceKm?: number | null
  /** Minutes, where the route has an estimate. Same guard as `distanceKm`: a zone pair has
      none, and "0 min" is worse than silence. */
  durationMinutes?: number | null
  basePrice: number
  addons?: LedgerAddon[]
  promoDiscount?: number
  total: number
  /** Omitted on the payment step, where the booking is already created and priced. */
  onRemoveAddon?: (addonId: string) => void
  /**
   * `compact` tightens every band for the mobile drawer, which is 390px wide and sits inside a
   * fixed bar. Same bands, same order, same content: only the padding changes, so the phone and
   * the desktop card cannot drift apart in what they state.
   */
  density?: 'comfortable' | 'compact'
}

/**
 * Row entrance/exit. Motion propagates the active variant label to child motion components, so
 * the value's colour settle below rides on the same labels without needing to know whether the
 * row is new — `AnimatePresence initial={false}` already answers that.
 */
const ROW_VARIANTS = {
  initial: { opacity: 0, height: 0, y: -4 },
  animate: { opacity: 1, height: 'auto', y: 0 },
  exit: { opacity: 0, height: 0, y: -4 },
}

const ROW_VARIANTS_REDUCED = {
  initial: { opacity: 0, height: 0, y: 0 },
  animate: { opacity: 1, height: 'auto', y: 0 },
  exit: { opacity: 0, height: 0, y: 0 },
}

/** Gold on arrival, settling to the resting ink. The second of gold's two permitted jobs. */
const VALUE_VARIANTS = {
  initial: { color: 'var(--gold-text)' },
  animate: { color: 'var(--text-primary)' },
}

function LedgerRow({
  label,
  value,
  tone,
  onRemove,
  removeLabel,
  animateValue = false,
}: {
  label: string
  value: string
  tone?: 'positive'
  onRemove?: () => void
  removeLabel?: string
  /** Only the rows inside AnimatePresence, which supplies the variant labels. */
  animateValue?: boolean
}) {
  const reduceMotion = useReducedMotion()

  const valueClass = `font-medium tabular-nums ${
    tone === 'positive' ? 'text-[var(--gold-text)]' : 'text-[var(--text-primary)]'
  }`

  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="flex items-baseline gap-1.5 shrink-0">
        {animateValue && !reduceMotion ? (
          <motion.span
            variants={VALUE_VARIANTS}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-medium tabular-nums"
          >
            {value}
          </motion.span>
        ) : (
          <span className={valueClass}>{value}</span>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] text-[var(--text-muted)] transition-colors hover:text-[var(--gold-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </span>
    </div>
  )
}

/**
 * The summary card's body: vehicle header, itemised ledger, total band.
 *
 * Extracted so the checkout's OrderSummary and the payment page's aside stop drawing the same
 * booking two different ways. They previously disagreed on the route (an arrow line here, bullet
 * dots and icon chips there) and, more importantly, on when to show a breakdown at all: this side
 * suppressed `Base fare` while it equalled the total, the payment side printed `110.00 / 110.00`.
 *
 * Renders bands, not a container. The caller supplies the bordered card so it can append its own
 * sections (promo, terms, CTA) after the total.
 */
export function BookingLedger({
  category,
  vehicleName,
  originName,
  destinationName,
  dateLabel,
  timeLabel,
  passengers,
  luggage,
  seats,
  guestBreakdown,
  pickupNote,
  arrivalNote,
  alwaysShowBase = false,
  distanceKm,
  durationMinutes,
  basePrice,
  addons = [],
  promoDiscount = 0,
  total,
  onRemoveAddon,
  density = 'comfortable',
}: BookingLedgerProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const reduceMotion = useReducedMotion()

  const band = density === 'compact' ? 'px-4 py-3.5' : BAND

  const formatUserPrice = (amount: number) => formatPrice(amount, currentCurrency, exchangeRates)
  const isConverted = currentCurrency !== 'AED'

  // A single row repeating the number directly below it reads as a broken breakdown, not a
  // simple one, so the block only appears once there is something to break down.
  const hasBreakdown = alwaysShowBase || addons.length > 0 || promoDiscount > 0

  return (
    <>
      {/* Above the tear: the product. */}
      <div className={`${band} pb-4`}>
        {category && <div className={CARD_LABEL}>{category}</div>}
        <h2 className="mt-1 text-[1.375rem] font-semibold text-[var(--text-primary)]">
          {vehicleName}
        </h2>

        {(seats || luggage) && (
          <div className="checkout-stub-specs">
            {seats ? <span>{seats} seats</span> : null}
            {/* A booking with no luggage recorded should say nothing, not "0 bags". */}
            {luggage ? <span>{luggage} bags</span> : null}
          </div>
        )}
      </div>

      {/* The tear. Decorative: it marks where the vehicle stops and the journey starts, which
          is the one division the customer already has in their head. */}
      <div className="checkout-stub-perf" aria-hidden="true">
        <span />
        <span />
      </div>

      {/* Below the tear: the journey. The connector is the search page's, drawn once more so
          the trip is the same object it was on the results. */}
      <div className={`${band} pt-2`}>
        <div className="checkout-stub-route">
          <span className="checkout-stub-route__place">
            <span className="checkout-stub-route__name">{originName}</span>
            {pickupNote ? <span className="checkout-stub-route__note">{pickupNote}</span> : null}
          </span>
          <RouteConnector />
          <span className="checkout-stub-route__place">
            <span className="checkout-stub-route__name">{destinationName}</span>
            {arrivalNote ? <span className="checkout-stub-route__note">{arrivalNote}</span> : null}
          </span>
        </div>

        <div className="checkout-stub-facts">
          {(dateLabel || timeLabel) && (
            <span>
              <strong>
                {dateLabel}
                {dateLabel && timeLabel ? ' · ' : ''}
                {timeLabel}
              </strong>
            </span>
          )}
          {guestBreakdown ? (
            <>
              <span>{guestBreakdown.adults} adults</span>
              {guestBreakdown.children ? <span>{guestBreakdown.children} children</span> : null}
              {guestBreakdown.infants ? <span>{guestBreakdown.infants} infants</span> : null}
            </>
          ) : (
            <span>{passengers} pax</span>
          )}
          {/* Distance and duration ride in the stub's cap on checkout. Where a caller has no cap
              to put them in, they belong here. */}
          {distanceKm ? <span>{distanceKm} km</span> : null}
          {durationMinutes ? <span>{durationMinutes} min</span> : null}
        </div>
      </div>

      {hasBreakdown && (
        <div className={`${BAND_DIVIDER} ${band} text-[0.875rem]`}>
          <LedgerRow label="Base fare" value={formatUserPrice(basePrice)} />

          {/* `initial={false}` so rows already present when the card mounts render at rest;
              rows added later run initial -> animate and get both the slide and the gold
              settle. Height animates on the wrapper and the spacing lives inside it, so a
              removed row takes its gap with it instead of leaving a hole. */}
          <AnimatePresence initial={false}>
            {addons.map((addon) => (
              <motion.div
                key={addon.id}
                className="overflow-hidden"
                variants={reduceMotion ? ROW_VARIANTS_REDUCED : ROW_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="pt-2.5">
                  <LedgerRow
                    label={`${addon.name}${addon.quantity > 1 ? ` × ${addon.quantity}` : ''}`}
                    value={formatUserPrice(addon.total_price)}
                    animateValue
                    onRemove={onRemoveAddon ? () => onRemoveAddon(addon.id) : undefined}
                    removeLabel={`Remove ${addon.name}`}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {promoDiscount > 0 && (
            <div className="pt-2.5">
              <LedgerRow
                label="Promo discount"
                value={`−${formatUserPrice(promoDiscount)}`}
                tone="positive"
              />
            </div>
          )}
        </div>
      )}

      <div className={`border-t border-[rgba(var(--gold-rgb),0.15)] bg-[rgba(var(--gold-rgb),0.03)] ${band}`}>
        <div className="flex items-baseline justify-between gap-3">
          <span className={CARD_LABEL_STRONG}>Total</span>
          <motion.span
            key={total}
            className="t-price inline-block"
            initial={{
              scale: reduceMotion ? 1 : 1.04,
              color: reduceMotion ? 'var(--text-primary)' : 'var(--gold-text)',
            }}
            animate={{ scale: 1, color: 'var(--text-primary)' }}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {formatUserPrice(total)}
          </motion.span>
        </div>
        {/* The strongest claim the business has, stated where the number is. */}
        <p className="mt-2.5 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
          Includes the vehicle, chauffeur, fuel, tolls and parking. No surge, no tip prompt.
        </p>
        {isConverted && (
          <p className="mt-2 flex items-start gap-2 text-[0.75rem] text-[var(--text-muted)]">
            <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            <span>
              Shown in {currentCurrency}. Charged in AED ({formatPrice(total, 'AED', exchangeRates)}).
            </span>
          </p>
        )}
      </div>
    </>
  )
}

BookingLedger.displayName = 'BookingLedger'
