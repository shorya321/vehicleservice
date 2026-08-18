'use client';

/**
 * Selectable Vehicle Type Card Component
 * For business booking wizard - allows selection (not navigation)
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Car, Users, Briefcase, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { BUSINESS_BASE_CURRENCY, formatCurrency } from '@/lib/business/wallet-operations';
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
  const [imageError, setImageError] = useState(false);

  const showImage = Boolean(vehicleType.image) && !imageError;

  return (
    <motion.button
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      onClick={() => onSelect(vehicleType)}
      className={cn(
        'group relative rounded-xl text-left overflow-hidden transition-all duration-300',
        'focus:outline-none',
        'border-2 card-hover',
        isSelected
          ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]'
          : 'border-border bg-card hover:border-primary/40 hover:shadow-md'
      )}
    >
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 h-7 w-7 rounded-lg bg-primary flex items-center justify-center shadow-md ring-2 ring-background">
          <Check className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      {/* Vehicle Image. Falls back to the icon so a missing or broken
          image_url keeps the card exactly the same height. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {showImage ? (
          <Image
            src={vehicleType.image as string}
            alt={vehicleType.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn(
              'object-cover transition-transform duration-500',
              prefersReducedMotion ? undefined : 'group-hover:scale-[1.03]'
            )}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300',
                isSelected ? 'bg-primary/20' : 'bg-primary/10'
              )}
            >
              <Car
                className={cn(
                  'h-6 w-6 transition-colors duration-300',
                  isSelected ? 'text-primary' : 'text-primary/70'
                )}
              />
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Info */}
      <div className="p-5">
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
          <p className="text-sm text-muted-foreground mb-1">Price</p>
          <p
            className={cn(
              'text-2xl font-bold transition-colors duration-300',
              isSelected ? 'text-primary' : 'text-foreground'
            )}
          >
            {formatCurrency(vehicleType.price, BUSINESS_BASE_CURRENCY)}
          </p>
          <p className="text-xs text-muted-foreground/70">per vehicle</p>
        </div>
      </div>
    </motion.button>
  );
}
