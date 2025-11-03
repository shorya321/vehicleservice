'use client';

/**
 * Booking Wizard Component
 * Multi-step form for creating bookings
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StepIndicator } from './step-indicator';
import { RouteStep } from './route-step';
import { VehicleStep } from './vehicle-step';
import { DetailsStep } from './details-step';
import { ReviewStep } from './review-step';
import { toast } from 'sonner';

interface Location {
  id: string;
  name: string;
  city: string;
}

interface VehicleType {
  id: string;
  name: string;
  description: string;
  base_price: number;
  max_passengers: number;
  max_luggage: number;
  image_url: string | null;
}

interface BookingWizardProps {
  businessUserId: string;
  businessAccountId: string;
  walletBalance: number;
  locations: Location[];
  vehicleTypes: VehicleType[];
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
  luggage_count: number;
  customer_notes?: string;
  reference_number?: string;

  // Pricing
  base_price: number;
  amenities_price: number;
  total_price: number;
}

const STEPS = ['Route', 'Vehicle', 'Details', 'Review'];

export function BookingWizard({
  businessUserId,
  businessAccountId,
  walletBalance,
  locations,
  vehicleTypes,
}: BookingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    passenger_count: 1,
    luggage_count: 0,
    amenities_price: 0,
  });

  function updateFormData(data: Partial<BookingFormData>) {
    setFormData((prev) => ({ ...prev, ...data }));
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
      const response = await fetch('/api/business/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep]}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <RouteStep
              formData={formData}
              locations={locations}
              onUpdate={updateFormData}
              onNext={nextStep}
            />
          )}

          {currentStep === 1 && (
            <VehicleStep
              formData={formData}
              vehicleTypes={vehicleTypes}
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
