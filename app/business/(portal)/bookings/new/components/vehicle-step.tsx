'use client';

/**
 * Vehicle Step Component
 * Select vehicle type for the booking with category tabs
 *
 * Design: shadcn/ui theme-aware components
 */

import { useState } from 'react';
import { Car, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VehicleCategoryTabs } from './vehicle-category-tabs';
import { BookingFormData } from './booking-wizard';
import { VehicleTypeResult, VehicleTypesByCategory, ZoneInfo } from '../actions';
import { formatCurrency } from '@/lib/business/wallet-operations';

interface VehicleStepProps {
  formData: Partial<BookingFormData>;
  vehicleTypes: VehicleTypeResult[];
  vehicleTypesByCategory: VehicleTypesByCategory[];
  zoneInfo?: ZoneInfo;
  isLoading: boolean;
  error?: string;
  onUpdate: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function VehicleStep({
  formData,
  vehicleTypes,
  vehicleTypesByCategory,
  zoneInfo,
  isLoading,
  error,
  onUpdate,
  onNext,
  onBack,
}: VehicleStepProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    formData.vehicle_type_id || ''
  );

  function handleVehicleSelect(vehicleType: VehicleTypeResult) {
    setSelectedVehicleId(vehicleType.id);
    onUpdate({
      vehicle_type_id: vehicleType.id,
      base_price: vehicleType.price,
      total_price: vehicleType.price + (formData.amenities_price || 0),
    });
  }

  function handleContinue() {
    if (!selectedVehicleId) return;
    onNext();
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <h3 className="text-lg font-medium mb-2 text-foreground">Loading available vehicles...</h3>
          <p className="text-sm text-muted-foreground">
            Finding vehicles for your selected route
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled>
            Back
          </Button>
          <Button type="button" disabled>
            Continue to Details
          </Button>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="text-center py-8">
          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2 text-foreground">No vehicles available</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please select different locations or contact support.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back to Route Selection
          </Button>
        </div>
      </div>
    );
  }

  // Empty State
  if (vehicleTypes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2 text-foreground">No vehicles available</h3>
          <p className="text-sm text-muted-foreground">
            No vehicles found for the selected route.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Zone Information Banner */}
      {zoneInfo && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {zoneInfo.fromZone.name} → {zoneInfo.toZone.name}
              </p>
              <p className="text-xs text-muted-foreground">Zone Transfer</p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 text-sm font-semibold">
            Base: {formatCurrency(zoneInfo.basePrice)}
          </span>
        </div>
      )}

      {/* Vehicle Category Tabs */}
      <VehicleCategoryTabs
        vehicleTypesByCategory={vehicleTypesByCategory}
        allVehicleTypes={vehicleTypes}
        selectedId={selectedVehicleId}
        onSelect={handleVehicleSelect}
      />

      {/* Actions */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={handleContinue} disabled={!selectedVehicleId}>
          Continue to Details
        </Button>
      </div>
    </div>
  );
}
