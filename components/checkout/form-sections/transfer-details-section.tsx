'use client'

import { UseFormReturn } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import { RouteDetails, VehicleTypeDetails } from '@/app/checkout/actions'

interface TransferDetailsSectionProps {
  form: UseFormReturn<any>
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  passengers: number
  setPassengers: (value: number) => void
}

/**
 * Transfer Details Section Component
 *
 * Displays and manages:
 * - Pickup and drop-off locations
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
  setPassengers
}: TransferDetailsSectionProps) {
  const { register, formState: { errors } } = form

  return (
    <motion.div
      className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-6 md:p-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="font-serif text-3xl text-luxury-pearl mb-6">Transfer Details</h2>

      <div className="space-y-6">
        {/* Route Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2 mb-2 text-luxury-lightGray">
              <MapPin className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
              Pickup Location
            </Label>
            <div className="p-4 backdrop-blur-sm bg-luxury-black/30 border border-luxury-gold/10 rounded-md">
              <p className="font-medium text-luxury-pearl">{route.origin.name}</p>
              {route.origin.city && (
                <p className="text-sm text-luxury-lightGray mt-1">{route.origin.city}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-2 mb-2 text-luxury-lightGray">
              <MapPin className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
              Drop-off Location
            </Label>
            <div className="p-4 backdrop-blur-sm bg-luxury-black/30 border border-luxury-gold/10 rounded-md">
              <p className="font-medium text-luxury-pearl">{route.destination.name}</p>
              {route.destination.city && (
                <p className="text-sm text-luxury-lightGray mt-1">{route.destination.city}</p>
              )}
            </div>
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pickupDate" className="flex items-center gap-2 mb-2 text-luxury-lightGray">
              <Calendar className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
              Pickup Date
            </Label>
            <Input
              id="pickupDate"
              type="date"
              className="h-14 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
              {...register('pickupDate')}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.pickupDate && (
              <p className="text-sm text-red-500 mt-1">{errors.pickupDate.message as string}</p>
            )}
          </div>
          <div>
            <Label htmlFor="pickupTime" className="flex items-center gap-2 mb-2 text-luxury-lightGray">
              <Clock className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
              Pickup Time
            </Label>
            <Input
              id="pickupTime"
              type="time"
              className="h-14 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
              {...register('pickupTime')}
            />
            {errors.pickupTime && (
              <p className="text-sm text-red-500 mt-1">{errors.pickupTime.message as string}</p>
            )}
          </div>
        </div>

        {/* Flight Number (Optional) */}
        <div>
          <Label htmlFor="flightNumber" className="mb-2 block text-luxury-lightGray">
            Flight Number (Optional)
          </Label>
          <Input
            id="flightNumber"
            placeholder="e.g., AA123"
            className="h-14 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
            {...register('flightNumber')}
          />
        </div>

        {/* Passengers */}
        <div>
          <Label className="flex items-center gap-2 mb-3 text-luxury-lightGray">
            <Users className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
            Number of Passengers
          </Label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12 border-luxury-gold/30 hover:bg-luxury-gold hover:text-luxury-black"
              onClick={() => setPassengers(Math.max(1, passengers - 1))}
              disabled={passengers <= 1}
              aria-label="Decrease passenger count"
            >
              -
            </Button>
            <span className="w-16 text-center font-medium text-luxury-pearl text-lg">
              {passengers}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12 border-luxury-gold/30 hover:bg-luxury-gold hover:text-luxury-black"
              onClick={() => setPassengers(Math.min(vehicleType.passenger_capacity, passengers + 1))}
              disabled={passengers >= vehicleType.passenger_capacity}
              aria-label="Increase passenger count"
            >
              +
            </Button>
            <span className="text-sm text-luxury-lightGray ml-2">
              Max: {vehicleType.passenger_capacity}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

TransferDetailsSection.displayName = 'TransferDetailsSection'
