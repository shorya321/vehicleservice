'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Calendar,
  Clock,
  Users,
  Tag,
  Shield,
  Lock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Check,
  Briefcase,
  Info
} from 'lucide-react'
import { RouteDetails, VehicleTypeDetails } from '@/app/checkout/actions'
import { cn } from '@/lib/utils'
import { OrderSummaryAddon } from './checkout-wrapper'
import { formatPrice } from '@/lib/currency/format'

interface OrderSummaryProps {
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  passengers: number
  luggage: number
  infantSeats?: number
  boosterSeats?: number
  pickupDate?: string
  pickupTime?: string
  onSubmit?: () => void
  isSubmitting?: boolean
  agreeToTerms?: boolean
  onAgreeToTermsChange?: (checked: boolean) => void
  selectedAddons?: OrderSummaryAddon[]
  currentCurrency?: string
  exchangeRates?: Record<string, number>
}

export function OrderSummary({
  route,
  vehicleType,
  passengers,
  luggage,
  infantSeats = 0,
  boosterSeats = 0,
  pickupDate,
  pickupTime,
  onSubmit,
  isSubmitting = false,
  agreeToTerms = false,
  onAgreeToTermsChange,
  selectedAddons = [],
  currentCurrency = 'AED',
  exchangeRates = {},
}: OrderSummaryProps) {
  // Helper function to format price in user's currency
  const formatUserPrice = (amount: number) => formatPrice(amount, currentCurrency, exchangeRates)
  const isConverted = currentCurrency !== 'AED'
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [showPromo, setShowPromo] = useState(false)

  // Calculate prices including all extras
  const basePrice = vehicleType.price || 50
  const extraLuggageCount = Math.max(0, luggage - vehicleType.luggage_capacity)
  const extraLuggageCost = extraLuggageCount * 15 // $15 per extra bag
  const childSeatsCost = (infantSeats + boosterSeats) * 10 // $10 per seat
  const addonsCost = selectedAddons.reduce((sum, addon) => sum + addon.total_price, 0)
  const subtotal = basePrice + extraLuggageCost + childSeatsCost + addonsCost
  const discount = promoDiscount
  const total = subtotal - discount

  // Format date and time
  const formattedDate = pickupDate
    ? new Date(pickupDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    : ''

  const formattedTime = pickupTime
    ? pickupTime
    : ''

  const applyPromoCode = () => {
    // Simplified promo code logic
    if (promoCode.toUpperCase() === 'SAVE10') {
      setPromoDiscount(basePrice * 0.1)
      setPromoApplied(true)
    } else {
      setPromoDiscount(0)
      setPromoApplied(false)
    }
  }

  return (
    <motion.div
      className="checkout-summary-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="checkout-summary-header">
        <h2 className="checkout-summary-title">Order Summary</h2>
      </div>

      {/* Content */}
      <div className="checkout-summary-content">
        {/* Vehicle Info */}
        <div className="checkout-summary-vehicle">
          {vehicleType.image_url && (
            <div className="relative w-20 h-[55px] rounded-lg overflow-hidden bg-[#161514] flex-shrink-0">
              <Image
                src={vehicleType.image_url}
                alt={vehicleType.name}
                fill
                className="object-contain p-1"
              />
            </div>
          )}
          <div className="checkout-summary-vehicle-info">
            <span className="checkout-summary-vehicle-category">
              {vehicleType.category || 'Premium'}
            </span>
            <p className="checkout-summary-vehicle-name">{vehicleType.name}</p>
          </div>
        </div>

        {/* Route Info */}
        <div className="checkout-summary-route">
          <div className="checkout-summary-route-item">
            <div className="checkout-summary-route-dot pickup" />
            <div className="checkout-summary-route-text">
              <span className="checkout-summary-route-label">Pickup</span>
              <p className="checkout-summary-route-name">{route.origin.name}</p>
            </div>
          </div>
          <div className="checkout-summary-route-item">
            <div className="checkout-summary-route-dot dropoff" />
            <div className="checkout-summary-route-text">
              <span className="checkout-summary-route-label">Drop-off</span>
              <p className="checkout-summary-route-name">{route.destination.name}</p>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="checkout-summary-details">
          {formattedDate && (
            <div className="checkout-summary-detail">
              <Calendar className="h-4 w-4 text-[#c6aa88]" />
              <span>{formattedDate}</span>
            </div>
          )}
          {formattedTime && (
            <div className="checkout-summary-detail">
              <Clock className="h-4 w-4 text-[#c6aa88]" />
              <span>{formattedTime}</span>
            </div>
          )}
          <div className="checkout-summary-detail">
            <Users className="h-4 w-4 text-[#c6aa88]" />
            <span>{passengers} passengers</span>
          </div>
          <div className="checkout-summary-detail">
            <Briefcase className="h-4 w-4 text-[#c6aa88]" />
            <span>{luggage} bags</span>
          </div>
        </div>

        {/* Promo Code */}
        <div className="checkout-promo-section">
          <button
            type="button"
            className="checkout-promo-toggle"
            onClick={() => setShowPromo(!showPromo)}
          >
            <Tag className="h-4 w-4" />
            Have a promo code?
            {showPromo ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <div className={cn("checkout-promo-form", showPromo && "visible")}>
            <Input
              placeholder="Enter code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 h-12 bg-[#1f1e1c]/50 border-[#c6aa88]/20 text-[#f8f6f3] placeholder:text-[#7a7672]/50"
            />
            <Button
              type="button"
              variant="outline"
              onClick={applyPromoCode}
              className="h-12 px-4 border-[#c6aa88]/30 text-[#c6aa88] hover:bg-[#c6aa88] hover:text-[#050506]"
            >
              Apply
            </Button>
          </div>
          {promoApplied && (
            <p className="text-sm text-green-400 mt-2 flex items-center gap-1">
              <Check className="h-4 w-4" />
              Promo code applied!
            </p>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="checkout-price-breakdown">
          <div className="checkout-price-row">
            <span className="checkout-price-label">Base Fare</span>
            <span className="checkout-price-value">{formatUserPrice(basePrice)}</span>
          </div>
          {childSeatsCost > 0 && (
            <div className="checkout-price-row">
              <span className="checkout-price-label">Child Seats ({infantSeats + boosterSeats})</span>
              <span className="checkout-price-value">{formatUserPrice(childSeatsCost)}</span>
            </div>
          )}
          {extraLuggageCost > 0 && (
            <div className="checkout-price-row">
              <span className="checkout-price-label">Extra Luggage ({extraLuggageCount})</span>
              <span className="checkout-price-value">{formatUserPrice(extraLuggageCost)}</span>
            </div>
          )}
          {selectedAddons.map((addon) => (
            <div key={addon.id} className="checkout-price-row">
              <span className="checkout-price-label">
                {addon.name}{addon.quantity > 1 ? ` (×${addon.quantity})` : ''}
              </span>
              <span className="checkout-price-value">{formatUserPrice(addon.total_price)}</span>
            </div>
          ))}
          {promoDiscount > 0 && (
            <div className="checkout-price-row discount">
              <span className="checkout-price-label">Promo Discount</span>
              <span className="checkout-price-value">-{formatUserPrice(promoDiscount)}</span>
            </div>
          )}
          {addonsCost > 0 && (
            <div className="checkout-price-row">
              <span className="checkout-price-label">Services Total</span>
              <span className="checkout-price-value">{formatUserPrice(addonsCost)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="checkout-price-total">
          <span className="checkout-total-label">Total</span>
          <span className="checkout-total-value">{formatUserPrice(total)}</span>
        </div>

        {/* Currency Notice */}
        {isConverted && (
          <div className="flex items-start gap-2 mt-3 text-xs text-[#7a7672]">
            <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>
              Prices shown in {currentCurrency}. Payment will be processed in AED ({formatPrice(total, 'AED', exchangeRates)}).
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="checkout-summary-footer">
        {/* Terms Checkbox - if onAgreeToTermsChange is provided */}
        {onAgreeToTermsChange && (
          <label className="checkout-terms-checkbox">
            <Checkbox
              checked={agreeToTerms}
              onCheckedChange={onAgreeToTermsChange}
              className="border-[#c6aa88]/30 data-[state=checked]:bg-[#c6aa88] data-[state=checked]:border-[#c6aa88]"
            />
            <span className="checkout-terms-checkbox-label">
              I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
            </span>
          </label>
        )}

        {/* Book Button - if onSubmit is provided */}
        {onSubmit && (
          <button
            type="submit"
            className="checkout-btn-book"
            disabled={isSubmitting || !agreeToTerms}
            onClick={onSubmit}
          >
            {isSubmitting ? (
              'Processing...'
            ) : (
              <>
                Confirm Booking
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        )}

        {/* Trust Badges */}
        <div className="checkout-trust-badges">
          <div className="checkout-trust-badge">
            <Shield className="h-4 w-4 text-[#c6aa88]" />
            <span>SSL Secure</span>
          </div>
          <div className="checkout-trust-badge">
            <Lock className="h-4 w-4 text-[#c6aa88]" />
            <span>Encrypted</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
