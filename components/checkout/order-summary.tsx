'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  Calendar,
  Users,
  Car,
  Tag,
  Shield,
  Clock,
  ChevronRight,
  Briefcase,
  Route,
  Luggage
} from 'lucide-react'
import { RouteDetails, VehicleTypeDetails } from '@/app/checkout/actions'
import { formatCurrency } from '@/lib/utils'

interface OrderSummaryProps {
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  passengers: number
  luggage: number
  infantSeats?: number
  boosterSeats?: number
}

export function OrderSummary({ route, vehicleType, passengers, luggage, infantSeats = 0, boosterSeats = 0 }: OrderSummaryProps) {
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)

  // Calculate prices including all extras
  const basePrice = vehicleType.price || 50
  const extraLuggageCount = Math.max(0, luggage - vehicleType.luggage_capacity)
  const extraLuggageCost = extraLuggageCount * 15 // $15 per extra bag
  const childSeatsCost = (infantSeats + boosterSeats) * 10 // $10 per seat
  const subtotal = basePrice + extraLuggageCost + childSeatsCost
  const discount = promoDiscount
  const total = subtotal - discount

  // Display distance instead of duration
  const distanceText = route.distance_km ? `${route.distance_km} km` : 'Distance N/A'

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
        className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg sticky top-24"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-br from-luxury-gold/10 to-transparent p-6 border-b border-luxury-gold/20">
          <h2 className="font-serif text-3xl text-luxury-pearl">Order Summary</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Vehicle Info */}
          <div className="space-y-4">
            <div className="relative h-40 bg-gradient-to-br from-luxury-black/60 to-luxury-darkGray/60 backdrop-blur-sm border border-luxury-gold/10 rounded-lg overflow-hidden">
              {vehicleType.image_url && (
                <Image
                  src={vehicleType.image_url}
                  alt={vehicleType.name}
                  fill
                  className="object-contain p-3"
                />
              )}
            </div>
            <div>
              <h3 className="font-sans font-semibold text-lg text-luxury-pearl">{vehicleType.name}</h3>
              <div className="flex items-center gap-4 text-sm text-luxury-lightGray mt-2">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
                  {vehicleType.passenger_capacity} seats
                </span>
                <span className="flex items-center gap-1.5">
                  <Car className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
                  {vehicleType.luggage_capacity} luggage
                </span>
              </div>
            </div>
          </div>

          <Separator className="border-luxury-gold/10" />

          {/* Route Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-1" style={{ color: "#C6AA88" }} aria-hidden="true" />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-luxury-lightGray uppercase tracking-wider mb-1">From</p>
                  <p className="font-medium text-luxury-pearl">{route.origin.name}</p>
                </div>
                <div className="border-l-2 border-dashed border-luxury-gold/30 ml-2 h-4" />
                <div>
                  <p className="text-xs text-luxury-lightGray uppercase tracking-wider mb-1">To</p>
                  <p className="font-medium text-luxury-pearl">{route.destination.name}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-luxury-lightGray">
              <span className="flex items-center gap-1.5">
                <Route className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
                {distanceText}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
                {passengers} passenger{passengers > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
                {luggage} bag{luggage !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <Separator className="border-luxury-gold/10" />

          {/* Promo Code */}
          <div className="space-y-3">
            <label className="text-xs text-luxury-lightGray uppercase tracking-wider">Promo Code</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1 h-14 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
              />
              <Button
                type="button"
                variant="outline"
                onClick={applyPromoCode}
                className="h-14 px-6 border-luxury-gold/30 hover:bg-luxury-gold hover:text-luxury-black uppercase tracking-wider"
              >
                Apply
              </Button>
            </div>
            {promoApplied && (
              <p className="text-sm text-luxury-gold">✓ Promo code applied!</p>
            )}
          </div>

          <Separator className="border-luxury-gold/10" />

          {/* Price Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-luxury-lightGray">
              <span>Base Fare</span>
              <span className="text-luxury-pearl">{formatCurrency(basePrice)}</span>
            </div>
            {childSeatsCost > 0 && (
              <div className="flex justify-between text-sm text-luxury-lightGray">
                <span>Child Seats ({infantSeats + boosterSeats} total)</span>
                <span className="text-luxury-pearl">{formatCurrency(childSeatsCost)}</span>
              </div>
            )}
            {extraLuggageCost > 0 && (
              <div className="flex justify-between text-sm text-luxury-lightGray">
                <span>Extra Luggage ({extraLuggageCount} bag{extraLuggageCount > 1 ? 's' : ''})</span>
                <span className="text-luxury-pearl">{formatCurrency(extraLuggageCost)}</span>
              </div>
            )}
            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm text-luxury-gold">
                <span>Promo Discount</span>
                <span>-{formatCurrency(promoDiscount)}</span>
              </div>
            )}
            <Separator className="border-luxury-gold/20" />
            <div className="flex justify-between font-semibold text-xl pt-2">
              <span className="text-luxury-pearl">Total</span>
              <span className="text-luxury-gold font-serif">{formatCurrency(total)}</span>
            </div>
          </div>

          <Separator className="border-luxury-gold/10" />

          {/* Trust Badges */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
              <p className="text-sm text-luxury-lightGray">Secure SSL Payment</p>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
              <p className="text-sm text-luxury-lightGray">24/7 Customer Support</p>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
              <p className="text-sm text-luxury-lightGray">Best Price Guarantee</p>
            </div>
          </div>
        </div>
      </motion.div>
  )
}