/**
 * Luxury Select Component
 * Premium select/dropdown with indigo design system styling
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * SCOPE: Business module ONLY
 */

'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const LuxurySelect = SelectPrimitive.Root;

const LuxurySelectGroup = SelectPrimitive.Group;

const LuxurySelectValue = SelectPrimitive.Value;

const LuxurySelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-11 w-full items-center justify-between rounded-xl border border-[var(--business-border-default)] bg-[var(--business-surface-3)] px-4 py-2 text-sm text-[var(--business-text-primary)] font-[family-name:var(--business-font-body)] placeholder:text-[var(--business-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--business-primary-500)]/20 focus:border-[var(--business-primary-500)] hover:border-[var(--business-primary-500)]/40 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-[var(--business-primary-400)] opacity-70" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
LuxurySelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const LuxurySelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1 text-[var(--business-text-muted)]',
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
LuxurySelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const LuxurySelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1 text-[var(--business-text-muted)]',
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
LuxurySelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const LuxurySelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-[var(--business-border-default)] bg-[var(--business-surface-2)] backdrop-blur-md text-[var(--business-text-primary)] shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <LuxurySelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <LuxurySelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
LuxurySelectContent.displayName = SelectPrimitive.Content.displayName;

const LuxurySelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'py-1.5 pl-8 pr-2 text-sm font-semibold text-[var(--business-primary-400)] font-[family-name:var(--business-font-body)]',
      className
    )}
    {...props}
  />
));
LuxurySelectLabel.displayName = SelectPrimitive.Label.displayName;

const LuxurySelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm font-[family-name:var(--business-font-body)] text-[var(--business-text-secondary)] outline-none focus:bg-[var(--business-primary-500)]/10 focus:text-[var(--business-text-primary)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-[var(--business-primary-400)]" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
LuxurySelectItem.displayName = SelectPrimitive.Item.displayName;

const LuxurySelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-[var(--business-border-default)]', className)}
    {...props}
  />
));
LuxurySelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  LuxurySelect,
  LuxurySelectGroup,
  LuxurySelectValue,
  LuxurySelectTrigger,
  LuxurySelectContent,
  LuxurySelectLabel,
  LuxurySelectItem,
  LuxurySelectSeparator,
  LuxurySelectScrollUpButton,
  LuxurySelectScrollDownButton,
};
