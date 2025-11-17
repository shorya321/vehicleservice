'use client';

/**
 * Vehicle Step Component
 * Select vehicle type for the booking with category tabs
 */

import { useState } from 'react';
import { Car, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
          <h3 className="text-lg font-medium mb-2">Loading available vehicles...</h3>
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
          <h3 className="text-lg font-medium mb-2">No vehicles available</h3>
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
          <h3 className="text-lg font-medium mb-2">No vehicles available</h3>
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
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {zoneInfo.fromZone.name} → {zoneInfo.toZone.name}
                </p>
                <p className="text-xs text-muted-foreground">Zone Transfer</p>
              </div>
            </div>
            <Badge variant="secondary">
              Base: {formatCurrency(zoneInfo.basePrice)}
            </Badge>
          </div>
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
