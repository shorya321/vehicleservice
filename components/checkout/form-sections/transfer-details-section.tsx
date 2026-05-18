'use client'

import { UseFormReturn } from 'react-hook-form'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ArrowRight, Briefcase, Users } from 'lucide-react'
import { RouteDetails, VehicleTypeDetails } from '@/app/checkout/actions'

interface TransferDetailsSectionProps {
  form: UseFormReturn<any>
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  passengers: number
  setPassengers: (value: number) => void
  onDateTimeChange?: (date: string, time: string) => void
}

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
    <div className="checkout-form-section">
      <div className="checkout-section-header">
        <h2 className="checkout-section-title">Transfer Details</h2>
      </div>

      <div className="checkout-section-content space-y-6">
        {/* Route */}
        <div className="checkout-transfer-route">
          <div className="checkout-route-point">
            <span className="checkout-route-label">Pickup</span>
            <p className="checkout-route-name">{route.origin.name}</p>
            {route.origin.city && (
              <span className="checkout-route-city">{route.origin.city}</span>
            )}
          </div>

          <div className="checkout-route-connector">
            <ArrowRight className="h-4 w-4 text-[var(--gold-text)]" aria-hidden="true" />
            {route.distance_km > 0 && (
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

        {/* Vehicle */}
        <div className="checkout-vehicle-selected">
          {vehicleType.image_url && (
            <div className="relative w-full h-[120px] sm:w-[140px] sm:h-[90px] flex-shrink-0 rounded overflow-hidden bg-[var(--black-warm)]">
              <Image
                src={vehicleType.image_url}
                alt={vehicleType.name}
                fill
                sizes="(max-width: 640px) 100vw, 140px"
                className="object-contain p-2"
              />
            </div>
          )}
          <div className="checkout-vehicle-info">
            <span className="checkout-vehicle-category">{vehicleType.category || 'Premium'}</span>
            <h3 className="checkout-vehicle-name">{vehicleType.name}</h3>
            <div className="checkout-vehicle-specs">
              <span className="checkout-vehicle-spec">
                <Users className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
                {vehicleType.passenger_capacity} seats
              </span>
              <span className="checkout-vehicle-spec">
                <Briefcase className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
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
            <Label htmlFor="pickupDate" className="mb-2.5 block text-[var(--text-secondary)] text-sm">
              Pickup Date
            </Label>
            <Input
              id="pickupDate"
              type="date"
              className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--gold)]/15 focus:border-[var(--gold)]"
              {...register('pickupDate')}
              min={new Date().toISOString().split('T')[0]}
              onChange={handleDateChange}
              aria-required="true"
              aria-invalid={!!errors.pickupDate}
              aria-describedby={errors.pickupDate ? 'pickupDate-error' : undefined}
            />
            {errors.pickupDate && (
              <p id="pickupDate-error" role="alert" className="text-sm text-[var(--destructive)] mt-1.5">{errors.pickupDate.message as string}</p>
            )}
          </div>
          <div>
            <Label htmlFor="pickupTime" className="mb-2.5 block text-[var(--text-secondary)] text-sm">
              Pickup Time
            </Label>
            <Input
              id="pickupTime"
              type="time"
              className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--gold)]/15 focus:border-[var(--gold)]"
              {...register('pickupTime')}
              onChange={handleTimeChange}
              aria-required="true"
              aria-invalid={!!errors.pickupTime}
              aria-describedby={errors.pickupTime ? 'pickupTime-error' : undefined}
            />
            {errors.pickupTime && (
              <p id="pickupTime-error" role="alert" className="text-sm text-[var(--destructive)] mt-1.5">{errors.pickupTime.message as string}</p>
            )}
          </div>
        </div>

        {/* Flight Number */}
        <div>
          <Label htmlFor="flightNumber" className="mb-2.5 block text-[var(--text-secondary)] text-sm">
            Flight Number
            <span className="text-[var(--text-muted)] ml-1.5">(optional)</span>
          </Label>
          <Input
            id="flightNumber"
            placeholder="e.g., EK 123"
            className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold)]/15 focus:border-[var(--gold)]"
            {...register('flightNumber')}
            aria-describedby="flightNumber-hint"
          />
          <p id="flightNumber-hint" className="text-xs text-[var(--text-muted)] mt-1.5">We track your flight for delays</p>
        </div>

        {/* Passengers */}
        <div>
          <Label className="mb-2.5 block text-[var(--text-secondary)] text-sm">
            Passengers
          </Label>
          <div className="flex items-center gap-3" role="group" aria-label="Passenger count">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 border-[var(--graphite)] hover:bg-[var(--charcoal)] hover:border-[var(--gold)] text-[var(--text-primary)]"
              onClick={() => setPassengers(Math.max(1, passengers - 1))}
              disabled={passengers <= 1}
              aria-label="Decrease passenger count"
            >
              -
            </Button>
            <span className="w-12 text-center text-lg font-medium text-[var(--text-primary)] tabular-nums" aria-live="polite" aria-atomic="true">
              {passengers}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 border-[var(--graphite)] hover:bg-[var(--charcoal)] hover:border-[var(--gold)] text-[var(--text-primary)]"
              onClick={() => setPassengers(Math.min(vehicleType.passenger_capacity, passengers + 1))}
              disabled={passengers >= vehicleType.passenger_capacity}
              aria-label="Increase passenger count"
            >
              +
            </Button>
            <span className="text-xs text-[var(--text-muted)] ml-2">
              Max {vehicleType.passenger_capacity}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

TransferDetailsSection.displayName = 'TransferDetailsSection'
