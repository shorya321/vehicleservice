/**
 * The route lines of a trip in the builder list: one way as before, a multi-journey trip one line
 * per journey, hourly as its pickup and package.
 *
 * SCOPE: Business module ONLY
 */

import { BUSINESS_HOURLY_PACKAGE_LABELS, BUSINESS_TRIP_TYPE_LABELS } from '@/lib/business/trips/constants';
import { formatBookingDateTime } from '@/lib/business/utils/timezone';
import { tripTypeOf } from '@/lib/business/quotations/trip-legs';
import type { QuotationTripDraft } from '@/lib/business/quotations/types';

interface TripRowRouteProps {
  trip: QuotationTripDraft;
}

export function TripRowRoute({ trip }: TripRowRouteProps) {
  const type = tripTypeOf(trip);

  if (type === 'one_way') {
    return (
      <>
        <div className="mt-1 break-words font-medium text-foreground">
          {trip.from_location_name ?? trip.pickup_address}
        </div>
        <div className="break-words text-muted-foreground">
          → {trip.to_location_name ?? trip.dropoff_address}
        </div>
      </>
    );
  }

  if (type === 'hourly') {
    const pkg = trip.hourly_package ? BUSINESS_HOURLY_PACKAGE_LABELS[trip.hourly_package] : 'Hourly';
    return (
      <>
        <div className="mt-1 break-words font-medium text-foreground">
          {trip.from_location_name ?? trip.pickup_address}
        </div>
        <div className="break-words text-muted-foreground">
          Hourly · {pkg}
          {trip.duration_hours ? ` · ${trip.duration_hours} h` : ''}
        </div>
      </>
    );
  }

  return (
    <ol className="mt-1 space-y-0.5">
      <li className="text-xs font-medium uppercase tracking-wide text-primary">
        {BUSINESS_TRIP_TYPE_LABELS[type]} · {trip.legs?.length ?? 0} journeys
      </li>
      {(trip.legs ?? []).map((leg, index) => (
        <li key={index} className="break-words text-sm">
          <span className="font-medium text-foreground">
            {leg.from_location_name ?? leg.pickup_address} → {leg.to_location_name ?? leg.dropoff_address}
          </span>
          {leg.pickup_datetime && (
            <span className="text-muted-foreground"> · {formatBookingDateTime(leg.pickup_datetime)}</span>
          )}
        </li>
      ))}
    </ol>
  );
}
