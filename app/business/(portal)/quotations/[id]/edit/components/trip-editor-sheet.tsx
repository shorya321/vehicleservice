'use client';

/**
 * Edit one trip.
 *
 * A single scrolling form with progressive disclosure, NOT a 4-step wizard: the booking wizard
 * is tolerable once, but 4 gated steps x 5 trips is 20 forced navigations with no way to see
 * what you have already priced. Vehicle selection appears once the route and guests are valid.
 *
 * Only the action FUNCTIONS are imported from the bookings module, never its types. That file
 * is 'use server', and a type exported from one breaks at runtime while tsc stays silent.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { format, parse } from 'date-fns';
import { Car, Loader2, MapPin, Package, Receipt, Users } from 'lucide-react';
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
// Same date/time controls as the booking wizard's route step.
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { FormTimePicker } from '@/components/ui/form-time-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LocationSearchAutocomplete } from '@/components/search/location-search-autocomplete';
// Same titled-block chrome the New Quotation form uses, so the two quotation forms match.
import { FieldGroup } from '../../../components/field-group';
// Portal money format ("AED 150.00"); the customer PDF keeps formatAmount.
import { formatCurrency } from '@/lib/business/wallet-operations';
import { bookingLocalInputToUtc, bookingUtcToLocalInput } from '@/lib/utils/timezone';
import { getAvailableVehicleTypesForRoute } from '../../../../bookings/new/actions';
import { roundAed, applyMarkup } from '@/lib/business/quotations/pricing';
import { MarkupInput } from './markup-input';
import { AddonPicker, addonsReadyToSave, toPersistableAddons, type DraftAddon } from './addon-picker';
import type { LocationSearchResult } from '@/lib/types/location';
import type { QuotationTripDraft } from '@/lib/business/quotations/types';

/** Local shape for a vehicle option. Declared here, not imported from the 'use server' module. */
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

/**
 * `hhmm` rounded up to the next `stepMinutes` boundary. The earliest slot still bookable
 * today. The step matches FormTimePicker's default `minuteStep`, so what this returns is
 * always an option the picker actually offers.
 *
 * Rounding past 23:55 clamps rather than rolling into tomorrow: the operator picked today,
 * so the sheet must not move the day under them. In those last few minutes nothing is
 * genuinely bookable and the past-pickup hint says so.
 */
function nextTimeSlot(hhmm: string, stepMinutes = 5): string {
  const [h, m] = hhmm.split(':').map((part) => parseInt(part, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return '12:00';

  const rounded = Math.ceil(m / stepMinutes) * stepMinutes;
  const hour = rounded >= 60 ? h + 1 : h;
  const minute = rounded >= 60 ? 0 : rounded;

  if (hour > 23) return '23:55';
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

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

  /**
   * "Now" in Dubai wall-clock as 'yyyy-MM-ddTHH:mm', the lower bound for the two pickers.
   *
   * Read in an effect rather than during render: reading the clock while rendering risks a
   * server/client hydration mismatch, and a value captured once would go stale on a portal
   * left open across midnight. Re-reading on `open` refreshes it every time the sheet is
   * used. Null until mounted, which disables the bound rather than guessing it.
   */
  const [nowLocal, setNowLocal] = useState<string | null>(null);

  // Guards against an out-of-order response overwriting a newer one.
  const requestSeq = useRef(0);

  useEffect(() => {
    if (!open) return;
    const next = trip ? { ...trip } : emptyTrip();
    setDraft(next);
    setFromQuery(next.from_location_name ?? next.pickup_address ?? '');
    setToQuery(next.to_location_name ?? next.dropoff_address ?? '');
    setVehicles([]);
    setNowLocal(bookingUtcToLocalInput(new Date().toISOString()));
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

  /**
   * The three money fields that must move together.
   *
   * `bqi_amounts` asserts net_total_aed = ROUND(net_base_price_aed + net_addons_price_aed, 2), so
   * writing an addon total without rewriting net_total_aed makes the row unsaveable. Both the
   * vehicle picker and the extras picker go through here for exactly that reason.
   */
  function pricingPatch(netBase: number, netAddons: number) {
    const netTotal = roundAed(netBase + netAddons);
    return {
      net_base_price_aed: roundAed(netBase),
      net_addons_price_aed: roundAed(netAddons),
      net_total_aed: netTotal,
      // Recompute the sell price unless it was typed by hand.
      sell_total_aed:
        draft.price_mode === 'manual'
          ? draft.sell_total_aed
          : applyMarkup(
              netTotal,
              draft.price_mode === 'markup' ? draft.markup_percent ?? 0 : defaultMarkupPct
            ),
    };
  }

  function selectVehicle(vehicle: VehicleOption) {
    patch({
      vehicle_type_id: vehicle.id,
      vehicle_type_name: vehicle.name,
      ...pricingPatch(vehicle.price, draft.net_addons_price_aed),
    });
  }

  function setAddons(addons: DraftAddon[]) {
    const netAddons = addons.reduce((sum, a) => sum + a.total_price, 0);
    patch({
      addons: addons as QuotationTripDraft['addons'],
      ...pricingPatch(draft.net_base_price_aed, netAddons),
    });
  }

  const guestsValid =
    draft.passenger_count === draft.adults + draft.children + draft.infants &&
    draft.adults >= 1;

  // The stored value is UTC; the two controls below work in Dubai wall-clock, so split the
  // helper's 'yyyy-MM-ddTHH:mm' output rather than reading the Date in the browser's zone.
  const [pickupDateStr = '', pickupTimeStr = ''] = (
    draft.pickup_datetime ? bookingUtcToLocalInput(draft.pickup_datetime) : ''
  ).split('T');

  // Both bounds come from the same Dubai wall-clock string, so the date and the time
  // controls can never disagree about where "now" is.
  const [todayStr = '', nowTimeStr = ''] = (nowLocal ?? '').split('T');

  /**
   * Earliest month the calendar may navigate to.
   *
   * Normally the current month. An already-saved quotation can legitimately hold a past
   * pickup, though, and clamping to this month would hide that date from the calendar
   * entirely, so fall back to the selected month when it is older. The `disabled`
   * predicate still stops a past day from being picked.
   */
  const calendarStartMonth = todayStr
    ? parse(
        (pickupDateStr && pickupDateStr < todayStr ? pickupDateStr : todayStr).slice(0, 7),
        'yyyy-MM',
        new Date()
      )
    : undefined;

  // A pickup already in the past. Either loaded from an old quotation, or left behind by
  // the sheet sitting open past the chosen time. Surfaced as a hint, never a save block.
  const pickupInPast = Boolean(
    nowLocal && draft.pickup_datetime && bookingUtcToLocalInput(draft.pickup_datetime) < nowLocal
  );

  const canSave =
    routeReady &&
    guestsValid &&
    Boolean(draft.vehicle_type_id) &&
    draft.pickup_address.trim().length >= 5 &&
    draft.dropoff_address.trim().length >= 5 &&
    // A child seat without an age fails the zod schema and the DB CHECK; block it here so the
    // operator sees which field is missing instead of a save-time error.
    addonsReadyToSave(draft.addons as DraftAddon[]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* flex column + a min-h-0 scroll region: the previous h-[calc(100vh-11rem)] assumed a
          fixed header height and clipped or over-scrolled whenever the description wrapped. */}
      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-2xl">
        <SheetHeader className="shrink-0">
          <SheetTitle>{trip ? 'Edit trip' : 'Add trip'}</SheetTitle>
          <SheetDescription>
            Pick the route and guests first. Vehicles and pricing appear once those are set.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="-mr-4 min-h-0 flex-1 pr-4">
          <div className="space-y-4 py-4">
            {/* Route */}
            <FieldGroup title="Route" icon={MapPin} tone="bg-primary/10 text-primary">
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

              {/* Dubai wall-clock in, Dubai wall-clock out. `new Date(value)` would resolve
                  the input in the BROWSER's timezone and `.toISOString()` would redisplay it
                  as UTC, so an operator in India typing 10:00 saw it flip to 04:30 and the
                  trip was stored 1.5h off. Bookings run on Asia/Dubai; these helpers pin to it,
                  exactly as the booking wizard does. Splitting the field into a date and a time
                  control does not change that: both halves are recombined into the same
                  'yyyy-MM-ddTHH:mm' wall-clock string before it goes back through the helper. */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="pickup-date">Pickup date</Label>
                    <FormDatePicker
                      value={
                        pickupDateStr
                          ? parse(pickupDateStr, 'yyyy-MM-dd', new Date())
                          : undefined
                      }
                      onChange={(date) => {
                        if (!date) {
                          patch({ pickup_datetime: null });
                          return;
                        }
                        const d = format(date, 'yyyy-MM-dd');
                        // Noon rather than midnight when only a date is chosen, matching the
                        // booking wizard. Except on today, where noon is already gone by
                        // the afternoon and would stamp a past pickup the operator never
                        // typed. A time they DID choose is always kept, so moving a trip
                        // between days never discards it.
                        const fallbackTime =
                          d === todayStr && nowTimeStr ? nextTimeSlot(nowTimeStr) : '12:00';
                        patch({
                          pickup_datetime: bookingLocalInputToUtc(
                            `${d}T${pickupTimeStr || fallbackTime}`
                          ).toISOString(),
                        });
                      }}
                      // Compared as 'yyyy-MM-dd' strings: the calendar hands back a
                      // browser-local Date, so comparing Date objects against a Dubai
                      // instant would drift by the operator's offset.
                      disabled={(date) =>
                        Boolean(todayStr) && format(date, 'yyyy-MM-dd') < todayStr
                      }
                      startMonth={calendarStartMonth}
                      placeholder="Select date"
                      clearable
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pickup-time">Pickup time</Label>
                    <FormTimePicker
                      value={pickupTimeStr || undefined}
                      onChange={(time) => {
                        // A time with no date has nothing to attach to; ignore until a date exists.
                        if (!pickupDateStr) return;
                        patch({
                          pickup_datetime: bookingLocalInputToUtc(
                            `${pickupDateStr}T${time}`
                          ).toISOString(),
                        });
                      }}
                      // Only today's times need a floor; any later day is fully open.
                      minTime={
                        pickupDateStr && pickupDateStr === todayStr ? nowTimeStr : undefined
                      }
                      isDisabled={!pickupDateStr}
                      placeholder="Select time"
                      id="pickup-time"
                    />
                  </div>
                </div>
                {pickupInPast && (
                  <p className="text-xs text-destructive">
                    This pickup time has already passed, so it cannot be turned into a booking.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Leave empty to quote without a date. Undated trips cannot be turned into
                  bookings later.
                </p>
              </div>
            </FieldGroup>

            {/* Guests */}
            <FieldGroup title="Guests" icon={Users} tone="bg-sky-500/10 text-sky-500">
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
                          // Every guest occupies a seat, infants included. The DB CHECK and
                          // the booking validator both require this to hold exactly.
                          passenger_count: next.adults + next.children + next.infants,
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {draft.passenger_count} seat{draft.passenger_count === 1 ? '' : 's'}. Infants are
                included, as each needs a child seat.
              </p>
            </FieldGroup>

            {/* Vehicle. Disclosed only once the route is valid */}
            <FieldGroup title="Vehicle" icon={Car} tone="bg-violet-500/10 text-violet-500">
              {!routeReady ? (
                <p className="text-sm text-muted-foreground">
                  Choose a pickup and dropoff to see available vehicles.
                </p>
              ) : loadingVehicles ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Pricing this route...
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
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors',
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:bg-muted/50'
                        )}
                      >
                        <div>
                          <div className="font-medium text-foreground">{vehicle.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {vehicle.category} · up to {vehicle.capacity} guests
                          </div>
                        </div>
                        {/* Cost, not the sell price. This is the internal builder. */}
                        <div className="text-right text-sm tabular-nums text-muted-foreground">
                          cost {formatCurrency(vehicle.price, 'AED')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </FieldGroup>

            {/* Extras. Disclosed once a vehicle is chosen, since the price only means something
                alongside a base fare. Child seats are capped by the Guests block above. */}
            {draft.vehicle_type_id && (
              <FieldGroup
                title="Extras"
                icon={Package}
                tone="bg-amber-500/10 text-amber-500"
                description="Added to the trip's net cost. The customer sees the names, not the prices."
              >
                <AddonPicker
                  value={draft.addons as DraftAddon[]}
                  onChange={setAddons}
                  childSeatCapacity={draft.children + draft.infants}
                />
              </FieldGroup>
            )}

            {/* Pricing. Disclosed only once a vehicle is chosen */}
            {draft.vehicle_type_id && (
              <FieldGroup
                title="Price"
                icon={Receipt}
                tone="bg-emerald-500/10 text-emerald-500"
                description="Internal. The customer only ever sees the sell price."
              >
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
                      placeholder="Return leg, date to be confirmed"
                    />
                  </div>
              </FieldGroup>
            )}
          </div>
        </ScrollArea>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              // Drop the picker's draft-only fields (nullable ages, the requires_child_age hint)
              // so what leaves the sheet matches quotationAddonSchema and the DB column exactly.
              onSave({
                ...draft,
                addons: toPersistableAddons(draft.addons as DraftAddon[]),
              });
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
