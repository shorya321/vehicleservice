'use client'

import { format, parse } from 'date-fns'
import { Label } from '@/components/ui/label'
import { FormDatePicker } from '@/components/ui/form-date-picker'
import { FormTimePicker } from '@/components/ui/form-time-picker'
import { bookingTodayAsCalendarDate } from '@/lib/utils/timezone'
import type { GroupedCheckoutTrip } from '@/lib/trips/checkout-trip'
import type { LegSchedule } from '../trip-ledger-props'

const FIELD_LABEL = 'checkout-field-label mb-2.5 block'
const INPUT_CLASS =
  'h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--gold)]/15 focus-visible:border-[var(--gold)]'

export function legTitle(trip: GroupedCheckoutTrip, index: number): string {
  if (trip.kind === 'round_trip') return index === 0 ? 'Outbound' : 'Return'
  return `Journey ${index + 1}`
}

interface TripLegsFieldsProps {
  trip: GroupedCheckoutTrip
  /** Every journey's date and time; index 0 mirrors the form's own pickup fields. */
  schedule: LegSchedule[]
  onLegChange: (index: number, patch: Partial<LegSchedule>) => void
}

const toDate = (value: string): Date | undefined => (value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined)

/**
 * Date and time for every journey after the first, each on its own route line.
 * The first journey uses the section's existing pickup fields so one way,
 * hourly and grouped trips share one validated field pair.
 */
export function TripLegsFields({ trip, schedule, onLegChange }: TripLegsFieldsProps) {
  return (
    <div className="space-y-6">
      {trip.legs.slice(1).map((leg, offset) => {
        const index = offset + 1
        const previousDate = toDate(schedule[index - 1]?.date ?? '')
        const idBase = `leg-${index}`
        return (
          <fieldset key={idBase} className="space-y-3 border-t border-[var(--stub-line)] pt-5">
            <legend className="checkout-field-label">
              {legTitle(trip, index)}: {leg.fromName} to {leg.toName}
            </legend>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor={`${idBase}-date`} className={FIELD_LABEL}>
                  {trip.kind === 'round_trip' ? 'Return date' : 'Pickup date'}
                </Label>
                <FormDatePicker
                  value={toDate(schedule[index]?.date ?? '')}
                  onChange={(date) => onLegChange(index, { date: date ? format(date, 'yyyy-MM-dd') : '' })}
                  disabled={(date) =>
                    date < bookingTodayAsCalendarDate() || (previousDate ? date < previousDate : false)
                  }
                  placeholder="Select date"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <Label htmlFor={`${idBase}-time`} className={FIELD_LABEL}>
                  {trip.kind === 'round_trip' ? 'Return pickup time' : 'Pickup time'}
                </Label>
                <FormTimePicker
                  id={`${idBase}-time`}
                  value={schedule[index]?.time ?? ''}
                  onChange={(time) => onLegChange(index, { time })}
                  placeholder="Select pickup time"
                  className={INPUT_CLASS}
                  aria-required="true"
                />
              </div>
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}
