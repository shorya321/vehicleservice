'use client';

/**
 * Selectable Vehicle Type Card Component
 * For business booking wizard - allows selection (not navigation)
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { motion } from 'motion/react';
import { Car, Users, Briefcase, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/business/animation/hooks';
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
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => onSelect(vehicleType)}
      className={cn(
        'relative p-5 rounded-xl text-left transition-all duration-300',
        'focus:outline-none',
        'border-2 card-hover',
        isSelected
          ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]'
          : 'border-border bg-card hover:border-primary/40 hover:shadow-md'
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
        <motion.div
          whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={cn(
            'h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300',
            isSelected ? 'bg-primary/20' : 'bg-primary/10'
          )}
        >
          <Car className={cn(
            'h-6 w-6 transition-colors duration-300',
            isSelected ? 'text-primary' : 'text-primary/70'
          )} />
        </motion.div>
      </div>

      {/* Vehicle Info */}
      <div>
        <div>
          <h3 className={cn(
            'font-semibold text-lg mb-1 transition-colors duration-300',
            isSelected ? 'text-primary' : 'text-foreground'
          )}>
            {vehicleType.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {vehicleType.description}
          </p>
        </div>

        {/* Capacity */}
        <div className="flex gap-4 text-sm mb-4">
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
    </motion.button>
  );
}
