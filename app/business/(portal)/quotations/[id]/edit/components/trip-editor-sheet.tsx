'use client';

/**
 * Edit one trip.
 *
 * A single scrolling form with progressive disclosure, NOT a 4-step wizard: the booking wizard
 * is tolerable once, but 4 gated steps x 5 trips is 20 forced navigations with no way to see
 * what you have already priced. Vehicle selection appears once the route and guests are valid.
 *
 * Only the action FUNCTIONS are imported from the bookings module — never its types. That file
 * is 'use server', and a type exported from one breaks at runtime while tsc stays silent.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LocationSearchAutocomplete } from '@/components/search/location-search-autocomplete';
import { formatAmount } from '@/lib/currency/format';
import { bookingLocalInputToUtc, bookingUtcToLocalInput } from '@/lib/utils/timezone';
import { getAvailableVehicleTypesForRoute } from '../../../../bookings/new/actions';
import { roundAed, applyMarkup } from '@/lib/business/quotations/pricing';
import { MarkupInput } from './markup-input';
import type { LocationSearchResult } from '@/lib/types/location';
import type { QuotationTripDraft } from '@/lib/business/quotations/types';

/** Local shape for a vehicle option — declared here, not imported from the 'use server' module. */
interface VehicleOption {
  id: string;
  name: string;
  category: string;
  capacity: number;
  price: number;
}

interface TripEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The trip being edited, or null when adding a new one. */
  trip: QuotationTripDraft | null;
  businessAccountId: string;
  currency: string;
  exchangeRate: number;
  defaultMarkupPct: number;
  onSave: (trip: QuotationTripDraft) => void;
}

const VEHICLE_DEBOUNCE_MS = 400;

const emptyTrip = (): QuotationTripDraft => ({
  sort_order: 0,
  from_location_id: '',
  to_location_id: '',
  pickup_address: '',
  dropoff_address: '',
  pickup_datetime: null,
  vehicle_type_id: '',
  passenger_count: 1,
  adults: 1,
  children: 0,
  infants: 0,
  description: null,
  addons: [],
  net_base_price_aed: 0,
  net_addons_price_aed: 0,
  net_total_aed: 0,
  sell_total_aed: 0,
  price_mode: 'inherited',
  markup_percent: null,
});

export function TripEditorSheet({
  open,
  onOpenChange,
  trip,
  businessAccountId,
  currency,
  exchangeRate,
  defaultMarkupPct,
  onSave,
}: TripEditorSheetProps) {
  // Edited on a COPY so Cancel genuinely discards.
  const [draft, setDraft] = useState<QuotationTripDraft>(emptyTrip());
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Guards against an out-of-order response overwriting a newer one.
  const requestSeq = useRef(0);

  useEffect(() => {
    if (!open) return;
    const next = trip ? { ...trip } : emptyTrip();
    setDraft(next);
    setFromQuery(next.from_location_name ?? next.pickup_address ?? '');
    setToQuery(next.to_location_name ?? next.dropoff_address ?? '');
    setVehicles([]);
  }, [open, trip]);

  const patch = useCallback((updates: Partial<QuotationTripDraft>) => {
    setDraft((current) => ({ ...current, ...updates }));
  }, []);

  const routeReady =
    Boolean(draft.from_location_id) &&
    Boolean(draft.to_location_id) &&
    draft.from_location_id !== draft.to_location_id;

  // Re-quote whenever the route or headcount changes. Debounced so dragging the guest count
  // does not fire a request per click.
  useEffect(() => {
    if (!open || !routeReady) {
      setVehicles([]);
      return;
    }

    const seq = ++requestSeq.current;
    setLoadingVehicles(true);

    const timer = setTimeout(async () => {
      try {
        const result = await getAvailableVehicleTypesForRoute(
          draft.from_location_id,
          draft.to_location_id,
          draft.passenger_count,
          businessAccountId
        );
        if (seq !== requestSeq.current) return;
        setVehicles(
          result.vehicleTypes.map((v) => ({
            id: v.id,
            name: v.name,
            category: v.category,
            capacity: v.capacity,
            price: v.price,
          }))
        );
      } catch {
        if (seq === requestSeq.current) setVehicles([]);
      } finally {
        if (seq === requestSeq.current) setLoadingVehicles(false);
      }
    }, VEHICLE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [open, routeReady, draft.from_location_id, draft.to_location_id, draft.passenger_count, businessAccountId]);

  function selectVehicle(vehicle: VehicleOption) {
    const netBase = roundAed(vehicle.price);
    const netTotal = roundAed(netBase + draft.net_addons_price_aed);
    patch({
      vehicle_type_id: vehicle.id,
      vehicle_type_name: vehicle.name,
      net_base_price_aed: netBase,
      net_total_aed: netTotal,
      // Recompute the sell price unless it was typed by hand.
      sell_total_aed:
        draft.price_mode === 'manual'
          ? draft.sell_total_aed
          : applyMarkup(
              netTotal,
              draft.price_mode === 'markup' ? draft.markup_percent ?? 0 : defaultMarkupPct
            ),
    });
  }

  const guestsValid =
    draft.passenger_count === draft.adults + draft.children + draft.infants &&
    draft.adults >= 1;

  const canSave =
    routeReady &&
    guestsValid &&
    Boolean(draft.vehicle_type_id) &&
    draft.pickup_address.trim().length >= 5 &&
    draft.dropoff_address.trim().length >= 5;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{trip ? 'Edit trip' : 'Add trip'}</SheetTitle>
          <SheetDescription>
            Pick the route and guests first — vehicles and pricing appear once those are set.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-11rem)] pr-4">
          <div className="space-y-6 py-4">
            {/* Route */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Route</h3>

              <div className="space-y-2">
                <Label>Pick up from</Label>
                <LocationSearchAutocomplete
                  value={fromQuery}
                  onChange={setFromQuery}
                  onSelect={(location: LocationSearchResult) => {
                    setFromQuery(location.name);
                    patch({
                      from_location_id: location.id,
                      from_location_name: location.name,
                      pickup_address: location.address || location.name,
                    });
                  }}
                  placeholder="Airport, hotel or area"
                  ariaLabel="Pickup location"
                />
                <Input
                  value={draft.pickup_address}
                  onChange={(e) => patch({ pickup_address: e.target.value })}
                  placeholder="Full pickup address"
                />
              </div>

              <div className="space-y-2">
                <Label>Drop off at</Label>
                <LocationSearchAutocomplete
                  value={toQuery}
                  onChange={setToQuery}
                  onSelect={(location: LocationSearchResult) => {
                    setToQuery(location.name);
                    patch({
                      to_location_id: location.id,
                      to_location_name: location.name,
                      dropoff_address: location.address || location.name,
                    });
                  }}
                  placeholder="Airport, hotel or area"
                  ariaLabel="Dropoff location"
                />
                <Input
                  value={draft.dropoff_address}
                  onChange={(e) => patch({ dropoff_address: e.target.value })}
                  placeholder="Full dropoff address"
                />
              </div>

              {draft.from_location_id &&
                draft.from_location_id === draft.to_location_id && (
                  <p className="text-sm text-destructive">
                    Pickup and dropoff must be different locations.
                  </p>
                )}

              <div className="space-y-2">
                <Label htmlFor="pickup-when">Pickup date &amp; time</Label>
                {/* Dubai wall-clock in, Dubai wall-clock out. `new Date(value)` would resolve
                    the input in the BROWSER's timezone and `.toISOString()` would redisplay it
                    as UTC — so an operator in India typing 10:00 saw it flip to 04:30 and the
                    trip was stored 1.5h off. Bookings run on Asia/Dubai; these helpers pin to it,
                    exactly as the booking wizard does. */}
                <Input
                  id="pickup-when"
                  type="datetime-local"
                  value={
                    draft.pickup_datetime ? bookingUtcToLocalInput(draft.pickup_datetime) : ''
                  }
                  onChange={(e) =>
                    patch({
                      pickup_datetime: e.target.value
                        ? bookingLocalInputToUtc(e.target.value).toISOString()
                        : null,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to quote without a date. Undated trips cannot be turned into
                  bookings later.
                </p>
              </div>
            </section>

            <Separator />

            {/* Guests */}
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Guests
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(['adults', 'children', 'infants'] as const).map((key) => (
                  <div key={key} className="space-y-1">
                    <Label className="capitalize">{key}</Label>
                    <Input
                      type="number"
                      min={key === 'adults' ? 1 : 0}
                      max={20}
                      value={draft[key]}
                      onChange={(e) => {
                        const value = Math.max(0, Number(e.target.value) || 0);
                        const next = { ...draft, [key]: value };
                        patch({
                          [key]: value,
                          // Every guest occupies a seat, infants included — the DB CHECK and
                          // the booking validator both require this to hold exactly.
                          passenger_count: next.adults + next.children + next.infants,
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {draft.passenger_count} seat{draft.passenger_count === 1 ? '' : 's'} — infants
                included, as each needs a child seat.
              </p>
            </section>

            <Separator />

            {/* Vehicle — disclosed only once the route is valid */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Vehicle</h3>

              {!routeReady ? (
                <p className="text-sm text-muted-foreground">
                  Choose a pickup and dropoff to see available vehicles.
                </p>
              ) : loadingVehicles ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Pricing this route…
                </div>
              ) : vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No vehicles are available for this route and guest count.
                </p>
              ) : (
                <div className="space-y-2">
                  {vehicles.map((vehicle) => {
                    const selected = draft.vehicle_type_id === vehicle.id;
                    return (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() => selectVehicle(vehicle)}
                        className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                          selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{vehicle.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {vehicle.category} · up to {vehicle.capacity} guests
                          </div>
                        </div>
                        {/* Cost, not the sell price — this is the internal builder. */}
                        <div className="text-right text-sm tabular-nums text-muted-foreground">
                          cost {formatAmount(vehicle.price, 'AED')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Pricing — disclosed only once a vehicle is chosen */}
            {draft.vehicle_type_id && (
              <>
                <Separator />
                <section className="space-y-3">
                  <h3 className="text-sm font-medium">Price</h3>
                  <MarkupInput
                    netAed={draft.net_total_aed}
                    sellAed={draft.sell_total_aed}
                    priceMode={draft.price_mode}
                    markupPercent={draft.markup_percent}
                    defaultMarkupPct={defaultMarkupPct}
                    currency={currency}
                    exchangeRate={exchangeRate}
                    onChange={(update) => patch(update)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="trip-note">Note on the PDF (optional)</Label>
                    <Input
                      id="trip-note"
                      value={draft.description ?? ''}
                      onChange={(e) => patch({ description: e.target.value || null })}
                      placeholder="Return leg — date to be confirmed"
                    />
                  </div>
                </section>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
          >
            {trip ? 'Update trip' : 'Add trip'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
