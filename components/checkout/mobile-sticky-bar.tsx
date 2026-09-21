'use client'

import { useState, memo, useEffect, useRef } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import { ArrowRight, Lock, ChevronUp, ChevronDown, Tag, Check } from 'lucide-react'
import { RouteDetails, VehicleTypeDetails } from '@/app/checkout/actions'
import { OrderSummaryAddon } from './checkout-wrapper'
import { BookingLedger } from './booking-ledger'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import type { GuestBreakdown } from '@/components/home/hero/guest-breakdown'
import type { CheckoutPriceBreakdown, CheckoutTrip } from '@/lib/trips/checkout-trip'
import { tripLedgerOverrides, type LegSchedule } from './trip-ledger-props'

/**
 * Pickup wall-clock plus the route's estimate, as a wall-clock string. Same arithmetic as
 * OrderSummary's: both ends are already in the operating timezone, so a Date would only invite
 * a zone shift.
 */
function arrivalClock(pickupTime?: string, durationMinutes?: number | null): string | null {
  if (!pickupTime || !durationMinutes) return null
  const [h, m] = pickupTime.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  const total = h * 60 + m + durationMinutes
  const hh = Math.floor(total / 60) % 24
  return `${String(hh).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

interface MobileStickyBarProps {
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  totalPrice: number
  basePrice: number
  passengers: number
  /** The adults/children/infants behind that count, so the drawer states the same split the
      desktop card does. */
  guests?: GuestBreakdown
  pickupDate?: string
  pickupTime?: string
  selectedAddons: OrderSummaryAddon[]
  /** Only wired on the extras step, exactly as the desktop card has it. */
  onRemoveAddon?: (addonId: string) => void
  onContinue: () => void
  onSubmit: () => void
  isSubmitting: boolean
  isLastStep: boolean
  agreeToTerms: boolean
  onAgreeToTermsChange: (checked: boolean) => void
  /** Trip-type checkout. Absent for one way, whose drawer is unchanged. */
  trip?: CheckoutTrip
  pricing?: CheckoutPriceBreakdown
  schedule?: LegSchedule[]
}

export const MobileStickyBar = memo(function MobileStickyBar({
  route,
  vehicleType,
  totalPrice,
  basePrice,
  passengers,
  guests,
  pickupDate,
  pickupTime,
  selectedAddons,
  onRemoveAddon,
  onContinue,
  onSubmit,
  isSubmitting,
  isLastStep,
  agreeToTerms,
  onAgreeToTermsChange,
  trip,
  pricing,
  schedule = [],
}: MobileStickyBarProps) {
  const reduceMotion = useReducedMotion()
  const { currentCurrency, exchangeRates } = useCurrency()
  const formatUserPrice = (amount: number) => formatPrice(amount, currentCurrency, exchangeRates)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [showPromo, setShowPromo] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  /* `--sticky-bar-h` is what the form column pads itself by so the bar does not cover the
     last field. It was read but never defined, so the 7rem fallback always won, and the
     bar is taller than that once the terms checkbox appears on the last step. Publish the
     real height instead. Set on the root so the wrapper can read it without a re-render. */
  useEffect(() => {
    const node = barRef.current
    if (!node) return

    const root = document.documentElement
    const observer = new ResizeObserver(([entry]) => {
      root.style.setProperty('--sticky-bar-h', `${entry.target.getBoundingClientRect().height}px`)
    })
    observer.observe(node)

    return () => {
      observer.disconnect()
      root.style.removeProperty('--sticky-bar-h')
    }
  }, [])

  const formattedDate = pickupDate
    ? new Date(pickupDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : ''

  const arrival = arrivalClock(pickupTime, route.estimated_duration_minutes)
  const total = totalPrice - promoDiscount
  const overrides = trip && pricing
    ? tripLedgerOverrides(trip, pricing, selectedAddons, pickupTime, schedule)
    : null

  /* The same development-only stub the desktop card carries. Neither one touches the server
     price: createBooking re-derives the fare from zone pricing on submit. */
  const applyPromoCode = () => {
    if (process.env.NODE_ENV === 'development' && promoCode.toUpperCase() === 'SAVE10') {
      setPromoDiscount(basePrice * 0.1)
      setPromoApplied(true)
    } else {
      setPromoDiscount(0)
      setPromoApplied(false)
    }
  }

  return (
    <motion.div
      ref={barRef}
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-[rgba(var(--gold-rgb),0.12)] bg-[var(--charcoal)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      // `animate` is ALWAYS supplied. The `reduceMotion ? undefined` idiom looks
      // equivalent and is not: useReducedMotion() is false during SSR, so the
      // offscreen state is serialised into the markup and never animated back
      // once hydration flips the flag. Reduced motion collapses offset+duration.
      initial={{ y: reduceMotion ? 0 : 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="px-4 py-3 space-y-3">
        {/* Route + Price + Toggle Row */}
        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          aria-expanded={detailsOpen}
          aria-controls="mobile-itinerary-drawer"
          className="flex w-full items-center justify-between gap-2"
        >
          <div className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)] truncate mr-3">
            <span className="truncate">{route.origin.name}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-[var(--gold-text)]" aria-hidden="true" />
            <span className="truncate">{route.destination.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-medium tabular-nums text-[var(--text-primary)]">
              {formatUserPrice(total)}
            </span>
            {detailsOpen ? (
              <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
            ) : (
              <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
            )}
          </div>
        </button>

        {/* Expandable Itinerary Drawer */}
        <AnimatePresence>
          {detailsOpen && (
            <motion.div
              id="mobile-itinerary-drawer"
              initial={{ opacity: 0, gridTemplateRows: '0fr' }}
              animate={{ opacity: 1, gridTemplateRows: '1fr' }}
              exit={{ opacity: 0, gridTemplateRows: '0fr' }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="grid"
            >
              <div className="overflow-hidden min-h-0">
                {/* The desktop card, verbatim, at drawer density. It used to be a hand-rolled
                    label/value list that had drifted: no category, no seats or bags, no
                    duration, a bare passenger count instead of the guest split, no pickup or
                    arrival, no promo, no "what the fare includes", and addons that could be
                    added on this step but only removed on the other one. Rendering the same
                    component is what stops the two surfaces disagreeing again. */}
                <div className="mt-3 overflow-hidden rounded-[8px] border border-[var(--stub-line)] bg-[var(--stub-bot)] bg-gradient-to-b from-[var(--stub-top)] to-[var(--stub-bot)]">
                  <div className="checkout-stub-cap !px-4 !pt-3">
                    <h2 id="mobile-summary-heading" className="checkout-section-title editorial-eyebrow--pill"><i aria-hidden="true" />{overrides?.heading ?? 'Your transfer'}</h2>
                    {(route.distance_km || route.estimated_duration_minutes) ? (
                      <span className="checkout-stub-ref">
                        {route.distance_km ? `${Math.round(route.distance_km)} km` : ''}
                        {route.distance_km && route.estimated_duration_minutes ? ' \u00b7 ' : ''}
                        {route.estimated_duration_minutes ? `${route.estimated_duration_minutes} min` : ''}
                      </span>
                    ) : null}
                  </div>

                  <BookingLedger
                    density="compact"
                    category={vehicleType.category}
                    vehicleName={vehicleType.name}
                    originName={route.origin.name}
                    destinationName={overrides?.destinationName ?? route.destination.name}
                    dateLabel={formattedDate}
                    timeLabel={pickupTime}
                    passengers={passengers}
                    guestBreakdown={guests ?? null}
                    luggage={vehicleType.luggage_capacity}
                    seats={vehicleType.passenger_capacity}
                    pickupNote={pickupTime ? `Pickup ${pickupTime}` : null}
                    arrivalNote={overrides && overrides.arrivalNote !== undefined ? overrides.arrivalNote : arrival ? `Arrive about ${arrival}` : null}
                    alwaysShowBase
                    basePrice={basePrice}
                    baseLabel={overrides?.baseLabel}
                    legs={overrides?.legs}
                    tripDiscount={overrides?.tripDiscount}
                    addonNote={overrides?.addonNote}
                    addons={overrides?.addons ?? selectedAddons}
                    promoDiscount={promoDiscount}
                    total={total}
                    onRemoveAddon={onRemoveAddon}
                  />

                  {/* Promo code, the same compact toggle the card carries. */}
                  <div className="border-t border-[var(--stub-line)] px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setShowPromo(!showPromo)}
                      aria-expanded={showPromo}
                      className="flex items-center gap-2 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] transition-colors hover:text-[var(--gold-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--stub-bot)]"
                    >
                      <Tag className="h-3 w-3" aria-hidden="true" />
                      Have a code?
                      {showPromo ? <ChevronUp className="h-3 w-3" aria-hidden="true" /> : <ChevronDown className="h-3 w-3" aria-hidden="true" />}
                    </button>

                    {showPromo && (
                      <div className="mt-3 flex gap-2">
                        <input
                          placeholder="Enter code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          aria-label="Promo code"
                          className="h-10 flex-1 rounded border border-[var(--graphite)] bg-[var(--black-warm)] px-3 text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-[border,box-shadow] duration-200 focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/15"
                        />
                        <button
                          type="button"
                          onClick={applyPromoCode}
                          className="h-10 rounded border border-[var(--graphite)] px-4 text-[0.75rem] font-medium text-[var(--gold-text)] transition-colors hover:bg-[var(--charcoal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--stub-bot)]"
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    <div aria-live="polite" aria-atomic="true">
                      {promoApplied && (
                        <p className="mt-2.5 flex items-center gap-1.5 text-[0.75rem] text-[var(--gold-text)]">
                          <Check className="h-3 w-3" aria-hidden="true" />
                          Promo applied
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terms + CTA for last step */}
        {isLastStep && (
          <label htmlFor="mobile-agree-terms" className="flex cursor-pointer items-start gap-3">
            <input
              id="mobile-agree-terms"
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => onAgreeToTermsChange(e.target.checked)}
              className="checkout-checkbox mt-0.5"
            />
            <span className="text-[0.75rem] leading-relaxed text-[var(--text-secondary)]">
              I agree to the{' '}
              <a href="/terms" className="text-[var(--gold-text)] hover:text-[var(--text-primary)] transition-colors">Terms</a>
              {' '}and{' '}
              <a href="/privacy" className="text-[var(--gold-text)] hover:text-[var(--text-primary)] transition-colors">Privacy Policy</a>.
            </span>
          </label>
        )}

        {/* CTA Button */}
        {isLastStep ? (
          <button
            type="button"
            disabled={isSubmitting || !agreeToTerms}
            onClick={onSubmit}
            className="checkout-btn-primary w-full"
          >
            {isSubmitting ? (
              'Processing'
            ) : (
              <>
                Proceed to payment
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            className="checkout-btn-primary w-full"
          >
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        {/* The desktop reassurance block sits far below the fold on mobile, where it does
            no work at the moment of decision. Carry one line of it in the bar instead. */}
        {/* Tier 3: sentence case, matching the desktop card. An uppercase tracked line is a
            label treatment, and this is a sentence. */}
        <p className="flex items-center justify-center gap-2 text-[0.75rem] text-[var(--text-muted)]">
          <Lock className="h-3 w-3 text-[var(--gold-text)]" aria-hidden="true" />
          {/* Matches OrderSummary's line on the same step: the desktop card merged its two
              stacked reassurances ("You won't be charged yet" above "ENCRYPTED · SSL SECURE")
              into one, and the two surfaces must not now say different things. */}
          {isLastStep ? 'Encrypted · you are not charged yet' : 'Free cancellation · 24h'}
        </p>
      </div>
    </motion.div>
  )
})
