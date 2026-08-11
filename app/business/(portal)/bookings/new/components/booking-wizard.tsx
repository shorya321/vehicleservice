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
import { calculateWizardTotal } from '@/lib/business/wizard-pricing';

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
}: BookingWizardProps) {
  const router = useRouter();
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
    setFormData((prev) => ({ ...prev, ...data }));
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
  const totalPrice = calculateWizardTotal(formData.base_price, formData.selected_addons);

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
            <RouteStep
              formData={formData}
              onUpdate={updateFormData}
              onNext={nextStep}
              onFetchVehicles={fetchAvailableVehicles}
            />
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
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
