'use client';

/**
 * Business Portal Luxury Tabs Component
 * Premium styled tabs with underline indicator
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const LuxuryTabs = TabsPrimitive.Root;

const LuxuryTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1',
      'border-b border-border',
      'bg-transparent',
      className
    )}
    {...props}
  />
));
LuxuryTabsList.displayName = TabsPrimitive.List.displayName;

const LuxuryTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative inline-flex items-center justify-center whitespace-nowrap',
      'px-4 py-3',
      'text-sm font-medium',
      'text-muted-foreground',
      'transition-colors duration-150',
      'focus-visible:outline-none',
      'disabled:pointer-events-none disabled:opacity-50',
      // Hover state
      'hover:text-foreground',
      // Active state with underline indicator
      'data-[state=active]:text-primary',
      // Underline indicator using ::after pseudo-element
      'after:absolute after:bottom-[-1px] after:left-0 after:right-0',
      'after:h-[2px] after:rounded-t-sm',
      'after:bg-transparent after:transition-colors after:duration-150',
      'data-[state=active]:after:bg-primary',
      className
    )}
    {...props}
  />
));
LuxuryTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const LuxuryTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 ring-offset-background',
      'focus-visible:outline-none',
      'data-[state=inactive]:hidden',
      className
    )}
    {...props}
  />
));
LuxuryTabsContent.displayName = TabsPrimitive.Content.displayName;

export { LuxuryTabs, LuxuryTabsList, LuxuryTabsTrigger, LuxuryTabsContent };
