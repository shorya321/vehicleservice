'use client';

/**
 * Route step for round trip, multi-city and hourly bookings. One way keeps ../route-step.tsx.
 * SCOPE: Business module ONLY.
 */

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/business/ui/button';
import { Label } from '@/components/ui/label';
import { GuestBreakdownSelector } from '../guest-breakdown-selector';
import { getSeatedCount } from '@/lib/business/guest-breakdown';
import { BUSINESS_MAX_LEGS_HARD_LIMIT } from '@/lib/business/trips/constants';
import { emptyBusinessLeg, returnLegFor, validateBusinessTripDraft } from '@/lib/business/trips/draft';
import type { BusinessTripSettings } from '@/lib/business/trips/settings';
import type { BusinessHourlyPackage, BusinessTripLegInput, BusinessTripType } from '@/lib/business/trips/types';
import { JourneyCard } from './journey-card';
import { HourlyFields } from './hourly-fields';

const MAX_SEATED_GUESTS = 20;
const MAX_INFANT_GUESTS = 4;

export interface TripGuests {
  adults: number;
  children: number;
  infants: number;
}

interface TripRouteStepProps {
  tripType: Exclude<BusinessTripType, 'one_way'>;
  legs: BusinessTripLegInput[];
  hourlyPackage: BusinessHourlyPackage;
  guests: TripGuests;
  settings: BusinessTripSettings;
  onLegsChange: (legs: BusinessTripLegInput[]) => void;
  onPackageChange: (value: BusinessHourlyPackage) => void;
  onGuestsChange: (guests: TripGuests & { passenger_count: number }) => void;
  /** Fetches priced vehicles. Resolves to an error to show here, or null once they are loaded. */
  onContinue: (seated: number) => Promise<string | null>;
}

function guestError(guests: TripGuests): string | null {
  if (guests.adults + guests.children + guests.infants > MAX_SEATED_GUESTS) return `Maximum ${MAX_SEATED_GUESTS} guests`;
  if (guests.infants > MAX_INFANT_GUESTS) return `Maximum ${MAX_INFANT_GUESTS} infants per booking (child seat availability)`;
  return null;
}

export function TripRouteStep({
  tripType,
  legs,
  hourlyPackage,
  guests,
  settings,
  onLegsChange,
  onPackageChange,
  onGuestsChange,
  onContinue,
}: TripRouteStepProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const maxLegs = Math.min(settings.multi_city_max_legs, BUSINESS_MAX_LEGS_HARD_LIMIT);

  function updateLeg(index: number, patch: Partial<BusinessTripLegInput>) {
    setError(null);
    const next = legs.map((leg, i) => (i === index ? { ...leg, ...patch } : leg));
    // The return of a round trip always mirrors the outbound route.
    if (tripType === 'round_trip' && index === 0 && next[1]) next[1] = returnLegFor(next[0], next[1]);
    onLegsChange(next);
  }

  function addLeg() {
    const last = legs[legs.length - 1];
    // A new journey usually starts where the last one ended.
    onLegsChange([
      ...legs,
      { ...emptyBusinessLeg(), from_location_id: last?.to_location_id ?? '', from_location_name: last?.to_location_name ?? '', pickup_address: last?.dropoff_address ?? '' },
    ]);
  }

  async function handleContinue() {
    const message = guestError(guests) ?? validateBusinessTripDraft(tripType, legs, settings);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      setError(await onContinue(getSeatedCount(guests)));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {tripType === 'hourly' ? (
        <HourlyFields
          leg={legs[0] ?? emptyBusinessLeg()}
          hourlyPackage={hourlyPackage}
          minNoticeHours={settings.hourly_min_notice_hours}
          onChange={(patch) => updateLeg(0, patch)}
          onPackageChange={onPackageChange}
        />
      ) : (
        legs.map((leg, index) => (
          <JourneyCard
            key={index}
            index={index}
            title={tripType === 'round_trip' ? (index === 0 ? 'Outbound' : 'Return') : `Journey ${index + 1}`}
            leg={leg}
            routeLocked={tripType === 'round_trip' && index === 1}
            onChange={(patch) => updateLeg(index, patch)}
            onRemove={tripType === 'multi_city' && legs.length > 2 ? () => onLegsChange(legs.filter((_, i) => i !== index)) : undefined}
          />
        ))
      )}

      {tripType === 'multi_city' && legs.length < maxLegs && (
        <Button type="button" variant="outline" onClick={addLeg} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add journey ({legs.length} of {maxLegs})
        </Button>
      )}

      <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-5">
        <Label>Guests</Label>
        <GuestBreakdownSelector
          value={guests}
          onChange={(next) => onGuestsChange({ ...next, passenger_count: getSeatedCount(next) })}
          maxSeated={MAX_SEATED_GUESTS}
        />
      </div>

      {error && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="button" onClick={handleContinue} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading Vehicles...
            </>
          ) : (
            'Continue to Vehicle Selection'
          )}
        </Button>
      </div>
    </div>
  );
}
