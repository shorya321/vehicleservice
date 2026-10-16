'use client';

/**
 * Route block for a round trip, multi-city or hourly quotation trip. One way keeps the sheet's
 * original route fields.
 *
 * Built from the booking wizard's own JourneyCard and HourlyFields, so both screens collect a
 * trip the same way. The wizard works in date + time; the trip stores instants, converted at
 * the edge by trip-legs.ts.
 *
 * SCOPE: Business module ONLY
 */

import { Plus } from 'lucide-react';
import { Button } from '@/components/business/ui/button';
import { JourneyCard } from '../../../../bookings/new/components/trips/journey-card';
import { HourlyFields } from '../../../../bookings/new/components/trips/hourly-fields';
import { BUSINESS_MAX_LEGS_HARD_LIMIT } from '@/lib/business/trips/constants';
import { emptyBusinessLeg, returnLegFor, validateBusinessTripDraft } from '@/lib/business/trips/draft';
import type { BusinessTripSettings } from '@/lib/business/trips/settings';
import type { BusinessHourlyPackage, BusinessTripLegInput } from '@/lib/business/trips/types';
import {
  firstLegOf,
  fromWizardLeg,
  routeFieldsFrom,
  toWizardLeg,
  tripTypeOf,
} from '@/lib/business/quotations/trip-legs';
import type { QuotationTripDraft } from '@/lib/business/quotations/types';

/**
 * A journey is stored as one instant, so a date picked before its time would be lost. Noon fills
 * the gap, as the one-way fields do, and the time stays editable.
 */
const DEFAULT_TIME = '12:00';

function withDefaultTime(leg: BusinessTripLegInput, patch: Partial<BusinessTripLegInput>): BusinessTripLegInput {
  const next = { ...leg, ...patch };
  return patch.date && !next.time ? { ...next, time: DEFAULT_TIME } : next;
}

interface QuotationTripRouteProps {
  trip: QuotationTripDraft;
  settings: BusinessTripSettings;
  onChange: (patch: Partial<QuotationTripDraft>) => void;
}

export function QuotationTripRoute({ trip, settings, onChange }: QuotationTripRouteProps) {
  const type = tripTypeOf(trip);
  const legs = (trip.legs ?? []).map(toWizardLeg);
  const maxLegs = Math.min(settings.multi_city_max_legs, BUSINESS_MAX_LEGS_HARD_LIMIT);

  function commitLegs(next: BusinessTripLegInput[]) {
    const stored = next.map(fromWizardLeg);
    onChange({ legs: stored, ...routeFieldsFrom(stored[0]) });
  }

  function updateLeg(index: number, patch: Partial<BusinessTripLegInput>) {
    const next = legs.map((leg, i) => (i === index ? withDefaultTime(leg, patch) : leg));
    if (type === 'round_trip' && index === 0 && next[1]) next[1] = returnLegFor(next[0], next[1]);
    commitLegs(next);
  }

  function addLeg() {
    const last = legs[legs.length - 1];
    commitLegs([
      ...legs,
      {
        ...emptyBusinessLeg(),
        from_location_id: last?.to_location_id ?? '',
        from_location_name: last?.to_location_name ?? '',
        pickup_address: last?.dropoff_address ?? '',
      },
    ]);
  }

  if (type === 'hourly') {
    const start = toWizardLeg(firstLegOf(trip));
    return (
      <HourlyFields
        leg={start}
        hourlyPackage={trip.hourly_package ?? 'half_day'}
        minNoticeHours={settings.hourly_min_notice_hours}
        onChange={(patch) => {
          const next = fromWizardLeg(withDefaultTime(start, patch));
          onChange({
            from_location_id: next.from_location_id,
            from_location_name: next.from_location_name,
            pickup_address: next.pickup_address,
            pickup_datetime: next.pickup_datetime,
          });
        }}
        onPackageChange={(value: BusinessHourlyPackage) => onChange({ hourly_package: value })}
      />
    );
  }

  // The wizard's own client check, shown as a hint. The vehicle quote applies the real drive
  // times and buffer, and refuses a trip this check would let through.
  const hint = legs.length > 0 ? validateBusinessTripDraft(type, legs, settings) : null;

  return (
    <div className="space-y-4">
      {legs.map((leg, index) => (
        <JourneyCard
          key={index}
          index={index}
          title={type === 'round_trip' ? (index === 0 ? 'Outbound' : 'Return') : `Journey ${index + 1}`}
          leg={leg}
          routeLocked={type === 'round_trip' && index === 1}
          onChange={(patch) => updateLeg(index, patch)}
          onRemove={
            type === 'multi_city' && legs.length > 2
              ? () => commitLegs(legs.filter((_, i) => i !== index))
              : undefined
          }
        />
      ))}

      {type === 'multi_city' && legs.length < maxLegs && (
        <Button type="button" variant="outline" onClick={addLeg} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add journey ({legs.length} of {maxLegs})
        </Button>
      )}

      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
