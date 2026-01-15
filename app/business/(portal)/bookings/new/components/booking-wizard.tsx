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

interface Location {
  id: string;
  name: string;
  city: string;
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
  pickup_address: string;
  dropoff_address: string;
  pickup_datetime: string;

  // Vehicle
  vehicle_type_id: string;

  // Details
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  passenger_count: number;
  customer_notes?: string;
  reference_number?: string;

  // Addons
  selected_addons?: SelectedAddon[];

  // Pricing
  base_price: number;
  total_price: number;
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

  async function fetchAvailableVehicles(fromLocationId: string, toLocationId: string) {
    setIsLoadingVehicles(true);
    setVehicleFetchError(undefined);

    try {
      const result = await getAvailableVehicleTypesForRoute(
        fromLocationId,
        toLocationId,
        formData.passenger_count || 1
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
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function previousStep() {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);

    try {
      // Convert datetime-local format to ISO 8601 format for API
      const submissionData = {
        ...formData,
        pickup_datetime: formData.pickup_datetime
          ? new Date(formData.pickup_datetime).toISOString()
          : formData.pickup_datetime,
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
        description: `Booking ${result.data.booking_number} created successfully.`,
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
              locations={locations}
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
