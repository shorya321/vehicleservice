'use client'

import { UseFormReturn } from 'react-hook-form'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Briefcase, Users } from 'lucide-react'
import { FormDatePicker } from '@/components/ui/form-date-picker'
import { FormTimePicker } from '@/components/ui/form-time-picker'
import { parse, format } from 'date-fns'
import { RouteDetails, VehicleTypeDetails } from '@/app/checkout/actions'
import { GuestSelector } from '@/components/home/hero/guest-selector'
import type { GuestBreakdown } from '@/components/home/hero/guest-breakdown'

interface TransferDetailsSectionProps {
  form: UseFormReturn<any>
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  guests: GuestBreakdown
  setGuests: (value: GuestBreakdown) => void
  onDateTimeChange?: (date: string, time: string) => void
}

export function TransferDetailsSection({
  form,
  route,
  vehicleType,
  guests,
  setGuests,
  onDateTimeChange
}: TransferDetailsSectionProps) {
  const { register, formState: { errors }, watch, setValue } = form

  const pickupDateStr = watch('pickupDate')
  const pickupDateValue = pickupDateStr ? parse(pickupDateStr, 'yyyy-MM-dd', new Date()) : undefined

  const handleDatePickerChange = (date: Date | undefined) => {
    const formatted = date ? format(date, 'yyyy-MM-dd') : ''
    setValue('pickupDate', formatted, { shouldValidate: true })
    const currentTime = watch('pickupTime')
    onDateTimeChange?.(formatted, currentTime)
  }

  const handleTimePickerChange = (time: string) => {
    setValue('pickupTime', time, { shouldValidate: true })
    const currentDate = watch('pickupDate')
    onDateTimeChange?.(currentDate, time)
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
            <FormDatePicker
              value={pickupDateValue}
              onChange={handleDatePickerChange}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              placeholder="Select pickup date"
              className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--gold)]/15 focus-visible:border-[var(--gold)]"
            />
            {errors.pickupDate && (
              <p id="pickupDate-error" role="alert" className="text-sm text-[var(--destructive)] mt-1.5">{errors.pickupDate.message as string}</p>
            )}
          </div>
          <div>
            <Label htmlFor="pickupTime" className="mb-2.5 block text-[var(--text-secondary)] text-sm">
              Pickup Time
            </Label>
            <FormTimePicker
              id="pickupTime"
              value={watch('pickupTime')}
              onChange={handleTimePickerChange}
              placeholder="Select pickup time"
              className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--gold)]/15 focus-visible:border-[var(--gold)]"
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

        {/* Guests — the breakdown is the source of truth; the total is derived, so the two cannot
            contradict. Capped at this vehicle's capacity. */}
        <div>
          <Label className="mb-2.5 block text-[var(--text-secondary)] text-sm">
            Guests
          </Label>
          <div className="flex items-center gap-3">
            <GuestSelector
              value={guests}
              onChange={setGuests}
              maxSeated={vehicleType.passenger_capacity}
              className="flex min-h-11 w-full max-w-xs items-center gap-2 rounded-md border border-[var(--graphite)] bg-transparent px-3 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--gold)]"
            />
            <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
              Max {vehicleType.passenger_capacity}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

TransferDetailsSection.displayName = 'TransferDetailsSection'
