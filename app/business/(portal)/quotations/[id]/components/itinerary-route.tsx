/**
 * The route lines of one trip on the quotation detail page. One way renders exactly as before;
 * a round trip or multi-city trip lists every journey with its time; hourly shows its package.
 *
 * SCOPE: Business module ONLY
 */

import { BUSINESS_TRIP_TYPE_LABELS } from '@/lib/business/trips/constants';
import { businessHourlySummary, businessLegLabel, businessTripTypeOf } from '@/lib/business/trips/display';
import { formatBookingDateTime } from '@/lib/business/utils/timezone';
import type { QuotationItemWithAddons } from '@/lib/business/quotations/types';

interface ItineraryRouteProps {
  item: QuotationItemWithAddons;
}

export function ItineraryRoute({ item }: ItineraryRouteProps) {
  const type = businessTripTypeOf(item);

  if (type === 'hourly') {
    return (
      <>
        <div className="mt-1 font-medium">{item.pickup_address}</div>
        <div className="text-muted-foreground">
          → Hourly hire, as directed · {businessHourlySummary(item)}
        </div>
      </>
    );
  }

  if (type === 'one_way') {
    return (
      <>
        {/* Two lines rather than one crammed run: addresses here are full postal strings and
            read as noise when joined. */}
        <div className="mt-1 font-medium">{item.pickup_address}</div>
        <div className="text-muted-foreground">→ {item.dropoff_address}</div>
      </>
    );
  }

  const legs = item.legs ?? [];
  return (
    <div className="mt-1 space-y-1.5">
      <div className="text-xs font-medium uppercase tracking-wide text-primary">
        {BUSINESS_TRIP_TYPE_LABELS[type]} · {legs.length} journeys
      </div>
      {legs.map((leg) => (
        <div key={leg.id} className="text-sm">
          <span className="text-muted-foreground">
            {businessLegLabel({ trip_type: type, leg_index: leg.leg_index }, legs.length)}:{' '}
          </span>
          <span className="font-medium">{leg.pickup_address}</span>
          <span className="text-muted-foreground"> → {leg.dropoff_address}</span>
          <div className="text-xs text-muted-foreground">
            {leg.pickup_datetime ? formatBookingDateTime(leg.pickup_datetime) : 'Date to be confirmed'}
          </div>
        </div>
      ))}
    </div>
  );
}
