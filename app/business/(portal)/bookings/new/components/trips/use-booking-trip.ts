'use client';

/**
 * Trip state for the booking wizard: which trip type, its journeys, the hourly package, and the
 * price breakdown behind each vehicle card. One way leaves all of this unused.
 * SCOPE: Business module ONLY.
 */

import { useState } from 'react';
import { emptyBusinessLeg, initialLegsFor } from '@/lib/business/trips/draft';
import type {
  BusinessHourlyPackage,
  BusinessTripLegInput,
  BusinessTripType,
  BusinessTripVehicleQuote,
} from '@/lib/business/trips/types';
import type { VehicleTypeResult, VehicleTypesByCategory } from '../../actions';
import { getBusinessHourlyVehicles, getBusinessTripVehicles } from '../../trip-actions';

export interface TripVehicleLoad {
  vehicleTypes: VehicleTypeResult[];
  vehicleTypesByCategory: VehicleTypesByCategory[];
  error?: string;
}

/** What the trip endpoint needs beyond the shared customer, guest and add-on fields. */
export type TripSubmitFields =
  | { trip_type: 'round_trip' | 'multi_city'; legs: Array<Omit<BusinessTripLegInput, 'from_location_name' | 'to_location_name'>> }
  | {
      trip_type: 'hourly';
      hourly: { from_location_id: string; pickup_address: string; date: string; time: string; hourly_package: BusinessHourlyPackage };
    };

export function useBookingTrip() {
  const [tripType, setTripType] = useState<BusinessTripType>('one_way');
  const [legs, setLegs] = useState<BusinessTripLegInput[]>([emptyBusinessLeg()]);
  const [hourlyPackage, setHourlyPackage] = useState<BusinessHourlyPackage>('half_day');
  const [quotes, setQuotes] = useState<Record<string, BusinessTripVehicleQuote>>({});

  function changeType(next: BusinessTripType) {
    setTripType(next);
    setLegs((current) => initialLegsFor(next, current));
    setQuotes({});
  }

  async function loadVehicles(seated: number): Promise<TripVehicleLoad> {
    setQuotes({});
    const result = tripType === 'hourly'
      ? await getBusinessHourlyVehicles({
          fromLocationId: legs[0]?.from_location_id ?? '',
          hourlyPackage,
          passengers: seated,
          date: legs[0]?.date ?? '',
          time: legs[0]?.time ?? '',
        })
      : await getBusinessTripVehicles({
          tripType: tripType === 'round_trip' ? 'round_trip' : 'multi_city',
          legs: legs.map((leg) => ({
            fromLocationId: leg.from_location_id,
            toLocationId: leg.to_location_id,
            date: leg.date,
            time: leg.time,
          })),
          passengers: seated,
        });
    setQuotes(result.quotes);
    return result;
  }

  function submitFields(): TripSubmitFields | null {
    if (tripType === 'one_way') return null;
    if (tripType === 'hourly') {
      const leg = legs[0];
      return {
        trip_type: 'hourly',
        hourly: {
          from_location_id: leg.from_location_id,
          pickup_address: leg.pickup_address.trim(),
          date: leg.date,
          time: leg.time,
          hourly_package: hourlyPackage,
        },
      };
    }
    return {
      trip_type: tripType,
      legs: legs.map((leg) => ({
        from_location_id: leg.from_location_id,
        to_location_id: leg.to_location_id,
        pickup_address: leg.pickup_address.trim(),
        dropoff_address: leg.dropoff_address.trim(),
        date: leg.date,
        time: leg.time,
      })),
    };
  }

  return {
    tripType,
    legs,
    hourlyPackage,
    quotes,
    journeyCount: tripType === 'one_way' ? 1 : legs.length,
    changeType,
    setLegs,
    setHourlyPackage,
    loadVehicles,
    submitFields,
  };
}
