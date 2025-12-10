'use client';

/**
 * Selectable Vehicle Type Card Component
 * For business booking wizard - allows selection (not navigation)
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
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
        'relative p-6 rounded-xl text-left transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background',
        'border-2',
        isSelected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
      )}
    >
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
          <Check className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      {/* Vehicle Icon */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            'h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300',
            isSelected ? 'bg-primary/20' : 'bg-primary/10'
          )}
        >
          <Car className={cn(
            'h-6 w-6 transition-colors duration-300',
            isSelected ? 'text-primary' : 'text-primary/70'
          )} />
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="space-y-3">
        <div>
          <h3 className={cn(
            'font-semibold text-lg mb-1 transition-colors duration-300',
            isSelected ? 'text-primary' : 'text-foreground'
          )}>
            {vehicleType.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {vehicleType.description}
          </p>
        </div>

        {/* Capacity */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-4 w-4 text-primary/50" />
            <span>Up to {vehicleType.capacity}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Briefcase className="h-4 w-4 text-primary/50" />
            <span>{vehicleType.luggageCapacity} bags</span>
          </div>
        </div>

        {/* Price */}
        <div className="pt-3 border-t border-border">
          <p className="text-sm text-muted-foreground mb-1">Base Price</p>
          <p
            className={cn(
              'text-2xl font-bold transition-colors duration-300',
              isSelected ? 'text-primary' : 'text-foreground'
            )}
          >
            {formatCurrency(vehicleType.price)}
          </p>
          <p className="text-xs text-muted-foreground/70">per vehicle</p>
        </div>
      </div>
    </button>
  );
}
