'use client';

/**
 * Booking Wizard Component
 * Multi-step form for creating bookings
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StepIndicator } from './step-indicator';
import { RouteStep } from './route-step';
import { VehicleStep } from './vehicle-step';
import { DetailsStep } from './details-step';
import { ReviewStep } from './review-step';
import { toast } from 'sonner';

import {
  VehicleTypeResult,
  VehicleTypesByCategory,
  ZoneInfo,
  AddonsByCategory,
  getAvailableVehicleTypesForRoute,
  getActiveAddons,
} from '../actions';
import { SelectedAddon } from './addon-selection';
import { bookingLocalInputToUtc } from '@/lib/business/utils/timezone';
import { calculateAddonsTotal, calculateWizardTotal } from '@/lib/business/wizard-pricing';
import { capChildSeats } from '@/lib/business/child-seat-capacity';
import { businessTripWizardTotal } from '@/lib/business/trips/wizard-total';
import type { BusinessTripSettings } from '@/lib/business/trips/settings';
import type { BusinessTripType } from '@/lib/business/trips/types';
import { TripTypeTabs } from './trips/trip-type-tabs';
import { TripRouteStep } from './trips/trip-route-step';
import { TripReviewSummary } from './trips/trip-review-summary';
import { useBookingTrip } from './trips/use-booking-trip';

interface Location {
  id: string;
  name: string;
  city: string | null;
}

interface BookingWizardProps {
  businessUserId: string;
  businessAccountId: string;
  walletBalance: number;
  locations: Location[];
  /** Admin trip-type settings: which types are offered, limits, notice, discount. */
  tripSettings: BusinessTripSettings;
}

export interface BookingFormData {
  // Route
  from_location_id: string;
  to_location_id: string;
  from_location_name: string;
  to_location_name: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_datetime: string;

  // Vehicle
  vehicle_type_id: string;

  // Details
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  /** Every guest (adults + children + infants). A child seat occupies a seat position. */
  passenger_count: number;
  adults: number;
  children: number;
  infants: number;
  customer_notes?: string;
  reference_number?: string;

  // Addons
  selected_addons?: SelectedAddon[];

  // Pricing.
  // `base_price` is stored because it is HMAC-signed by the server quote.
  // `total_price` is deliberately NOT here. It is derived (base + add-ons) in this component and
  // passed down explicitly. Keeping it in state is what let a vehicle change silently wipe the
  // add-ons total, and it would also ride the `...apiData` spread in handleSubmit unnoticed.
  base_price: number;

  // Price signature (HMAC)
  price_signature: string;
  price_signature_timestamp: number;
  price_signature_nonce: string;
}

const STEPS = ['Route', 'Vehicle', 'Details', 'Review'];

export function BookingWizard({
  businessUserId,
  businessAccountId,
  walletBalance,
  locations,
  tripSettings,
}: BookingWizardProps) {
  const router = useRouter();
  const trip = useBookingTrip();
  const tripOptions: BusinessTripType[] = [
    'one_way',
    ...(tripSettings.round_trip_enabled ? (['round_trip'] as const) : []),
    ...(tripSettings.multi_city_enabled ? (['multi_city'] as const) : []),
    ...(tripSettings.hourly_enabled ? (['hourly'] as const) : []),
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    passenger_count: 1,
    adults: 1,
    children: 0,
    infants: 0,
    selected_addons: [],
  });

  // Vehicle loading state
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeResult[]>([]);
  const [vehicleTypesByCategory, setVehicleTypesByCategory] = useState<
    VehicleTypesByCategory[]
  >([]);
  const [zoneInfo, setZoneInfo] = useState<ZoneInfo | undefined>();
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [vehicleFetchError, setVehicleFetchError] = useState<string | undefined>();

  // Addons state
  const [addonsByCategory, setAddonsByCategory] = useState<AddonsByCategory[]>([]);
  const [isLoadingAddons, setIsLoadingAddons] = useState(true);

  // Fetch addons on mount
  useEffect(() => {
    async function fetchAddons() {
      setIsLoadingAddons(true);
      try {
        const result = await getActiveAddons();
        if (!result.error) {
          setAddonsByCategory(result.addonsByCategory);
        }
      } catch (error) {
        console.error('Failed to fetch addons:', error);
      } finally {
        setIsLoadingAddons(false);
      }
    }
    fetchAddons();
  }, []);

  function updateFormData(data: Partial<BookingFormData>) {
    setFormData((prev) => {
      const next = { ...prev, ...data };
      // Guests are chosen on the Route step and seats on the Review step, so guests can be lowered
      // after the seats were picked. Left alone the seats stay in state, still priced but hidden
      // (AddonSelection drops the whole group at capacity 0), and the API rejects the booking with
      // no control left on screen to remove them. capChildSeats returns `prev`'s own array
      // whenever nothing needs trimming, so this is identity-stable on every other update.
      const capped = capChildSeats(
        next.selected_addons ?? [],
        (next.children ?? 0) + (next.infants ?? 0)
      );
      return capped === next.selected_addons ? next : { ...next, selected_addons: capped };
    });
  }

  /**
   * Forget the signed price quote and the vehicle it belongs to.
   *
   * These five fields are one unit: the signature authenticates that exact vehicle and base price
   * for that exact route, so keeping any of them past a route change is what produces the
   * "Price quote verification failed" 403 at POST /api/business/bookings.
   */
  function clearPriceQuote() {
    setFormData((prev) => ({
      ...prev,
      vehicle_type_id: undefined,
      base_price: undefined,
      price_signature: undefined,
      price_signature_timestamp: undefined,
      price_signature_nonce: undefined,
    }));
  }

  // Derived every render, so changing vehicle after picking add-ons can never drop them from the
  // total. Mirrors the server's calculateBusinessBookingPrice (basePrice + addonsPrice).
  // Trips charge add-ons once per journey; see lib/business/trips/wizard-total.ts.
  const totalPrice =
    trip.tripType === 'one_way'
      ? calculateWizardTotal(formData.base_price, formData.selected_addons)
      : businessTripWizardTotal(
          formData.base_price,
          calculateAddonsTotal(formData.selected_addons),
          trip.journeyCount
        );

  function resetVehicles() {
    clearPriceQuote();
    setVehicleTypes([]);
    setVehicleTypesByCategory([]);
    setZoneInfo(undefined);
    setVehicleFetchError(undefined);
  }

  function changeTripType(next: BusinessTripType) {
    if (next === trip.tripType) return;
    trip.changeType(next);
    resetVehicles();
  }

  /** Loads priced vehicles. Returns the reason on failure, which the Route step shows in place. */
  async function fetchTripVehicles(seatedPassengers: number): Promise<string | null> {
    setIsLoadingVehicles(true);
    resetVehicles();
    try {
      const result = await trip.loadVehicles(seatedPassengers || 1);
      if (result.error) return result.error;
      setVehicleTypes(result.vehicleTypes);
      setVehicleTypesByCategory(result.vehicleTypesByCategory);
      nextStep();
      return null;
    } catch {
      return 'Failed to load vehicles. Please try again.';
    } finally {
      setIsLoadingVehicles(false);
    }
  }

  async function fetchAvailableVehicles(
    fromLocationId: string,
    toLocationId: string,
    seatedPassengers: number
  ) {
    setIsLoadingVehicles(true);
    setVehicleFetchError(undefined);

    // Drop the held quote before refetching. The signature covers the route, the vehicle and the
    // base price, so one minted for the previous route stops matching the moment the route changes.
    // The Vehicle step reads its selection from here, so clearing it also deselects the card and
    // forces a fresh pick - otherwise the stale signature rides along to the API and 403s there.
    clearPriceQuote();

    try {
      // Seated count is passed in explicitly: updateFormData() above only
      // queues a state update, so reading formData here would be stale.
      const result = await getAvailableVehicleTypesForRoute(
        fromLocationId,
        toLocationId,
        seatedPassengers || 1,
        businessAccountId
      );

      if (result.error) {
        setVehicleFetchError(result.error);
        setVehicleTypes([]);
        setVehicleTypesByCategory([]);
        setZoneInfo(undefined);
      } else {
        setVehicleTypes(result.vehicleTypes);
        setVehicleTypesByCategory(result.vehicleTypesByCategory);
        setZoneInfo(result.zoneInfo);
      }
    } catch (error) {
      setVehicleFetchError('Failed to load vehicles. Please try again.');
      setVehicleTypes([]);
      setVehicleTypesByCategory([]);
      setZoneInfo(undefined);
    } finally {
      setIsLoadingVehicles(false);
    }
  }

  function nextStep() {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function previousStep() {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  async function handleSubmit() {
    // The quote is cleared whenever the route is refetched, so a missing one means the user changed
    // the route and never re-picked a vehicle. Send them back rather than posting a request the API
    // can only reject.
    if (!formData.vehicle_type_id || !formData.price_signature) {
      toast.error('Vehicle selection expired', {
        description: 'The route changed. Please pick the vehicle again.',
      });
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);

    const tripFields = trip.submitFields();
    if (tripFields) {
      await submitTrip(tripFields);
      return;
    }

    try {
      // Strip display-only fields and convert datetime to ISO 8601.
      // total_price is derived here rather than carried in formData, so it is set explicitly,
      // the API requires it (validators.ts: z.number().positive()).
      const { from_location_name, to_location_name, ...apiData } = formData;
      const submissionData = {
        ...apiData,
        total_price: totalPrice,
        pickup_datetime: apiData.pickup_datetime
          ? bookingLocalInputToUtc(apiData.pickup_datetime).toISOString()
          : apiData.pickup_datetime,
        // Narrow add-ons to the API's contract. The Review step blocks submission until every
        // child seat has an age, so the nulls are already gone; `requires_child_age` is a local
        // rendering hint and the API re-reads the real flag from the addons table.
        selected_addons: apiData.selected_addons?.map((a) => ({
          addon_id: a.addon_id,
          quantity: a.quantity,
          unit_price: a.unit_price,
          total_price: a.total_price,
          ...(a.child_ages
            ? { child_ages: a.child_ages.filter((v): v is number => v !== null) }
            : {}),
        })),
      };

      const response = await fetch('/api/business/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      toast.success('Success!', {
        description: `Booking ${result.data.trip_number || result.data.booking_number} created successfully.`,
      });

      router.push('/business/bookings');
      router.refresh();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to create booking',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitTrip(tripFields: NonNullable<ReturnType<typeof trip.submitFields>>) {
    try {
      const response = await fetch('/api/business/bookings/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tripFields,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          customer_notes: formData.customer_notes || undefined,
          reference_number: formData.reference_number || undefined,
          vehicle_type_id: formData.vehicle_type_id,
          passenger_count: formData.passenger_count,
          adults: formData.adults,
          children: formData.children,
          infants: formData.infants,
          base_price: formData.base_price,
          price_signature: formData.price_signature,
          price_signature_timestamp: formData.price_signature_timestamp,
          price_signature_nonce: formData.price_signature_nonce,
          selected_addons: formData.selected_addons?.map((a) => ({
            addon_id: a.addon_id,
            quantity: a.quantity,
            ...(a.child_ages ? { child_ages: a.child_ages.filter((v): v is number => v !== null) } : {}),
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create booking');

      const reference = result.data.group_number || result.data.trip_number || result.data.booking_number;
      toast.success('Success!', { description: `Booking ${reference} created successfully.` });
      router.push('/business/bookings');
      router.refresh();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to create booking',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Step Content - Luxury Card */}
      <Card className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-card',
        'border border-border',
        'shadow-sm'
      )}>
        <CardHeader className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-primary">
            {STEPS[currentStep]}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <div className="space-y-6">
              <TripTypeTabs value={trip.tripType} options={tripOptions} onChange={changeTripType} />
              {trip.tripType === 'one_way' ? (
                <RouteStep
                  formData={formData}
                  onUpdate={updateFormData}
                  onNext={nextStep}
                  onFetchVehicles={fetchAvailableVehicles}
                />
              ) : (
                <TripRouteStep
                  tripType={trip.tripType}
                  legs={trip.legs}
                  hourlyPackage={trip.hourlyPackage}
                  guests={{
                    adults: formData.adults ?? 1,
                    children: formData.children ?? 0,
                    infants: formData.infants ?? 0,
                  }}
                  settings={tripSettings}
                  onLegsChange={(next) => {
                    trip.setLegs(next);
                    resetVehicles();
                  }}
                  onPackageChange={(next) => {
                    trip.setHourlyPackage(next);
                    resetVehicles();
                  }}
                  onGuestsChange={(guests) => updateFormData(guests)}
                  onContinue={fetchTripVehicles}
                />
              )}
            </div>
          )}

          {currentStep === 1 && (
            <VehicleStep
              formData={formData}
              vehicleTypes={vehicleTypes}
              vehicleTypesByCategory={vehicleTypesByCategory}
              zoneInfo={zoneInfo}
              isLoading={isLoadingVehicles}
              error={vehicleFetchError}
              onUpdate={updateFormData}
              onNext={nextStep}
              onBack={previousStep}
            />
          )}

          {currentStep === 2 && (
            <DetailsStep
              formData={formData}
              onUpdate={updateFormData}
              onNext={nextStep}
              onBack={previousStep}
            />
          )}

          {currentStep === 3 && (
            <ReviewStep
              formData={formData as BookingFormData}
              totalPrice={totalPrice}
              walletBalance={walletBalance}
              locations={locations}
              vehicleTypes={vehicleTypes}
              zoneInfo={zoneInfo}
              addonsByCategory={addonsByCategory}
              isLoadingAddons={isLoadingAddons}
              onUpdate={updateFormData}
              onBack={previousStep}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              journeyCount={trip.journeyCount}
              tripSummary={
                trip.tripType === 'one_way' ? undefined : (
                  <TripReviewSummary
                    tripType={trip.tripType}
                    legs={trip.legs}
                    quote={formData.vehicle_type_id ? trip.quotes[formData.vehicle_type_id] : undefined}
                  />
                )
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
