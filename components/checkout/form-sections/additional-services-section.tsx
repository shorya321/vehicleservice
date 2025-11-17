'use client'

import { UseFormReturn } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Baby, Luggage } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { VehicleTypeDetails } from '@/app/checkout/actions'

interface AdditionalServicesSectionProps {
  form: UseFormReturn<any>
  vehicleType: VehicleTypeDetails
  luggage: number
  setLuggage: (value: number) => void
}

/**
 * Additional Services Section Component
 *
 * Manages optional booking add-ons:
 * - Child seats (infant and booster) with pricing
 * - Luggage management with capacity tracking and extra bag fees
 * - Special requests text area
 *
 * @component
 */
export function AdditionalServicesSection({
  form,
  vehicleType,
  luggage,
  setLuggage
}: AdditionalServicesSectionProps) {
  const { register, watch, setValue, formState: { errors } } = form

  // Calculate extra luggage based on vehicle capacity
  const extraLuggageCount = Math.max(0, luggage - vehicleType.luggage_capacity)
  const extraLuggageCost = extraLuggageCount * 15 // $15 per extra bag

  return (
    <motion.div
      className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-6 md:p-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h2 className="font-serif text-3xl text-luxury-pearl mb-6">Additional Services</h2>

      <div className="space-y-6">
        {/* Child Seats */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-luxury-lightGray">
            <Baby className="h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
            Child Seats
          </Label>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Infant Seat */}
            <div className="flex items-center justify-between p-4 backdrop-blur-sm bg-luxury-black/30 border border-luxury-gold/10 rounded-lg">
              <div>
                <p className="font-medium text-luxury-pearl">Infant Seat (0-1 year)</p>
                <p className="text-sm text-luxury-gold">+{formatCurrency(10)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 border-luxury-gold/30 hover:bg-luxury-gold hover:text-luxury-black"
                  onClick={() => {
                    const current = watch('infantSeats')
                    setValue('infantSeats', Math.max(0, current - 1))
                  }}
                  aria-label="Decrease infant seats"
                >
                  -
                </Button>
                <span className="w-8 text-center text-luxury-pearl font-medium">
                  {watch('infantSeats')}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 border-luxury-gold/30 hover:bg-luxury-gold hover:text-luxury-black"
                  onClick={() => {
                    const current = watch('infantSeats')
                    setValue('infantSeats', Math.min(4, current + 1))
                  }}
                  aria-label="Increase infant seats"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Booster Seat */}
            <div className="flex items-center justify-between p-4 backdrop-blur-sm bg-luxury-black/30 border border-luxury-gold/10 rounded-lg">
              <div>
                <p className="font-medium text-luxury-pearl">Booster Seat (1-4 years)</p>
                <p className="text-sm text-luxury-gold">+{formatCurrency(10)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 border-luxury-gold/30 hover:bg-luxury-gold hover:text-luxury-black"
                  onClick={() => {
                    const current = watch('boosterSeats')
                    setValue('boosterSeats', Math.max(0, current - 1))
                  }}
                  aria-label="Decrease booster seats"
                >
                  -
                </Button>
                <span className="w-8 text-center text-luxury-pearl font-medium">
                  {watch('boosterSeats')}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 border-luxury-gold/30 hover:bg-luxury-gold hover:text-luxury-black"
                  onClick={() => {
                    const current = watch('boosterSeats')
                    setValue('boosterSeats', Math.min(4, current + 1))
                  }}
                  aria-label="Increase booster seats"
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Luggage */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2 text-luxury-lightGray">
            <Luggage className="h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
            Luggage
          </Label>
          <div className="flex items-center justify-between p-4 backdrop-blur-sm bg-luxury-black/30 border border-luxury-gold/10 rounded-lg">
            <div>
              <p className="font-medium text-luxury-pearl">Total Luggage</p>
              <p className="text-sm text-luxury-lightGray">
                Vehicle includes {vehicleType.luggage_capacity} bag{vehicleType.luggage_capacity !== 1 ? 's' : ''}
              </p>
              {extraLuggageCount > 0 && (
                <p className="text-sm text-luxury-gold font-medium mt-1">
                  +{extraLuggageCount} extra bag{extraLuggageCount !== 1 ? 's' : ''} ({formatCurrency(extraLuggageCost)})
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 border-luxury-gold/30 hover:bg-luxury-gold hover:text-luxury-black"
                onClick={() => {
                  const newLuggage = Math.max(0, luggage - 1)
                  setLuggage(newLuggage)
                  setValue('luggageCount', newLuggage)
                  setValue('extraLuggageCount', Math.max(0, newLuggage - vehicleType.luggage_capacity))
                }}
                aria-label="Decrease luggage count"
              >
                -
              </Button>
              <span className="w-8 text-center text-luxury-pearl font-medium">{luggage}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-9 border-luxury-gold/30 hover:bg-luxury-gold hover:text-luxury-black"
                onClick={() => {
                  const newLuggage = Math.min(20, luggage + 1)
                  setLuggage(newLuggage)
                  setValue('luggageCount', newLuggage)
                  setValue('extraLuggageCount', Math.max(0, newLuggage - vehicleType.luggage_capacity))
                }}
                aria-label="Increase luggage count"
              >
                +
              </Button>
            </div>
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <Label htmlFor="specialRequests" className="mb-2 block text-luxury-lightGray">
            Special Requests (Optional)
          </Label>
          <Textarea
            id="specialRequests"
            className="min-h-[100px] bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
            {...register('specialRequests')}
            placeholder="Any special requirements or requests..."
            rows={3}
          />
        </div>
      </div>
    </motion.div>
  )
}

AdditionalServicesSection.displayName = 'AdditionalServicesSection'
