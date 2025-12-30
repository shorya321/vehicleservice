'use client';

/**
 * Business Portal Luxury Dropdown Menu Component
 * Premium styled dropdown menu with business design tokens
 *
 * SCOPE: Business module ONLY
 */

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const LuxuryDropdownMenu = DropdownMenuPrimitive.Root;

const LuxuryDropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const LuxuryDropdownMenuGroup = DropdownMenuPrimitive.Group;

const LuxuryDropdownMenuPortal = DropdownMenuPrimitive.Portal;

const LuxuryDropdownMenuSub = DropdownMenuPrimitive.Sub;

const LuxuryDropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const LuxuryDropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'font-business-body flex cursor-default select-none items-center rounded-[var(--business-radius-md)] px-2 py-1.5 text-sm outline-none',
      'text-[var(--business-text-primary)]',
      'focus:bg-[var(--business-primary-500)]/10',
      'data-[state=open]:bg-[var(--business-primary-500)]/10',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
LuxuryDropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const LuxuryDropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-[var(--business-z-dropdown)] min-w-[8rem] overflow-hidden',
      'rounded-[var(--business-radius-lg)]',
      'bg-[var(--business-surface-2)]',
      'border border-[var(--business-border-default)]',
      'p-1 shadow-lg',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
      'data-[side=bottom]:slide-in-from-top-2',
      'data-[side=left]:slide-in-from-right-2',
      'data-[side=right]:slide-in-from-left-2',
      'data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
));
LuxuryDropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const LuxuryDropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-[var(--business-z-dropdown)] min-w-[8rem] overflow-hidden',
        'rounded-[var(--business-radius-lg)]',
        'bg-[var(--business-surface-2)]',
        'border border-[var(--business-border-default)]',
        'p-1 shadow-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
LuxuryDropdownMenuContent.displayName =
  DropdownMenuPrimitive.Content.displayName;

const LuxuryDropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'font-business-body relative flex cursor-pointer select-none items-center rounded-[var(--business-radius-md)] px-2 py-1.5 text-sm outline-none',
      'text-[var(--business-text-primary)]',
      'transition-colors duration-150',
      'focus:bg-[var(--business-primary-500)]/10 focus:text-[var(--business-primary-400)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
LuxuryDropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const LuxuryDropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'font-business-body relative flex cursor-pointer select-none items-center rounded-[var(--business-radius-md)] py-1.5 pl-8 pr-2 text-sm outline-none',
      'text-[var(--business-text-primary)]',
      'transition-colors duration-150',
      'focus:bg-[var(--business-primary-500)]/10 focus:text-[var(--business-primary-400)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-[var(--business-primary-400)]" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
LuxuryDropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const LuxuryDropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'font-business-body relative flex cursor-pointer select-none items-center rounded-[var(--business-radius-md)] py-1.5 pl-8 pr-2 text-sm outline-none',
      'text-[var(--business-text-primary)]',
      'transition-colors duration-150',
      'focus:bg-[var(--business-primary-500)]/10 focus:text-[var(--business-primary-400)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current text-[var(--business-primary-400)]" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
LuxuryDropdownMenuRadioItem.displayName =
  DropdownMenuPrimitive.RadioItem.displayName;

const LuxuryDropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'font-business-body px-2 py-1.5 text-xs font-semibold',
      'text-[var(--business-text-muted)]',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));
LuxuryDropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const LuxuryDropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-[var(--business-border-subtle)]', className)}
    {...props}
  />
));
LuxuryDropdownMenuSeparator.displayName =
  DropdownMenuPrimitive.Separator.displayName;

const LuxuryDropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        'ml-auto text-xs tracking-widest text-[var(--business-text-muted)]',
        className
      )}
      {...props}
    />
  );
};
LuxuryDropdownMenuShortcut.displayName = 'LuxuryDropdownMenuShortcut';

export {
  LuxuryDropdownMenu,
  LuxuryDropdownMenuTrigger,
  LuxuryDropdownMenuContent,
  LuxuryDropdownMenuItem,
  LuxuryDropdownMenuCheckboxItem,
  LuxuryDropdownMenuRadioItem,
  LuxuryDropdownMenuLabel,
  LuxuryDropdownMenuSeparator,
  LuxuryDropdownMenuShortcut,
  LuxuryDropdownMenuGroup,
  LuxuryDropdownMenuPortal,
  LuxuryDropdownMenuSub,
  LuxuryDropdownMenuSubContent,
  LuxuryDropdownMenuSubTrigger,
  LuxuryDropdownMenuRadioGroup,
};
