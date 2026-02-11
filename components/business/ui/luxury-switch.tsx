'use client';

/**
 * Business Portal Luxury Switch Component
 * Premium styled toggle switch
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

interface LuxurySwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
  description?: string;
}

const LuxurySwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  LuxurySwitchProps
>(({ className, label, description, id, ...props }, ref) => {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  const switchElement = (
    <SwitchPrimitive.Root
      ref={ref}
      id={switchId}
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center',
        'rounded-full border-2 border-transparent',
        'bg-muted',
        'ring-offset-background',
        'transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-primary',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full',
          'bg-background shadow-lg ring-0',
          'transition-transform duration-200',
          'data-[state=checked]:translate-x-5',
          'data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitive.Root>
  );

  if (label || description) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          {label && (
            <label
              htmlFor={switchId}
              className={cn(
                'text-sm font-medium cursor-pointer',
                'text-foreground',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {switchElement}
      </div>
    );
  }

  return switchElement;
});
LuxurySwitch.displayName = SwitchPrimitive.Root.displayName;

export { LuxurySwitch };
