'use client'

import { bookingTodayAsCalendarDate } from '@/lib/utils/timezone'
import { UseFormReturn } from 'react-hook-form'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Briefcase, Users } from 'lucide-react'
import { FormDatePicker } from '@/components/ui/form-date-picker'
import { FormTimePicker } from '@/components/ui/form-time-picker'
import { parse, format } from 'date-fns'
import { RouteDetails, VehicleTypeDetails } from '@/app/checkout/actions'
import { GuestSelector } from '@/components/home/hero/guest-selector'
import type { GuestBreakdown } from '@/components/home/hero/guest-breakdown'

/** One field-label treatment, hoisted so it cannot drift between the two form sections. */
const FIELD_LABEL = 'checkout-field-label mb-2.5 block'

/** Matches the media grading on the vehicle cards, so the same photo reads the same way
    on the search results and here. Flips with the theme. */
const MEDIA_TOKENS = [
  '[--media-filter:saturate(0.94)_contrast(1.02)_brightness(1)]',
  'dark:[--media-filter:saturate(0.96)_contrast(1.04)_brightness(0.94)]',
].join(' ')

interface TransferDetailsSectionProps {
  form: UseFormReturn<any>
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  guests: GuestBreakdown
  setGuests: (value: GuestBreakdown) => void
  /** Where "Change vehicle" goes. Built server-side, so a direct arrival with no history
      to pop still lands on the right search results. */
  changeHref: string
  onDateTimeChange?: (date: string, time: string) => void
}

export function TransferDetailsSection({
  form,
  route,
  vehicleType,
  guests,
  setGuests,
  changeHref,
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
        {/* Route. A definition-list rail rather than two text stacks around a floating
            arrow: every label lands on one baseline, and the distance reads as a figure. */}
        <dl className="checkout-route-rail">
          <div>
            <dt className="checkout-route-label">Pickup</dt>
            <dd className="checkout-route-value">
              {route.origin.name}
              {route.origin.city && (
                <span className="checkout-route-city">{route.origin.city}</span>
              )}
            </dd>
          </div>

          <div>
            <dt className="checkout-route-label">Drop-off</dt>
            <dd className="checkout-route-value">
              {route.destination.name}
              {route.destination.city && (
                <span className="checkout-route-city">{route.destination.city}</span>
              )}
            </dd>
          </div>

          {route.distance_km > 0 && (
            <div className="checkout-route-distance-cell">
              <dt className="checkout-route-label">Distance</dt>
              <dd className="checkout-route-figure">
                <b>{route.distance_km}</b>
                <span>Kilometres</span>
              </dd>
            </div>
          )}
        </dl>

        {/* Vehicle */}
        <div className="checkout-vehicle-selected">
          {vehicleType.image_url && (
            <div className={`relative w-full sm:w-[168px] aspect-[16/9] flex-shrink-0 rounded-[4px] overflow-hidden bg-[var(--black-warm)] border border-[var(--graphite)] ${MEDIA_TOKENS}`}>
              <Image
                src={vehicleType.image_url}
                alt={vehicleType.name}
                fill
                sizes="(max-width: 640px) 100vw, 168px"
                className="object-cover [filter:var(--media-filter)]"
              />
            </div>
          )}
          <div className="checkout-vehicle-info">
            <span className="checkout-vehicle-category">{vehicleType.category || 'Premium'}</span>
            <h3 className="checkout-vehicle-name">{vehicleType.name}</h3>
            <div className="checkout-vehicle-specs">
              <span className="checkout-vehicle-spec">
                <Users className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                {vehicleType.passenger_capacity} seats
              </span>
              <span className="checkout-vehicle-spec">
                <Briefcase className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                {vehicleType.luggage_capacity} bags
              </span>
            </div>
          </div>
          <Link href={changeHref} className="checkout-vehicle-change">
            Change vehicle
          </Link>
        </div>

        {/* Date and Time */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pickupDate" className={FIELD_LABEL}>
              Pickup date
            </Label>
            <FormDatePicker
              value={pickupDateValue}
              onChange={handleDatePickerChange}
              disabled={(date) => date < bookingTodayAsCalendarDate()}
              placeholder="Select pickup date"
              className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--gold)]/15 focus-visible:border-[var(--gold)]"
            />
            {errors.pickupDate && (
              <p id="pickupDate-error" role="alert" className="text-sm text-[var(--destructive)] mt-1.5">{errors.pickupDate.message as string}</p>
            )}
          </div>
          <div>
            <Label htmlFor="pickupTime" className={FIELD_LABEL}>
              Pickup time
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

        {/* Flight number and guests share the two-column grid. Guests previously sat at
            40% width with its capacity note floating beside it, which broke the rhythm
            twice in one section. The breakdown is the source of truth; the total is
            derived, so the two cannot contradict. Capped at this vehicle's capacity. */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="flightNumber" className={FIELD_LABEL}>
              Flight number
              <span className="checkout-field-optional">· Optional</span>
            </Label>
            <Input
              id="flightNumber"
              placeholder="EK 123"
              className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold)]/15 focus:border-[var(--gold)]"
              {...register('flightNumber')}
              aria-describedby="flightNumber-hint"
            />
            <p id="flightNumber-hint" className="text-xs text-[var(--text-muted)] mt-1.5">
              We track your flight and shift the pickup time for delays.
            </p>
          </div>

          <div>
            <Label className={FIELD_LABEL}>
              Guests
            </Label>
            <GuestSelector
              value={guests}
              onChange={setGuests}
              maxSeated={vehicleType.passenger_capacity}
              className="flex h-[52px] w-full items-center gap-2 rounded-md border border-[var(--graphite)] bg-[var(--black-warm)] px-3 text-sm text-[var(--text-primary)] transition-colors hover:border-[rgba(var(--gold-rgb),0.15)]"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              This vehicle seats up to {vehicleType.passenger_capacity}.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

TransferDetailsSection.displayName = 'TransferDetailsSection'
