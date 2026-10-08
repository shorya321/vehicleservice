/**
 * Every journey of a round trip or multi-city trip, shown on each journey's detail page, with the
 * journey being viewed highlighted and the others linked.
 * SCOPE: Business module ONLY.
 */

import Link from 'next/link';
import { Repeat, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { formatBookingDateTime } from '@/lib/business/utils/timezone';
import { businessLegLabel, businessTripTypeLabel } from '@/lib/business/trips/display';

export interface TripJourneyRow {
  id: string;
  leg_index: number | null;
  trip_number: string | null;
  booking_number: string;
  booking_status: string;
  pickup_datetime: string;
  total_price: number;
  from_name: string | null;
  to_name: string | null;
}

export interface TripGroupSummary {
  group_number: string;
  trip_type: string;
  leg_count: number;
  subtotal: number;
  discount_amount: number;
  total_price: number;
}

interface TripJourneysCardProps {
  currentId: string;
  group: TripGroupSummary;
  journeys: TripJourneyRow[];
}

export function TripJourneysCard({ currentId, group, journeys }: TripJourneysCardProps) {
  const Icon = group.trip_type === 'round_trip' ? Repeat : Route;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-4">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Icon className="h-4 w-4 text-primary" />
          {businessTripTypeLabel({ trip_type: group.trip_type })} {group.group_number}
        </h2>
        <span className="text-xs text-muted-foreground">
          {group.leg_count} journeys · {formatCurrency(group.total_price)} paid together
        </span>
      </div>
      <ol className="divide-y divide-border">
        {journeys.map((journey) => {
          const current = journey.id === currentId;
          const label = businessLegLabel({ trip_type: group.trip_type, leg_index: journey.leg_index }, group.leg_count);
          const body = (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {label}
                  {current && <span className="ml-2 normal-case tracking-normal text-muted-foreground">(viewing)</span>}
                </p>
                <p className="truncate text-sm font-medium text-foreground">
                  {journey.from_name || 'Unknown'} → {journey.to_name || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBookingDateTime(journey.pickup_datetime)} · {journey.trip_number || journey.booking_number}
                  {' · '}
                  <span className="capitalize">{journey.booking_status.replace('_', ' ')}</span>
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground">{formatCurrency(journey.total_price)}</span>
            </div>
          );
          return (
            <li key={journey.id} className={cn('px-5 py-3', current && 'bg-primary/5')}>
              {current ? (
                body
              ) : (
                <Link href={`/business/bookings/${journey.id}`} className="block rounded-md transition-colors hover:text-primary">
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      {group.discount_amount > 0 && (
        <div className="flex justify-between border-t border-border px-5 py-3 text-sm">
          <span className="text-muted-foreground">Round-trip discount</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">-{formatCurrency(group.discount_amount)}</span>
        </div>
      )}
    </div>
  );
}
