'use client';

/**
 * Selectable Vehicle Type Card Component
 * For business booking wizard - allows selection (not navigation)
 */

import { Car, Users, Briefcase, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { VehicleTypeResult } from '../actions';

interface VehicleTypeCardProps {
  vehicleType: VehicleTypeResult;
  isSelected: boolean;
  onSelect: (vehicleType: VehicleTypeResult) => void;
}

export function VehicleTypeCard({
  vehicleType,
  isSelected,
  onSelect,
}: VehicleTypeCardProps) {
  return (
    <button
      onClick={() => onSelect(vehicleType)}
      className={cn(
        'relative p-6 border-2 rounded-lg text-left transition-all hover:border-primary hover:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isSelected ? 'border-primary bg-primary/5 shadow-lg' : 'border-border bg-card'
      )}
    >
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      {/* Vehicle Icon */}
      <div className="flex items-center justify-between mb-4">
        <Car className="h-10 w-10 text-primary" />
      </div>

      {/* Vehicle Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-lg mb-1">{vehicleType.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {vehicleType.description}
          </p>
        </div>

        {/* Capacity */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Up to {vehicleType.capacity}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>{vehicleType.luggageCapacity} bags</span>
          </div>
        </div>

        {/* Price */}
        <div className="pt-3 border-t">
          <p className="text-sm text-muted-foreground mb-1">Base Price</p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(vehicleType.price)}
          </p>
          <p className="text-xs text-muted-foreground">per vehicle</p>
        </div>
      </div>
    </button>
  );
}
