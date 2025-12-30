'use client';

/**
 * Business Portal Luxury Alert Dialog Component
 * Premium styled confirmation modal with business design tokens
 *
 * SCOPE: Business module ONLY
 */

import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '@/lib/utils';
import { luxuryButtonVariants } from './luxury-button';

const LuxuryAlertDialog = AlertDialogPrimitive.Root;

const LuxuryAlertDialogTrigger = AlertDialogPrimitive.Trigger;

const LuxuryAlertDialogPortal = AlertDialogPrimitive.Portal;

const LuxuryAlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[var(--business-z-modal-backdrop)]',
      'bg-black/60 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
LuxuryAlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const LuxuryAlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <LuxuryAlertDialogPortal>
    <LuxuryAlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-[var(--business-z-modal)]',
        'w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
        'bg-[var(--business-surface-2)]',
        'border border-[var(--business-border-default)]',
        'rounded-[var(--business-radius-xl)]',
        'p-6 shadow-xl',
        'duration-200',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        className
      )}
      {...props}
    />
  </LuxuryAlertDialogPortal>
));
LuxuryAlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const LuxuryAlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-2 text-center sm:text-left', className)}
    {...props}
  />
);
LuxuryAlertDialogHeader.displayName = 'LuxuryAlertDialogHeader';

const LuxuryAlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
      className
    )}
    {...props}
  />
);
LuxuryAlertDialogFooter.displayName = 'LuxuryAlertDialogFooter';

const LuxuryAlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn(
      'font-business-display text-lg font-semibold leading-none tracking-tight',
      'text-[var(--business-text-primary)]'
    )}
    {...props}
  />
));
LuxuryAlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const LuxuryAlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn('font-business-body text-sm text-[var(--business-text-muted)]', className)}
    {...props}
  />
));
LuxuryAlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const LuxuryAlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(luxuryButtonVariants({ variant: 'primary' }), className)}
    {...props}
  />
));
LuxuryAlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const LuxuryAlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(luxuryButtonVariants({ variant: 'secondary' }), className)}
    {...props}
  />
));
LuxuryAlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  LuxuryAlertDialog,
  LuxuryAlertDialogPortal,
  LuxuryAlertDialogOverlay,
  LuxuryAlertDialogTrigger,
  LuxuryAlertDialogContent,
  LuxuryAlertDialogHeader,
  LuxuryAlertDialogFooter,
  LuxuryAlertDialogTitle,
  LuxuryAlertDialogDescription,
  LuxuryAlertDialogAction,
  LuxuryAlertDialogCancel,
};
