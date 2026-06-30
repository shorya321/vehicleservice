'use client'

import { useState, memo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Tag, ChevronDown, ChevronUp, ArrowRight, Check, Info, Lock } from 'lucide-react'
import { RouteDetails, VehicleTypeDetails, ExtraItemPrices } from '@/app/checkout/actions'
import { OrderSummaryAddon } from './checkout-wrapper'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'

interface OrderSummaryProps {
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  passengers: number
  luggage: number
  infantSeats?: number
  boosterSeats?: number
  pickupDate?: string
  pickupTime?: string
  currentStep?: number
  onSubmit?: () => void
  isSubmitting?: boolean
  agreeToTerms?: boolean
  onAgreeToTermsChange?: (checked: boolean) => void
  selectedAddons?: OrderSummaryAddon[]
  extraItemPrices?: ExtraItemPrices
}

function PriceRow({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'positive'
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span
        className={
          tone === 'positive'
            ? 'font-medium tabular-nums text-[var(--gold-text)]'
            : 'font-medium tabular-nums text-[var(--text-primary)]'
        }
      >
        {value}
      </span>
    </div>
  )
}

export const OrderSummary = memo(function OrderSummary({
  route,
  vehicleType,
  passengers,
  luggage,
  infantSeats = 0,
  boosterSeats = 0,
  pickupDate,
  pickupTime,
  currentStep,
  onSubmit,
  isSubmitting = false,
  agreeToTerms = false,
  onAgreeToTermsChange,
  selectedAddons = [],
  extraItemPrices,
}: OrderSummaryProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const reduceMotion = useReducedMotion()

  const formatUserPrice = (amount: number) => formatPrice(amount, currentCurrency, exchangeRates)
  const isConverted = currentCurrency !== 'AED'

  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [showPromo, setShowPromo] = useState(false)

  const basePrice = vehicleType.price || 50
  const extraLuggageCount = Math.max(0, luggage - vehicleType.luggage_capacity)
  const extraLuggageCost = extraLuggageCount * (extraItemPrices?.extraLuggagePerUnit ?? 15)
  const childSeatsCost = (infantSeats + boosterSeats) * (extraItemPrices?.childSeatPerUnit ?? 10)
  const addonsCost = selectedAddons.reduce((sum, addon) => sum + addon.total_price, 0)
  const subtotal = basePrice + extraLuggageCost + childSeatsCost + addonsCost
  const total = subtotal - promoDiscount

  const formattedDate = pickupDate
    ? new Date(pickupDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : ''

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
    <motion.aside
      aria-label="Order summary"
      className="bg-[var(--black-rich)] border border-[rgba(var(--gold-rgb),0.12)] rounded-[8px] overflow-hidden"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Vehicle + Route Header */}
      <div className="px-6 xl:px-8 py-5">
        <div className="text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {vehicleType.category}
        </div>
        <h2 className="mt-1 text-[1.375rem] font-semibold text-[var(--text-primary)]">
          {vehicleType.name}
        </h2>

        <div className="mt-4 flex items-center gap-1.5 text-[0.875rem] text-[var(--text-secondary)]">
          <span>{route.origin.name}</span>
          <ArrowRight className="h-3 w-3 shrink-0 text-[var(--gold-text)]" aria-hidden="true" />
          <span>{route.destination.name}</span>
        </div>

        {(formattedDate || pickupTime) && (
          <div className="mt-1.5 text-[0.875rem] tabular-nums text-[var(--text-muted)]">
            {formattedDate}{formattedDate && pickupTime ? ' · ' : ''}{pickupTime}
          </div>
        )}

        <div className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
          {passengers} pax · {vehicleType.luggage_capacity} bags
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="border-t border-[rgba(var(--gold-rgb),0.1)] px-6 xl:px-8 py-5 space-y-2.5 text-[0.875rem]">
        <PriceRow label="Base fare" value={formatUserPrice(basePrice)} />
        {childSeatsCost > 0 && (
          <PriceRow
            label={`Child seats (${infantSeats + boosterSeats})`}
            value={formatUserPrice(childSeatsCost)}
          />
        )}
        {extraLuggageCost > 0 && (
          <PriceRow
            label={`Extra luggage (${extraLuggageCount})`}
            value={formatUserPrice(extraLuggageCost)}
          />
        )}
        {selectedAddons.map((addon) => (
          <PriceRow
            key={addon.id}
            label={`${addon.name}${addon.quantity > 1 ? ` × ${addon.quantity}` : ''}`}
            value={formatUserPrice(addon.total_price)}
          />
        ))}
        {promoDiscount > 0 && (
          <PriceRow
            label="Promo discount"
            value={`−${formatUserPrice(promoDiscount)}`}
            tone="positive"
          />
        )}
      </div>

      {/* Total */}
      <div className="border-t border-[rgba(var(--gold-rgb),0.15)] bg-[rgba(var(--gold-rgb),0.03)] px-6 xl:px-8 py-5">
        <div className="flex items-baseline justify-between">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            Total
          </span>
          <motion.span
            key={total}
            className="text-[1.75rem] font-medium tabular-nums tracking-tight text-[var(--text-primary)] inline-block"
            initial={reduceMotion ? false : { scale: 1.04, color: 'var(--gold-text)' }}
            animate={reduceMotion ? undefined : { scale: 1, color: 'var(--text-primary)' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {formatUserPrice(total)}
          </motion.span>
        </div>
        {isConverted && (
          <p className="mt-2 flex items-start gap-2 text-[0.75rem] text-[var(--text-muted)]">
            <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            <span>
              Shown in {currentCurrency}. Charged in AED ({formatPrice(total, 'AED', exchangeRates)}).
            </span>
          </p>
        )}
      </div>

      {/* Promo Code — compact toggle */}
      <div className="border-t border-[rgba(var(--gold-rgb),0.1)] px-6 xl:px-8 py-4">
        <button
          type="button"
          onClick={() => setShowPromo(!showPromo)}
          aria-expanded={showPromo}
          className="flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)] hover:text-[var(--gold-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]"
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
              className="flex-1 h-10 bg-[var(--black-warm)] border border-[var(--graphite)] rounded px-3 text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/15 transition-[border,box-shadow] duration-200"
            />
            <button
              type="button"
              onClick={applyPromoCode}
              className="h-10 px-4 text-[0.75rem] font-medium border border-[var(--graphite)] rounded text-[var(--gold-text)] hover:bg-[var(--charcoal)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]"
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

      {/* Footer */}
      <footer className="border-t border-[rgba(var(--gold-rgb),0.1)] px-6 xl:px-8 py-5 space-y-4">
        {(currentStep === undefined || currentStep === 1) ? (
          <>
            {onAgreeToTermsChange && (
              <label htmlFor="agree-terms" className="flex cursor-pointer items-start gap-3">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => onAgreeToTermsChange(e.target.checked)}
                  className="checkout-checkbox mt-0.5"
                />
                <span className="text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
                  I agree to the{' '}
                  <a href="/terms" className="text-[var(--gold-text)] hover:text-[var(--text-primary)] transition-colors">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-[var(--gold-text)] hover:text-[var(--text-primary)] transition-colors">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
            )}

            {onSubmit && (
              <button
                type="submit"
                disabled={isSubmitting || !agreeToTerms}
                onClick={onSubmit}
                className="checkout-btn-primary w-full"
                aria-describedby={!agreeToTerms ? 'submit-disabled-reason' : undefined}
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
            )}

            {!agreeToTerms && (
              <p id="submit-disabled-reason" className="sr-only">
                Accept the terms and privacy policy to continue
              </p>
            )}

            <p className="text-center text-[0.75rem] text-[var(--text-muted)]">
              You won&apos;t be charged yet
            </p>
          </>
        ) : (
          <p className="text-center text-[0.8125rem] text-[var(--text-muted)]">
            Complete all steps to proceed
          </p>
        )}

        <p className="flex items-center justify-center gap-2 text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          <Lock className="h-3 w-3 text-[var(--gold-text)]" aria-hidden="true" />
          Encrypted · SSL secure
        </p>
      </footer>
    </motion.aside>
  )
})
