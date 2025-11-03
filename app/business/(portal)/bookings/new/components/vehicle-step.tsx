'use client';

/**
 * Vehicle Step Component
 * Select vehicle type for the booking
 */

import { useState } from 'react';
import { Car, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { BookingFormData } from './booking-wizard';

interface VehicleType {
  id: string;
  name: string;
  description: string;
  base_price: number;
  max_passengers: number;
  max_luggage: number;
  image_url: string | null;
}

interface VehicleStepProps {
  formData: Partial<BookingFormData>;
  vehicleTypes: VehicleType[];
  onUpdate: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function VehicleStep({ formData, vehicleTypes, onUpdate, onNext, onBack }: VehicleStepProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    formData.vehicle_type_id || ''
  );

  function handleVehicleSelect(vehicleType: VehicleType) {
    setSelectedVehicleId(vehicleType.id);
    onUpdate({
      vehicle_type_id: vehicleType.id,
      base_price: vehicleType.base_price,
    });
  }

  function handleContinue() {
    if (!selectedVehicleId) return;
    onNext();
  }

  return (
    <div className="space-y-6">
      {/* Vehicle Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {vehicleTypes.map((vehicleType) => {
          const isSelected = selectedVehicleId === vehicleType.id;

          return (
            <button
              key={vehicleType.id}
              onClick={() => handleVehicleSelect(vehicleType)}
              className={cn(
                'p-4 border-2 rounded-lg text-left transition-all hover:border-primary',
                isSelected && 'border-primary bg-primary/5'
              )}
            >
              {/* Vehicle Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{vehicleType.name}</h3>
                    <p className="text-sm text-muted-foreground">{vehicleType.description}</p>
                  </div>
                  <Car className="h-8 w-8 text-primary" />
                </div>

                {/* Capacity */}
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Up to {vehicleType.max_passengers}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    <span>{vehicleType.max_luggage} bags</span>
                  </div>
                </div>

                {/* Price */}
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Base Price</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(vehicleType.base_price)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {vehicleTypes.length === 0 && (
        <div className="text-center py-12">
          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No vehicles available</h3>
          <p className="text-sm text-muted-foreground">Please contact support</p>
        </div>
      )}

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
