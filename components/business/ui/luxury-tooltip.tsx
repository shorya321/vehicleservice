'use client';

/**
 * Business Portal Luxury Tooltip Component
 * Premium styled tooltip with business design tokens
 *
 * SCOPE: Business module ONLY
 */

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

const LuxuryTooltipProvider = TooltipPrimitive.Provider;

const LuxuryTooltip = TooltipPrimitive.Root;

const LuxuryTooltipTrigger = TooltipPrimitive.Trigger;

const LuxuryTooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'font-business-body z-[var(--business-z-tooltip)]',
      'overflow-hidden rounded-[var(--business-radius-md)]',
      'bg-[var(--business-surface-3)]',
      'border border-[var(--business-border-default)]',
      'px-3 py-1.5',
      'text-sm text-[var(--business-text-primary)]',
      'shadow-md',
      'animate-in fade-in-0 zoom-in-95',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
      'data-[side=bottom]:slide-in-from-top-2',
      'data-[side=left]:slide-in-from-right-2',
      'data-[side=right]:slide-in-from-left-2',
      'data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
));
LuxuryTooltipContent.displayName = TooltipPrimitive.Content.displayName;

export {
  LuxuryTooltip,
  LuxuryTooltipTrigger,
  LuxuryTooltipContent,
  LuxuryTooltipProvider,
};
