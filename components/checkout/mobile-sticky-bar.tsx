'use client'

import { useState, memo } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import { ArrowRight, Lock, ChevronUp, ChevronDown } from 'lucide-react'
import { RouteDetails, VehicleTypeDetails, ExtraItemPrices } from '@/app/checkout/actions'
import { OrderSummaryAddon } from './checkout-wrapper'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'

interface MobileStickyBarProps {
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  totalPrice: number
  basePrice: number
  passengers: number
  luggage: number
  pickupDate?: string
  pickupTime?: string
  selectedAddons: OrderSummaryAddon[]
  onContinue: () => void
  onSubmit: () => void
  isSubmitting: boolean
  isLastStep: boolean
  agreeToTerms: boolean
  onAgreeToTermsChange: (checked: boolean) => void
  extraItemPrices?: ExtraItemPrices
}

export const MobileStickyBar = memo(function MobileStickyBar({
  route,
  vehicleType,
  totalPrice,
  basePrice,
  passengers,
  luggage,
  pickupDate,
  pickupTime,
  selectedAddons,
  onContinue,
  onSubmit,
  isSubmitting,
  isLastStep,
  agreeToTerms,
  onAgreeToTermsChange,
  extraItemPrices,
}: MobileStickyBarProps) {
  const reduceMotion = useReducedMotion()
  const { currentCurrency, exchangeRates } = useCurrency()
  const formatUserPrice = (amount: number) => formatPrice(amount, currentCurrency, exchangeRates)

  const [detailsOpen, setDetailsOpen] = useState(false)

  const extraLuggageCount = Math.max(0, luggage - vehicleType.luggage_capacity)
  const extraLuggageCost = extraLuggageCount * (extraItemPrices?.extraLuggagePerUnit ?? 15)

  const formattedDate = pickupDate
    ? new Date(pickupDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : ''

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-[rgba(var(--gold-rgb),0.12)] bg-[var(--charcoal)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      initial={reduceMotion ? false : { y: 60, opacity: 0 }}
      animate={reduceMotion ? undefined : { y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
              {formatUserPrice(totalPrice)}
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
              initial={reduceMotion ? false : { opacity: 0, gridTemplateRows: '0fr' }}
              animate={reduceMotion ? undefined : { opacity: 1, gridTemplateRows: '1fr' }}
              exit={reduceMotion ? undefined : { opacity: 0, gridTemplateRows: '0fr' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="grid"
            >
              <div className="overflow-hidden min-h-0">
                <div className="border-t border-[rgba(var(--gold-rgb),0.1)] pt-3 space-y-2">
                  {/* Itinerary Details */}
                  <dl className="space-y-0 text-[0.8125rem]">
                    {[
                      { label: 'Vehicle', value: vehicleType.name },
                      ...(formattedDate ? [{ label: 'Date', value: formattedDate }] : []),
                      ...(pickupTime ? [{ label: 'Time', value: pickupTime }] : []),
                      { label: 'Passengers', value: String(passengers) },
                      { label: 'Luggage', value: String(luggage) },
                    ].map((item, index) => (
                      <div
                        key={item.label}
                        className={`flex items-baseline justify-between ${index > 0 ? 'mt-1.5 pt-1.5 border-t border-[rgba(var(--gold-rgb),0.06)]' : ''}`}
                      >
                        <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
                          {item.label}
                        </dt>
                        <dd className="font-medium tabular-nums text-[var(--text-primary)]">
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {/* Price Breakdown */}
                  <div className="border-t border-[rgba(var(--gold-rgb),0.1)] pt-2 space-y-1.5 text-[0.8125rem]">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Base fare</span>
                      <span className="font-medium tabular-nums text-[var(--text-primary)]">{formatUserPrice(basePrice)}</span>
                    </div>
                    {extraLuggageCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Extra luggage ({extraLuggageCount})</span>
                        <span className="font-medium tabular-nums text-[var(--text-primary)]">{formatUserPrice(extraLuggageCost)}</span>
                      </div>
                    )}
                    {selectedAddons.map((addon) => (
                      <div key={addon.id} className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">
                          {addon.name}{addon.quantity > 1 ? ` × ${addon.quantity}` : ''}
                        </span>
                        <span className="font-medium tabular-nums text-[var(--text-primary)]">{formatUserPrice(addon.total_price)}</span>
                      </div>
                    ))}
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

        {/* Security note on last step */}
        {isLastStep && (
          <p className="flex items-center justify-center gap-2 text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <Lock className="h-3 w-3 text-[var(--gold-text)]" aria-hidden="true" />
            Encrypted · SSL secure
          </p>
        )}
      </div>
    </motion.div>
  )
})
