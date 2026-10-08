'use client';

/**
 * One journey of a round trip or multi-city trip: pickup, destination, both addresses, date, time.
 * SCOPE: Business module ONLY.
 *
 * `routeLocked` is the round-trip return: its locations are the outbound reversed and cannot be
 * edited here, only its addresses and time.
 */

import { MapPin, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/business/ui/button';
import type { BusinessTripLegInput } from '@/lib/business/trips/types';
import { LocationField } from './location-field';
import { DateTimeFields } from './date-time-fields';

interface JourneyCardProps {
  index: number;
  title: string;
  leg: BusinessTripLegInput;
  routeLocked?: boolean;
  onChange: (patch: Partial<BusinessTripLegInput>) => void;
  onRemove?: () => void;
}

export function JourneyCard({ index, title, leg, routeLocked, onChange, onRemove }: JourneyCardProps) {
  const id = `journey-${index}`;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        {onRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label={`Remove ${title}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {routeLocked ? (
        <p className="text-sm text-muted-foreground">
          {leg.from_location_name || 'Destination'} → {leg.to_location_name || 'Pickup'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Keyed on the stored id so a removed journey above never leaves its text behind. */}
          <LocationField
            key={`${id}-from-${leg.from_location_id}`}
            id={`${id}-from`}
            label="Pickup Location"
            name={leg.from_location_name ?? ''}
            role="pickup"
            placeholder="Search pickup location..."
            onSelect={(loc) => onChange({ from_location_id: loc.id, from_location_name: loc.name })}
          />
          <LocationField
            key={`${id}-to-${leg.to_location_id}`}
            id={`${id}-to`}
            label="Dropoff Location"
            name={leg.to_location_name ?? ''}
            role="dropoff"
            placeholder="Search dropoff location..."
            onSelect={(loc) => onChange({ to_location_id: loc.id, to_location_name: loc.name })}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${id}-pickup-address`}>Pickup Address</Label>
          <Input
            id={`${id}-pickup-address`}
            placeholder="123 Main St, Hotel Entrance"
            value={leg.pickup_address}
            onChange={(e) => onChange({ pickup_address: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-dropoff-address`}>Dropoff Address</Label>
          <Input
            id={`${id}-dropoff-address`}
            placeholder="456 Airport Blvd, Terminal 1"
            value={leg.dropoff_address}
            onChange={(e) => onChange({ dropoff_address: e.target.value })}
          />
        </div>
      </div>

      <DateTimeFields idPrefix={id} date={leg.date} time={leg.time} onChange={(next) => onChange(next)} />
    </div>
  );
}
