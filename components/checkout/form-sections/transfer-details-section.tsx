'use client'

import { UseFormReturn } from 'react-hook-form'
import { motion } from 'motion/react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Users, Plane, ArrowRight, Briefcase } from 'lucide-react'
import { RouteDetails, VehicleTypeDetails } from '@/app/checkout/actions'

interface TransferDetailsSectionProps {
  form: UseFormReturn<any>
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  passengers: number
  setPassengers: (value: number) => void
  onDateTimeChange?: (date: string, time: string) => void
}

/**
 * Transfer Details Section Component
 *
 * Displays and manages:
 * - Route card with pickup and drop-off locations
 * - Selected vehicle card with image and specs
 * - Date and time selection
 * - Flight number (optional)
 * - Passenger count with increment/decrement controls
 *
 * @component
 */
export function TransferDetailsSection({
  form,
  route,
  vehicleType,
  passengers,
  setPassengers,
  onDateTimeChange
}: TransferDetailsSectionProps) {
  const { register, formState: { errors }, watch } = form

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    const currentTime = watch('pickupTime')
    onDateTimeChange?.(newDate, currentTime)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentDate = watch('pickupDate')
    const newTime = e.target.value
    onDateTimeChange?.(currentDate, newTime)
  }

  return (
    <motion.div
      className="checkout-form-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Section Header */}
      <div className="checkout-section-header">
        <span className="checkout-section-number">1</span>
        <h2 className="checkout-section-title">Transfer Details</h2>
        <MapPin className="checkout-section-icon" />
      </div>

      {/* Section Content */}
      <div className="checkout-section-content space-y-6">
        {/* Route Card */}
        <div className="checkout-transfer-route">
          <div className="checkout-route-point">
            <span className="checkout-route-label">Pickup</span>
            <p className="checkout-route-name">{route.origin.name}</p>
            {route.origin.city && (
              <span className="checkout-route-city">{route.origin.city}</span>
            )}
          </div>

          <div className="checkout-route-connector">
            <div className="checkout-route-connector-icon">
              <ArrowRight className="h-4 w-4 text-[#c6aa88]" />
            </div>
            {route.distance_km && (
              <span className="checkout-route-distance">{route.distance_km} km</span>
            )}
          </div>

          <div className="checkout-route-point">
            <span className="checkout-route-label">Drop-off</span>
            <p className="checkout-route-name">{route.destination.name}</p>
            {route.destination.city && (
              <span className="checkout-route-city">{route.destination.city}</span>
            )}
          </div>
        </div>

        {/* Vehicle Selected Card */}
        <div className="checkout-vehicle-selected">
          {vehicleType.image_url && (
            <div className="relative w-[140px] h-[90px] flex-shrink-0 rounded-lg overflow-hidden bg-[#161514]">
              <Image
                src={vehicleType.image_url}
                alt={vehicleType.name}
                fill
                className="object-contain p-2"
              />
            </div>
          )}
          <div className="checkout-vehicle-info">
            <span className="checkout-vehicle-category">{vehicleType.category || 'Premium'}</span>
            <h3 className="checkout-vehicle-name">{vehicleType.name}</h3>
            <div className="checkout-vehicle-specs">
              <span className="checkout-vehicle-spec">
                <Users className="h-4 w-4 text-[#c6aa88]" />
                {vehicleType.passenger_capacity} seats
              </span>
              <span className="checkout-vehicle-spec">
                <Briefcase className="h-4 w-4 text-[#c6aa88]" />
                {vehicleType.luggage_capacity} bags
              </span>
            </div>
          </div>
          <button
            type="button"
            className="checkout-vehicle-change"
            onClick={() => window.history.back()}
          >
            Change
          </button>
        </div>

        {/* Date and Time */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pickupDate" className="flex items-center gap-2 mb-3 text-[#b8b4ae] text-sm">
              <Calendar className="h-4 w-4 text-[#c6aa88]" aria-hidden="true" />
              Pickup Date
            </Label>
            <Input
              id="pickupDate"
              type="date"
              className="h-14 bg-[#1f1e1c]/50 border-[#c6aa88]/20 text-[#f8f6f3] focus:ring-2 focus:ring-[#c6aa88] focus:border-[#c6aa88]"
              {...register('pickupDate')}
              min={new Date().toISOString().split('T')[0]}
              onChange={handleDateChange}
            />
            {errors.pickupDate && (
              <p className="text-sm text-red-500 mt-1">{errors.pickupDate.message as string}</p>
            )}
          </div>
          <div>
            <Label htmlFor="pickupTime" className="flex items-center gap-2 mb-3 text-[#b8b4ae] text-sm">
              <Clock className="h-4 w-4 text-[#c6aa88]" aria-hidden="true" />
              Pickup Time
            </Label>
            <Input
              id="pickupTime"
              type="time"
              className="h-14 bg-[#1f1e1c]/50 border-[#c6aa88]/20 text-[#f8f6f3] focus:ring-2 focus:ring-[#c6aa88] focus:border-[#c6aa88]"
              {...register('pickupTime')}
              onChange={handleTimeChange}
            />
            {errors.pickupTime && (
              <p className="text-sm text-red-500 mt-1">{errors.pickupTime.message as string}</p>
            )}
          </div>
        </div>

        {/* Flight Number (Optional) */}
        <div>
          <Label htmlFor="flightNumber" className="flex items-center gap-2 mb-3 text-[#b8b4ae] text-sm">
            <Plane className="h-4 w-4 text-[#c6aa88]" aria-hidden="true" />
            Flight Number (Optional)
          </Label>
          <Input
            id="flightNumber"
            placeholder="e.g., EK 123"
            className="h-14 bg-[#1f1e1c]/50 border-[#c6aa88]/20 text-[#f8f6f3] placeholder:text-[#7a7672]/50 focus:ring-2 focus:ring-[#c6aa88] focus:border-[#c6aa88]"
            {...register('flightNumber')}
          />
          <p className="text-xs text-[#7a7672] mt-2">We&apos;ll track your flight for delays</p>
        </div>

        {/* Passengers */}
        <div>
          <Label className="flex items-center gap-2 mb-3 text-[#b8b4ae] text-sm">
            <Users className="h-4 w-4 text-[#c6aa88]" aria-hidden="true" />
            Number of Passengers
          </Label>
          <div className="flex items-center gap-4 p-4 bg-[#1f1e1c]/30 border border-[#c6aa88]/10 rounded-lg">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12 border-[#c6aa88]/30 hover:bg-[#c6aa88] hover:text-[#050506] hover:border-[#c6aa88] text-[#f8f6f3]"
              onClick={() => setPassengers(Math.max(1, passengers - 1))}
              disabled={passengers <= 1}
              aria-label="Decrease passenger count"
            >
              -
            </Button>
            <span className="w-20 text-center font-serif text-2xl text-[#f8f6f3]">
              {passengers}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12 border-[#c6aa88]/30 hover:bg-[#c6aa88] hover:text-[#050506] hover:border-[#c6aa88] text-[#f8f6f3]"
              onClick={() => setPassengers(Math.min(vehicleType.passenger_capacity, passengers + 1))}
              disabled={passengers >= vehicleType.passenger_capacity}
              aria-label="Increase passenger count"
            >
              +
            </Button>
            <span className="text-sm text-[#7a7672] ml-2">
              Max: {vehicleType.passenger_capacity}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

TransferDetailsSection.displayName = 'TransferDetailsSection'
