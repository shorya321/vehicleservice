'use client';

/**
 * Hourly hire: where the chauffeur starts, which package, and when.
 * SCOPE: Business module ONLY.
 */

import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { BUSINESS_AS_DIRECTED, BUSINESS_HOURLY_PACKAGE_LABELS } from '@/lib/business/trips/constants';
import { BUSINESS_HOURLY_PACKAGES, type BusinessHourlyPackage, type BusinessTripLegInput } from '@/lib/business/trips/types';
import { LocationField } from './location-field';
import { DateTimeFields } from './date-time-fields';

interface HourlyFieldsProps {
  leg: BusinessTripLegInput;
  hourlyPackage: BusinessHourlyPackage;
  minNoticeHours: number;
  onChange: (patch: Partial<BusinessTripLegInput>) => void;
  onPackageChange: (value: BusinessHourlyPackage) => void;
}

export function HourlyFields({ leg, hourlyPackage, minNoticeHours, onChange, onPackageChange }: HourlyFieldsProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Hourly Hire</h3>
          <p className="text-xs text-muted-foreground">
            A chauffeur at your disposal, {BUSINESS_AS_DIRECTED.toLowerCase()}.
            {minNoticeHours > 0 ? ` Book at least ${minNoticeHours} hours ahead.` : ''}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Package</Label>
        <div role="radiogroup" aria-label="Package" className="grid grid-cols-2 gap-2">
          {BUSINESS_HOURLY_PACKAGES.map((pkg) => (
            <button
              key={pkg}
              type="button"
              role="radio"
              aria-checked={pkg === hourlyPackage}
              onClick={() => onPackageChange(pkg)}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                pkg === hourlyPackage
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              )}
            >
              {BUSINESS_HOURLY_PACKAGE_LABELS[pkg]}
            </button>
          ))}
        </div>
      </div>

      <LocationField
        id="hourly-from"
        label="Pickup Location"
        name={leg.from_location_name ?? ''}
        role="pickup"
        placeholder="Search pickup location..."
        onSelect={(loc) => onChange({ from_location_id: loc.id, from_location_name: loc.name })}
      />

      <div className="space-y-2">
        <Label htmlFor="hourly-pickup-address">Pickup Address</Label>
        <Input
          id="hourly-pickup-address"
          placeholder="123 Main St, Hotel Entrance"
          value={leg.pickup_address}
          onChange={(e) => onChange({ pickup_address: e.target.value })}
        />
      </div>

      <DateTimeFields
        idPrefix="hourly"
        date={leg.date}
        time={leg.time}
        dateLabel="Start Date"
        timeLabel="Start Time"
        onChange={(next) => onChange(next)}
      />
    </div>
  );
}
