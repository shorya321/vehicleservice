'use client';

/**
 * Review-step summary of a round trip, multi-city or hourly booking: every journey with its fare,
 * any round-trip discount, or the hourly package.
 * SCOPE: Business module ONLY.
 */

import { Route, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { BUSINESS_HOURLY_PACKAGE_LABELS, BUSINESS_TRIP_TYPE_LABELS } from '@/lib/business/trips/constants';
import { businessLegLabel } from '@/lib/business/trips/display';
import type { BusinessTripLegInput, BusinessTripType, BusinessTripVehicleQuote } from '@/lib/business/trips/types';
import { bookingWallClockToUtc, formatBookingDateTime } from '@/lib/business/utils/timezone';

interface TripReviewSummaryProps {
  tripType: Exclude<BusinessTripType, 'one_way'>;
  legs: BusinessTripLegInput[];
  quote?: BusinessTripVehicleQuote;
}

function when(leg: BusinessTripLegInput): string {
  try {
    return formatBookingDateTime(bookingWallClockToUtc(leg.date, leg.time));
  } catch {
    return `${leg.date} ${leg.time}`;
  }
}

export function TripReviewSummary({ tripType, legs, quote }: TripReviewSummaryProps) {
  const isHourly = tripType === 'hourly';
  const Icon = isHourly ? Clock : Route;

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{BUSINESS_TRIP_TYPE_LABELS[tripType]}</h3>
      </div>

      {isHourly ? (
        <div className="space-y-2 text-sm">
          <p className="font-medium text-foreground">
            {legs[0]?.from_location_name}
            {legs[0]?.pickup_address ? ` - ${legs[0].pickup_address}` : ''}
          </p>
          <p className="text-muted-foreground">Starts {legs[0] ? when(legs[0]) : ''} · As directed</p>
          {quote?.hourly && (
            <p className="text-muted-foreground">
              {BUSINESS_HOURLY_PACKAGE_LABELS[quote.hourly.package]}: {quote.hourly.hours} hours
              {quote.hourly.includedKm ? `, ${quote.hourly.includedKm} km included` : ''}
              {quote.hourly.extraHourPrice ? `. Extra hour ${formatCurrency(quote.hourly.extraHourPrice)}` : ''}
            </p>
          )}
        </div>
      ) : (
        <ol className="space-y-4 text-sm">
          {legs.map((leg, index) => (
            <li key={index} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {businessLegLabel({ trip_type: tripType, leg_index: index }, legs.length)}
                </p>
                <p className="font-medium text-foreground">
                  {leg.from_location_name} → {leg.to_location_name}
                </p>
                <p className="text-muted-foreground">
                  {leg.pickup_address} → {leg.dropoff_address}
                </p>
                <p className="text-muted-foreground">{when(leg)}</p>
              </div>
              {quote?.legFares[index] !== undefined && (
                <span className="shrink-0 font-medium text-foreground">{formatCurrency(quote.legFares[index])}</span>
              )}
            </li>
          ))}
        </ol>
      )}

      {quote && quote.discount > 0 && (
        <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">Round-trip discount ({quote.discountPercent}%)</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">-{formatCurrency(quote.discount)}</span>
        </div>
      )}
    </div>
  );
}
