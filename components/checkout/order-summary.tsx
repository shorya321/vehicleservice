'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Briefcase
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

  const duration = route.estimated_duration_minutes
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

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
    <div className="space-y-6">
      {/* Order Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vehicle Info */}
          <div className="space-y-3">
            <div className="relative h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
              {vehicleType.image_url && (
                <Image
                  src={vehicleType.image_url}
                  alt={vehicleType.name}
                  fill
                  className="object-contain p-2"
                />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{vehicleType.name}</h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {vehicleType.passenger_capacity} seats
                </span>
                <span className="flex items-center gap-1">
                  <Car className="h-3.5 w-3.5" />
                  {vehicleType.luggage_capacity} luggage
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Route Details */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-medium">{route.origin.name}</p>
                </div>
                <div className="border-l-2 border-dashed border-muted ml-2 h-4" />
                <div>
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="font-medium">{route.destination.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {durationText}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {passengers} passenger{passengers > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {luggage} bag{luggage !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <Separator />

          {/* Promo Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Promo Code</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={applyPromoCode}
              >
                Apply
              </Button>
            </div>
            {promoApplied && (
              <p className="text-sm text-green-600">Promo code applied!</p>
            )}
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Base Fare</span>
              <span>{formatCurrency(basePrice)}</span>
            </div>
            {childSeatsCost > 0 && (
              <div className="flex justify-between text-sm">
                <span>Child Seats ({infantSeats + boosterSeats} total)</span>
                <span>{formatCurrency(childSeatsCost)}</span>
              </div>
            )}
            {extraLuggageCost > 0 && (
              <div className="flex justify-between text-sm">
                <span>Extra Luggage ({extraLuggageCount} bag{extraLuggageCount > 1 ? 's' : ''})</span>
                <span>{formatCurrency(extraLuggageCost)}</span>
              </div>
            )}
            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Promo Discount</span>
                <span>-{formatCurrency(promoDiscount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Badges */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <p className="text-sm">Secure SSL Payment</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <p className="text-sm">24/7 Customer Support</p>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-purple-600" />
              <p className="text-sm">Best Price Guarantee</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Need Help */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-3">Need Help?</h4>
          <div className="space-y-2 text-sm">
            <p>Email: support@transfer.com</p>
            <p>Phone: +1 234 567 8900</p>
            <p>Available 24/7</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}