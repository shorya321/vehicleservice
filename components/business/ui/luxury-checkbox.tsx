'use client';

/**
 * Business Portal Luxury Checkbox Component
 * Premium styled checkbox with business design tokens
 *
 * SCOPE: Business module ONLY
 */

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LuxuryCheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
  description?: string;
}

const LuxuryCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  LuxuryCheckboxProps
>(({ className, label, description, id, ...props }, ref) => {
  const checkboxId = id || React.useId();

  const checkbox = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={checkboxId}
      className={cn(
        'peer h-5 w-5 shrink-0',
        'rounded-[var(--business-radius-sm)]',
        'border border-[var(--business-border-default)]',
        'bg-[var(--business-surface-3)]',
        'ring-offset-[var(--business-surface-0)]',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[var(--business-primary-500)] focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'hover:border-[var(--business-border-hover)]',
        'data-[state=checked]:bg-[var(--business-primary-500)]',
        'data-[state=checked]:border-[var(--business-primary-500)]',
        'data-[state=checked]:text-white',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn('flex items-center justify-center text-current')}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (label || description) {
    return (
      <div className="flex items-start gap-3">
        {checkbox}
        <div className="space-y-0.5 leading-none">
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                'text-sm font-medium cursor-pointer',
                'text-[var(--business-text-primary)]',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
              )}
              style={{ fontFamily: 'var(--business-font-body)' }}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              className="text-sm text-[var(--business-text-muted)]"
              style={{ fontFamily: 'var(--business-font-body)' }}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return checkbox;
});
LuxuryCheckbox.displayName = CheckboxPrimitive.Root.displayName;

export { LuxuryCheckbox };
