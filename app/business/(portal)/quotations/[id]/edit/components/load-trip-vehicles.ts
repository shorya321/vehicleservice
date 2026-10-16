/**
 * Prices the vehicles for a quotation trip of any type, through the same server actions the
 * booking wizard uses. One way keeps its original action untouched; round trip, multi-city and
 * hourly reuse the wizard's trip quotes, which already apply the admin trip-type settings,
 * journey timing and the hourly notice. The quote signatures those actions return are ignored:
 * a quotation re-prices at conversion.
 *
 * Only the action FUNCTIONS are imported from the bookings module, never its types (see
 * trip-editor-sheet.tsx).
 *
 * SCOPE: Business module ONLY
 */

import { getAvailableVehicleTypesForRoute } from '../../../../bookings/new/actions';
import { getBusinessHourlyVehicles, getBusinessTripVehicles } from '../../../../bookings/new/trip-actions';
import { toWizardLeg, tripTypeOf } from '@/lib/business/quotations/trip-legs';
import type { QuotationTripDraft } from '@/lib/business/quotations/types';

/** A priced vehicle as the trip sheet lists it. Price is the whole trip's net cost in AED. */
export interface SheetVehicle {
  id: string;
  name: string;
  category: string;
  capacity: number;
  price: number;
  image?: string;
}

interface Loaded {
  vehicles: SheetVehicle[];
  /** Why nothing could be priced (timing, notice, type switched off), or null. */
  error: string | null;
}

interface RawVehicle {
  id: string;
  name: string;
  category: string;
  capacity: number;
  price: number;
  image?: string;
}

const toSheet = (v: RawVehicle): SheetVehicle => ({
  id: v.id,
  name: v.name,
  category: v.category,
  capacity: v.capacity,
  price: v.price,
  image: v.image,
});

/** A key that changes whenever the trip's price could, so the sheet knows when to re-quote. */
export function tripPricingKey(trip: QuotationTripDraft): string {
  const type = tripTypeOf(trip);
  if (type === 'one_way') return [type, trip.from_location_id, trip.to_location_id, trip.passenger_count].join('|');
  if (type === 'hourly') {
    return [type, trip.from_location_id, trip.hourly_package, trip.pickup_datetime, trip.passenger_count].join('|');
  }
  const legs = (trip.legs ?? []).map((l) => `${l.from_location_id}>${l.to_location_id}@${l.pickup_datetime}`);
  return [type, ...legs, trip.passenger_count].join('|');
}

export async function loadTripVehicles(trip: QuotationTripDraft, businessAccountId: string): Promise<Loaded> {
  const type = tripTypeOf(trip);

  if (type === 'one_way') {
    const result = await getAvailableVehicleTypesForRoute(
      trip.from_location_id,
      trip.to_location_id,
      trip.passenger_count,
      businessAccountId
    );
    return { vehicles: result.vehicleTypes.map(toSheet), error: null };
  }

  if (type === 'hourly') {
    const start = toWizardLeg({
      from_location_id: trip.from_location_id,
      to_location_id: '',
      pickup_address: trip.pickup_address,
      dropoff_address: '',
      pickup_datetime: trip.pickup_datetime,
    });
    const result = await getBusinessHourlyVehicles({
      fromLocationId: trip.from_location_id,
      hourlyPackage: trip.hourly_package ?? 'half_day',
      passengers: trip.passenger_count,
      date: start.date,
      time: start.time,
    });
    return { vehicles: result.vehicleTypes.map(toSheet), error: result.error ?? null };
  }

  const result = await getBusinessTripVehicles({
    tripType: type,
    legs: (trip.legs ?? []).map((leg) => {
      const wizard = toWizardLeg(leg);
      return { fromLocationId: leg.from_location_id, toLocationId: leg.to_location_id, date: wizard.date, time: wizard.time };
    }),
    passengers: trip.passenger_count,
  });
  return { vehicles: result.vehicleTypes.map(toSheet), error: result.error ?? null };
}
