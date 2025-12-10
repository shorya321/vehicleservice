'use client';

/**
 * Business Portal Luxury Dialog Component
 * Premium styled modal/dialog
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const LuxuryDialog = DialogPrimitive.Root;

const LuxuryDialogTrigger = DialogPrimitive.Trigger;

const LuxuryDialogPortal = DialogPrimitive.Portal;

const LuxuryDialogClose = DialogPrimitive.Close;

const LuxuryDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50',
      'bg-background/80 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
LuxuryDialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const LuxuryDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showClose?: boolean;
  }
>(({ className, children, showClose = true, ...props }, ref) => (
  <LuxuryDialogPortal>
    <LuxuryDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50',
        'w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
        'bg-card',
        'border border-border',
        'rounded-xl',
        'p-6 shadow-lg',
        'duration-200',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        className
      )}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close
          className={cn(
            'absolute right-4 top-4',
            'rounded-lg p-1.5',
            'text-muted-foreground',
            'hover:text-foreground',
            'hover:bg-muted',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'focus:ring-offset-card',
            'disabled:pointer-events-none'
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </LuxuryDialogPortal>
));
LuxuryDialogContent.displayName = DialogPrimitive.Content.displayName;

const LuxuryDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-2 text-center sm:text-left', className)}
    {...props}
  />
);
LuxuryDialogHeader.displayName = 'LuxuryDialogHeader';

const LuxuryDialogFooter = ({
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
LuxuryDialogFooter.displayName = 'LuxuryDialogFooter';

const LuxuryDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      'text-foreground',
      className
    )}
    {...props}
  />
));
LuxuryDialogTitle.displayName = DialogPrimitive.Title.displayName;

const LuxuryDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
LuxuryDialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  LuxuryDialog,
  LuxuryDialogPortal,
  LuxuryDialogOverlay,
  LuxuryDialogClose,
  LuxuryDialogTrigger,
  LuxuryDialogContent,
  LuxuryDialogHeader,
  LuxuryDialogFooter,
  LuxuryDialogTitle,
  LuxuryDialogDescription,
};
