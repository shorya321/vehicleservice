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
import Image from 'next/image';
import { toast } from 'sonner';
import { Car, Loader2, MapPin, Package, Receipt, Users } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/business/ui/button';
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
import { bookingLocalInputToUtc, bookingUtcToLocalInput } from '@/lib/business/utils/timezone';
import { adjustToFloor, effectiveLeadMinutes } from '@/lib/business/trips/pickup-floor';
import { validateBusinessPickupLead } from '@/lib/business/trips/validation';
import { usePickupFloor } from '../../../../bookings/new/components/trips/use-pickup-floor';
import { TripTypeTabs } from '../../../../bookings/new/components/trips/trip-type-tabs';
import type { BusinessTripSettings } from '@/lib/business/trips/settings';
import type { BusinessTripType } from '@/lib/business/trips/types';
import {
  isGroupedTrip,
  journeyCount,
  switchTripType,
  tripAddressesReady,
  tripRouteReady,
  tripTypeOf,
} from '@/lib/business/quotations/trip-legs';
import { loadTripVehicles, tripPricingKey, type SheetVehicle } from './load-trip-vehicles';
import { QuotationTripRoute } from './quotation-trip-route';
import { roundAed, applyMarkup, optionPricing } from '@/lib/business/quotations/pricing';
import {
  canAddVehicleOption,
  reconcileVehicleOptions,
  toggleVehicleOption,
  withoutMainVehicle,
} from '@/lib/business/quotations/vehicle-options';
import { MAX_VEHICLE_OPTIONS } from '@/lib/business/quotations/schema';
import { MarkupInput } from './markup-input';
import { VehicleOptionToggle } from './vehicle-option-toggle';
import { AddonPicker, addonsReadyToSave, toPersistableAddons, type DraftAddon } from './addon-picker';
import {
  childSeatShortfall,
  childSeatShortfallMessage,
  draftSeatCount,
} from '@/lib/business/child-seat-requirement';
import type { LocationSearchResult } from '@/lib/types/location';
import type { QuotationTripDraft } from '@/lib/business/quotations/types';

/** Local shape for a vehicle option. Declared here, not imported from the 'use server' module. */
type VehicleOption = SheetVehicle;

interface TripEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The trip being edited, or null when adding a new one. */
  trip: QuotationTripDraft | null;
  businessAccountId: string;
  currency: string;
  exchangeRate: number;
  defaultMarkupPct: number;
  /** Admin trip-type switches. Decide which types the sheet offers. */
  tripSettings: BusinessTripSettings;
  onSave: (trip: QuotationTripDraft) => void;
}

/** One way always; the others only while the admin has them switched on, or the trip already is one. */
function tripTypeOptions(settings: BusinessTripSettings, current: BusinessTripType): BusinessTripType[] {
  const enabled: Record<BusinessTripType, boolean> = {
    one_way: true,
    round_trip: settings.round_trip_enabled,
    multi_city: settings.multi_city_enabled,
    hourly: settings.hourly_enabled,
  };
  return (Object.keys(enabled) as BusinessTripType[]).filter((type) => enabled[type] || type === current);
}

/**
 * The money fields that must move together. `bqi_amounts` asserts
 * net_total_aed = ROUND(net_base_price_aed + net_addons_price_aed, 2), and the sell price follows
 * the net unless it was typed by hand.
 */
function tripPricing(trip: QuotationTripDraft, netBase: number, netAddons: number, defaultMarkupPct: number) {
  const netTotal = roundAed(netBase + netAddons);
  return {
    net_base_price_aed: roundAed(netBase),
    net_addons_price_aed: roundAed(netAddons),
    net_total_aed: netTotal,
    sell_total_aed:
      trip.price_mode === 'manual'
        ? trip.sell_total_aed
        : applyMarkup(netTotal, trip.price_mode === 'markup' ? trip.markup_percent ?? 0 : defaultMarkupPct),
  };
}

/** Add-on cost for the whole trip: once per journey, as the booking charges it. */
function tripAddonsNet(addons: readonly { total_price: number }[], journeys: number): number {
  return addons.reduce((sum, a) => sum + a.total_price, 0) * journeys;
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
  tripSettings,
  onSave,
}: TripEditorSheetProps) {
  // Edited on a COPY so Cancel genuinely discards.
  const [draft, setDraft] = useState<QuotationTripDraft>(emptyTrip());
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  /**
   * Whether the addon catalogue offers a child seat at all. Starts false so the seat rule below
   * cannot block Save before AddonPicker has reported, and stays false if every seat addon has
   * been deactivated in admin, where the rule would otherwise be unsatisfiable on screen.
   */
  const [seatAddonsAvailable, setSeatAddonsAvailable] = useState(false);

  /**
   * When the sheet was opened, for the lead-time hint on a loaded pickup.
   *
   * Read in an effect rather than during render: reading the clock while rendering risks a
   * server/client hydration mismatch. Re-reading on `open` refreshes it every time the sheet
   * is used. Null until mounted, which hides the hint rather than guessing.
   */
  const [openedAt, setOpenedAt] = useState<Date | null>(null);

  // The admin's business lead time: the pickers offer nothing sooner, as New Booking does and
  // as conversion requires. Null until mounted, which leaves the pickers unbounded.
  const leadMinutes = effectiveLeadMinutes('one_way', tripSettings);
  const floor = usePickupFloor(leadMinutes);

  // Guards against an out-of-order response overwriting a newer one.
  const requestSeq = useRef(0);
  // The route the trip had when the sheet opened. Re-quoting that same route must not touch the
  // saved vehicle or price; only a route the operator actually changed moves them.
  const openedKeyRef = useRef<string | null>(null);

  // Latest draft, for the vehicle loader below, which runs from a stale closure. Read there
  // only to decide whether to tell the operator an option was dropped.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (!open) return;
    const next = trip ? { ...trip } : emptyTrip();
    setDraft(next);
    setFromQuery(next.from_location_name ?? next.pickup_address ?? '');
    setToQuery(next.to_location_name ?? next.dropoff_address ?? '');
    setVehicles([]);
    openedKeyRef.current = trip ? tripPricingKey(next) : null;
    setOpenedAt(new Date());
  }, [open, trip]);

  const patch = useCallback((updates: Partial<QuotationTripDraft>) => {
    setDraft((current) => ({ ...current, ...updates }));
  }, []);

  const tripType = tripTypeOf(draft);
  const routeReady = tripRouteReady(draft);
  const pricingKey = tripPricingKey(draft);

  // Re-quote whenever the route or headcount changes. Debounced so dragging the guest count
  // does not fire a request per click.
  useEffect(() => {
    if (!open || !routeReady) {
      setVehicles([]);
      setVehicleError(null);
      return;
    }

    const seq = ++requestSeq.current;
    setLoadingVehicles(true);

    const timer = setTimeout(async () => {
      try {
        const result = await loadTripVehicles(draftRef.current, businessAccountId);
        if (seq !== requestSeq.current) return;
        const loaded = result.vehicles;
        setVehicles(loaded);
        setVehicleError(result.error);

        const before = draftRef.current;
        if (before.vehicle_options?.length) {
          const kept = reconcileVehicleOptions(before.vehicle_options, loaded, before.vehicle_type_id);
          const dropped = before.vehicle_options.length - kept.length;
          if (dropped > 0) {
            toast.warning(
              `${dropped} vehicle option${dropped === 1 ? ' is' : 's are'} not available for this route and guest count and ${dropped === 1 ? 'was' : 'were'} removed.`
            );
          }
        }

        // Refresh offered alternatives against the new route and guest count. Only after a
        // successful load: the catch below empties the list, which must not wipe them.
        // A trip without options is left untouched.
        setDraft((current) => {
          const withOptions = current.vehicle_options?.length
            ? {
                ...current,
                vehicle_options: reconcileVehicleOptions(
                  current.vehicle_options,
                  loaded,
                  current.vehicle_type_id
                ),
              }
            : current;
          // One way keeps its behaviour exactly. For the other types a journey added, moved or
          // re-dated changes the whole trip's price, so the chosen vehicle follows the new quote,
          // or is cleared when it can no longer drive the trip.
          if (tripTypeOf(withOptions) === 'one_way' || !withOptions.vehicle_type_id) return withOptions;
          // A failed or empty quote says nothing about the vehicle: keep it and show the error.
          if (result.error || loaded.length === 0) return withOptions;
          if (tripPricingKey(withOptions) === openedKeyRef.current) return withOptions;
          const main = loaded.find((v) => v.id === withOptions.vehicle_type_id);
          if (!main) {
            return { ...withOptions, vehicle_type_id: '', vehicle_type_name: undefined, vehicle_type_image: null };
          }
          return {
            ...withOptions,
            ...tripPricing(withOptions, main.price, withOptions.net_addons_price_aed, defaultMarkupPct),
          };
        });
      } catch {
        if (seq === requestSeq.current) setVehicles([]);
      } finally {
        if (seq === requestSeq.current) setLoadingVehicles(false);
      }
    }, VEHICLE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [open, routeReady, pricingKey, businessAccountId, defaultMarkupPct]);

  /**
   * The three money fields that must move together.
   *
   * `bqi_amounts` asserts net_total_aed = ROUND(net_base_price_aed + net_addons_price_aed, 2), so
   * writing an addon total without rewriting net_total_aed makes the row unsaveable. Both the
   * vehicle picker and the extras picker go through here for exactly that reason.
   */
  function pricingFor(trip: QuotationTripDraft, netBase: number, netAddons: number) {
    return tripPricing(trip, netBase, netAddons, defaultMarkupPct);
  }

  function pricingPatch(netBase: number, netAddons: number) {
    return pricingFor(draft, netBase, netAddons);
  }

  /** A route change. Re-derives the add-on cost, which follows the number of journeys. */
  function patchRoute(update: Partial<QuotationTripDraft>) {
    setDraft((current) => {
      const next = { ...current, ...update };
      const netAddons = tripAddonsNet(next.addons, journeyCount(next));
      return { ...next, ...pricingFor(next, next.net_base_price_aed, netAddons) };
    });
  }

  function changeTripType(type: BusinessTripType) {
    patchRoute(switchTripType(draft, type));
  }

  function selectVehicle(vehicle: VehicleOption) {
    patch({
      vehicle_type_id: vehicle.id,
      vehicle_type_name: vehicle.name,
      vehicle_type_image: vehicle.image ?? null,
      ...pricingPatch(vehicle.price, draft.net_addons_price_aed),
      // A vehicle promoted to main stops being an alternative. Untouched when there are none.
      ...(draft.vehicle_options?.length
        ? { vehicle_options: withoutMainVehicle(draft.vehicle_options, vehicle.id) }
        : {}),
    });
  }

  function toggleOption(vehicle: VehicleOption) {
    patch({
      vehicle_options: toggleVehicleOption(
        draft.vehicle_options ?? [],
        vehicle,
        draft.vehicle_type_id
      ),
    });
  }

  const offeredIds = new Set((draft.vehicle_options ?? []).map((o) => o.vehicle_type_id));
  const canAddOption = canAddVehicleOption(draft.vehicle_options ?? []);

  function setAddons(addons: DraftAddon[]) {
    const netAddons = tripAddonsNet(addons, journeyCount(draft));
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

  // Both bounds come from the same floor, so the date and the time controls can never
  // disagree about the earliest bookable pickup.
  const floorDate = floor?.date ?? '';

  /**
   * Earliest month the calendar may navigate to.
   *
   * Normally the current month. An already-saved quotation can legitimately hold a past
   * pickup, though, and clamping to this month would hide that date from the calendar
   * entirely, so fall back to the selected month when it is older. The `disabled`
   * predicate still stops a past day from being picked.
   */
  const calendarStartMonth = floorDate
    ? parse(
        (pickupDateStr && pickupDateStr < floorDate ? pickupDateStr : floorDate).slice(0, 7),
        'yyyy-MM',
        new Date()
      )
    : undefined;

  // A pickup that has passed or is inside the lead time, usually loaded from an old
  // quotation. Conversion would refuse it, so say so here. A hint, never a save block.
  const pickupLeadError =
    openedAt && draft.pickup_datetime
      ? validateBusinessPickupLead(draft.pickup_datetime, leadMinutes, openedAt)
      : null;

  /**
   * Every child and infant on the trip needs its own restraint.
   *
   * AddonPicker already refuses to go over children + infants, but nothing required reaching it,
   * so a trip could declare two infants, carry no seat at all, and be added with no message. The
   * conversion would then be refused by calculateBusinessBookingPrice long after the quotation
   * was sent to the customer.
   */
  const childSeatCapacity = draft.children + draft.infants;
  const seatShortfall = seatAddonsAvailable
    ? childSeatShortfall(draftSeatCount(draft.addons as DraftAddon[]), childSeatCapacity)
    : 0;

  const canSave =
    routeReady &&
    guestsValid &&
    Boolean(draft.vehicle_type_id) &&
    tripAddressesReady(draft) &&
    // A child seat without an age fails the zod schema and the DB CHECK; block it here so the
    // operator sees which field is missing instead of a save-time error.
    addonsReadyToSave(draft.addons as DraftAddon[]) &&
    // Independent of the line above: that one checks the ages on the seats chosen, this one
    // checks that enough seats were chosen at all.
    seatShortfall === 0;

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
              <TripTypeTabs
                value={tripType}
                options={tripTypeOptions(tripSettings, tripTypeOf(trip ?? draft))}
                onChange={changeTripType}
              />
              {tripType !== 'one_way' ? (
                <QuotationTripRoute trip={draft} settings={tripSettings} onChange={patchRoute} />
              ) : (
              <>
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
                        // Noon when only a date is chosen, as in New Booking, or the first
                        // bookable slot on the first bookable day. A chosen time is kept unless
                        // the new day makes it too soon, when it moves up to the floor.
                        const next = adjustToFloor(format(date, 'yyyy-MM-dd'), pickupTimeStr, floor);
                        patch({
                          pickup_datetime: bookingLocalInputToUtc(
                            `${next.date}T${next.time}`
                          ).toISOString(),
                        });
                      }}
                      // Compared as 'yyyy-MM-dd' strings: the calendar hands back a
                      // browser-local Date, so comparing Date objects against a Dubai
                      // instant would drift by the operator's offset.
                      disabled={(date) =>
                        Boolean(floorDate) && format(date, 'yyyy-MM-dd') < floorDate
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
                      // Only the first bookable day needs a floor; any later day is fully open.
                      minTime={
                        floor && pickupDateStr === floor.date ? floor.time : undefined
                      }
                      isDisabled={!pickupDateStr}
                      placeholder="Select time"
                      id="pickup-time"
                    />
                  </div>
                </div>
                {pickupLeadError && (
                  <p className="text-xs text-destructive">
                    {pickupLeadError} It cannot be turned into a booking until it is moved.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Leave empty to quote without a date. Undated trips cannot be turned into
                  bookings later.
                </p>
              </div>
              </>
              )}
            </FieldGroup>

            {/* Guests */}
            <FieldGroup title="Guests" icon={Users} tone="bg-primary/10 text-primary">
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
            <FieldGroup
              title="Vehicle"
              icon={Car}
              tone="bg-primary/10 text-primary"
              description={
                routeReady && !loadingVehicles && vehicles.length > 0
                  ? `Pick the vehicle to quote. Tick others to let the customer choose one instead (up to ${MAX_VEHICLE_OPTIONS}).`
                  : undefined
              }
            >
              {!routeReady ? (
                <p className="text-sm text-muted-foreground">
                  {tripType === 'one_way'
                    ? 'Choose a pickup and dropoff to see available vehicles.'
                    : tripType === 'hourly'
                      ? 'Choose a pickup, a package and a start date and time to see available vehicles.'
                      : 'Complete every journey, with its date and time, to see available vehicles.'}
                </p>
              ) : loadingVehicles ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Pricing this route...
                </div>
              ) : vehicles.length === 0 ? (
                <p className={cn('text-sm', vehicleError ? 'text-destructive' : 'text-muted-foreground')}>
                  {vehicleError ?? 'No vehicles are available for this route and guest count.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {vehicles.map((vehicle) => {
                    const selected = draft.vehicle_type_id === vehicle.id;
                    const offered = offeredIds.has(vehicle.id);
                    // One card per vehicle, so its "also offer" checkbox reads as part of it.
                    return (
                      <div
                        key={vehicle.id}
                        className={cn(
                          'overflow-hidden rounded-lg border transition-colors',
                          selected
                            ? 'border-primary bg-primary/5'
                            : offered
                              ? 'border-primary/40 bg-card'
                              : 'border-border bg-card'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => selectVehicle(vehicle)}
                          className={cn(
                            'flex w-full items-center justify-between p-3 text-left transition-colors',
                            !selected && 'hover:bg-muted/50'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {/* Thumbnail only when the type has one. The row keeps its
                                height without it. */}
                            {vehicle.image && (
                              <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                                <Image
                                  src={vehicle.image}
                                  alt=""
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 font-medium text-foreground">
                                {vehicle.name}
                                {selected && (
                                  <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                    Quoted vehicle
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {vehicle.category} · up to {vehicle.capacity} guests
                              </div>
                            </div>
                          </div>
                          {/* Cost, not the sell price. This is the internal builder. */}
                          <div className="text-right text-sm tabular-nums text-muted-foreground">
                            cost {formatCurrency(vehicle.price, 'AED')}
                          </div>
                        </button>
                        {/* Alternatives the customer may pick instead. Offered once a main
                            vehicle is chosen, on every other vehicle. */}
                        {draft.vehicle_type_id && !selected && (
                          <VehicleOptionToggle
                            vehicleId={vehicle.id}
                            vehicleName={vehicle.name}
                            checked={offered}
                            canAdd={canAddOption}
                            sellAed={
                              optionPricing(
                                vehicle.price,
                                draft.net_addons_price_aed,
                                draft,
                                defaultMarkupPct
                              ).sell_total_aed
                            }
                            currency={currency}
                            exchangeRate={exchangeRate}
                            onToggle={() => toggleOption(vehicle)}
                          />
                        )}
                      </div>
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
                tone="bg-primary/10 text-primary"
                description={
                  isGroupedTrip(draft)
                    ? `Added to the trip's net cost once per journey (${journeyCount(draft)}). The customer sees the names, not the prices.`
                    : "Added to the trip's net cost. The customer sees the names, not the prices."
                }
              >
                <AddonPicker
                  value={draft.addons as DraftAddon[]}
                  onChange={setAddons}
                  childSeatCapacity={childSeatCapacity}
                  onSeatAddonsAvailable={setSeatAddonsAvailable}
                />
                {seatShortfall > 0 && (
                  <p className="text-sm text-destructive" role="alert">
                    {childSeatShortfallMessage(seatShortfall, childSeatCapacity)}
                  </p>
                )}
              </FieldGroup>
            )}

            {/* Pricing. Disclosed only once a vehicle is chosen */}
            {draft.vehicle_type_id && (
              <FieldGroup
                title="Price"
                icon={Receipt}
                tone="bg-primary/10 text-primary"
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
