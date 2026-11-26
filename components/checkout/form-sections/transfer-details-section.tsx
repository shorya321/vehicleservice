'use client'

import { useEffect, useRef } from 'react'
import { bookingTodayAsCalendarDate } from '@/lib/utils/timezone'
import { UseFormReturn, useFormState } from 'react-hook-form'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Briefcase, Users } from 'lucide-react'
import { FormDatePicker } from '@/components/ui/form-date-picker'
import { FormTimePicker } from '@/components/ui/form-time-picker'
import { parse, format } from 'date-fns'
import { VehicleTypeDetails } from '@/app/checkout/actions'
import { GuestSelector } from '@/components/home/hero/guest-selector'
import type { GuestBreakdown } from '@/components/home/hero/guest-breakdown'
import { isGroupedCheckout, type CheckoutTrip } from '@/lib/trips/checkout-trip'
import { HOURLY_PACKAGE_LABELS } from '@/lib/trips/constants'
import { adjustToFloor, formatLead } from '@/lib/trips/lead-time'
import { usePickupFloor } from '../use-pickup-floor'
import type { LegSchedule } from '../trip-ledger-props'
import { TripLegsFields, legTitle } from './trip-legs-fields'

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
  vehicleType: VehicleTypeDetails
  guests: GuestBreakdown
  setGuests: (value: GuestBreakdown) => void
  /** Where "Change vehicle" goes. Built server-side, so a direct arrival with no history
      to pop still lands on the right search results. */
  changeHref: string
  onDateTimeChange?: (date: string, time: string) => void
  trip?: CheckoutTrip
  /** Grouped trips: every journey's date and time. */
  schedule?: LegSchedule[]
  onLegChange?: (index: number, patch: Partial<LegSchedule>) => void
  /** Why the journeys cannot be booked as scheduled, from the last check. */
  scheduleError?: string | null
}

export function TransferDetailsSection({
  form,
  vehicleType,
  guests,
  setGuests,
  changeHref,
  onDateTimeChange,
  trip,
  schedule = [],
  onLegChange,
  scheduleError,
}: TransferDetailsSectionProps) {
  const { register, watch, setValue } = form
  // Subscribed here: this section renders from a memoised list, so errors read off `form`
  // never re-rendered it and the date and time messages stayed hidden.
  const { errors } = useFormState({ control: form.control })
  const hourly = trip?.kind === 'hourly' ? trip : null
  const grouped = trip && isGroupedCheckout(trip) ? trip : null
  const firstLeg = grouped?.legs[0]

  const pickupDateStr = watch('pickupDate')
  const pickupDateValue = pickupDateStr ? parse(pickupDateStr, 'yyyy-MM-dd', new Date()) : undefined

  // The earliest pickup on offer: now plus the lead, in the operating timezone. Null until
  // hydrated, so the pickers fall back to "today" for the first paint.
  const leadMinutes = trip?.leadMinutes ?? 0
  const floor = usePickupFloor(leadMinutes)
  const earliestDay = floor ? bookingTodayAsCalendarDate(floor.date) : bookingTodayAsCalendarDate()
  const minTime = floor && pickupDateStr === floor.date ? floor.time : undefined

  // A search link can carry a time that is already too soon (or a day the lead has
  // pushed past). Move it up once, when the floor is first known, rather than letting
  // the customer fill the form and be refused at Continue.
  const seededRef = useRef(false)
  useEffect(() => {
    if (!floor || seededRef.current) return
    seededRef.current = true
    const date: string = watch('pickupDate')
    const time: string = watch('pickupTime')
    if (!date) return
    const next = adjustToFloor(date < floor.date ? floor.date : date, time, floor)
    if (next.date === date && next.time === time) return
    setValue('pickupDate', next.date, { shouldValidate: true })
    setValue('pickupTime', next.time, { shouldValidate: true })
    onDateTimeChange?.(next.date, next.time)
  }, [floor, watch, setValue, onDateTimeChange])

  const handleDatePickerChange = (date: Date | undefined) => {
    const formatted = date ? format(date, 'yyyy-MM-dd') : ''
    // On the floor day a too-soon time moves up to the floor; other days keep it.
    const currentTime: string = watch('pickupTime')
    const time = formatted && floor && formatted === floor.date && currentTime && currentTime < floor.time
      ? floor.time
      : currentTime
    setValue('pickupDate', formatted, { shouldValidate: true })
    if (time !== currentTime) setValue('pickupTime', time, { shouldValidate: true })
    onDateTimeChange?.(formatted, time)
  }

  const handleTimePickerChange = (time: string) => {
    setValue('pickupTime', time, { shouldValidate: true })
    const currentDate = watch('pickupDate')
    onDateTimeChange?.(currentDate, time)
  }

  return (
    <div className="checkout-form-section">
      <div className="checkout-section-header">
        <h2 className="checkout-section-title editorial-eyebrow--pill"><i aria-hidden="true" />{hourly ? 'Hire details' : 'Transfer details'}</h2>
        <span className="checkout-section-note">Editable until 24 hours before pickup</span>
      </div>

      <div className="checkout-section-content space-y-6">
        {/* The route, the date, the guest count and the distance are stated once, in the
            summary card beside this form (and its mobile drawer). The inputs below edit
            those values; nothing here restates them as read-only text. */}

        {/* Vehicle */}
        <div className="checkout-vehicle-selected">
          {vehicleType.image_url && (
            <div className={`relative w-full sm:w-[168px] aspect-[16/9] flex-shrink-0 rounded-[6px] overflow-hidden bg-[var(--black-warm)] border border-[var(--stub-line)] ${MEDIA_TOKENS}`}>
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

        {hourly && (
          <p className="text-[0.875rem] leading-relaxed text-[var(--text-secondary)]">
            {HOURLY_PACKAGE_LABELS[hourly.hourlyPackage]}: {hourly.hours} hours with your chauffeur,{' '}
            {hourly.includedKm} km included, from your pickup and then as you direct. Share your plans in
            the special requests below.
            {hourly.minNoticeHours > 0 ? ` Book at least ${hourly.minNoticeHours} hours ahead.` : ''}
          </p>
        )}

        {grouped && firstLeg && (
          <p className="checkout-field-label">
            {legTitle(grouped, 0)}: {firstLeg.fromName} to {firstLeg.toName}
          </p>
        )}

        {/* Date and Time */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pickupDate" className={FIELD_LABEL}>
              {hourly ? 'Start date' : grouped?.kind === 'round_trip' ? 'Outbound date' : 'Pickup date'}
            </Label>
            <FormDatePicker
              id="pickupDate"
              value={pickupDateValue}
              onChange={handleDatePickerChange}
              disabled={(date) => date < earliestDay}
              placeholder="Select pickup date"
              className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--gold)]/15 focus-visible:border-[var(--gold)]"
            />
            {errors.pickupDate && (
              <p id="pickupDate-error" className="text-sm text-destructive mt-1.5">{errors.pickupDate.message as string}</p>
            )}
          </div>
          <div>
            <Label htmlFor="pickupTime" className={FIELD_LABEL}>
              {hourly ? 'Start time' : 'Pickup time'}
            </Label>
            <FormTimePicker
              id="pickupTime"
              value={watch('pickupTime')}
              onChange={handleTimePickerChange}
              minTime={minTime}
              placeholder="Select pickup time"
              className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--gold)]/15 focus-visible:border-[var(--gold)]"
              aria-required="true"
              aria-invalid={!!errors.pickupTime}
              aria-describedby={errors.pickupTime ? 'pickupTime-error' : undefined}
            />
            {errors.pickupTime ? (
              <p id="pickupTime-error" className="text-sm text-destructive mt-1.5">{errors.pickupTime.message as string}</p>
            ) : (
              // Hourly states its notice in the paragraph above.
              !hourly && leadMinutes > 0 && (
                <p className="text-xs text-[var(--text-muted)] mt-1.5">
                  Book at least {formatLead(leadMinutes)} ahead.
                </p>
              )
            )}
          </div>
        </div>

        {grouped && onLegChange && (
          <TripLegsFields trip={grouped} schedule={schedule} onLegChange={onLegChange} />
        )}

        {scheduleError && (
          <p role="alert" className="text-sm text-destructive">{scheduleError}</p>
        )}

        {/* Guests and flight number share the two-column grid. Guests previously sat at
            40% width with its capacity note floating beside it, which broke the rhythm
            twice in one section. The breakdown is the source of truth; the total is
            derived, so the two cannot contradict. Capped at this vehicle's capacity. */}
        <div className="grid md:grid-cols-2 gap-4">
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
        </div>
      </div>
    </div>
  )
}

TransferDetailsSection.displayName = 'TransferDetailsSection'
