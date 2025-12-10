/**
 * Action Card Component
 * Quick action cards for dashboard
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight, Plus, Wallet, CalendarCheck, Settings } from 'lucide-react';


interface ActionCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Action title */
  title: string;
  /** Action description */
  description?: string;
  /** Icon to display */
  icon: ReactNode;
  /** Link href (if card is a link) */
  href?: string;
  /** Click handler (if not a link) */
  onClick?: () => void;
  /** Variant style */
  variant?: 'default' | 'primary';
  /** Animation delay */
  delay?: number;
}

const ActionCard = forwardRef<HTMLDivElement, ActionCardProps>(
  (
    {
      className,
      title,
      description,
      icon,
      href,
      onClick,
      variant = 'default',
      delay = 0,
      ...props
    },
    ref
  ) => {
    const isPrimary = variant === 'primary';

    const cardContent = (
      <>
        {/* Background gradient accent on hover */}
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-200 pointer-events-none',
            'bg-gradient-to-br from-primary/5 via-transparent to-transparent',
            'opacity-0 group-hover:opacity-100'
          )}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Icon Container - refined styling */}
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
              'border transition-all duration-200',
              isPrimary
                ? [
                    'bg-primary/10',
                    'border-primary/20',
                    'text-primary',
                    'group-hover:bg-primary/15',
                    'group-hover:border-primary/30',
                  ]
                : [
                    'bg-muted',
                    'border-border',
                    'text-muted-foreground',
                    'group-hover:bg-primary/10',
                    'group-hover:border-primary/20',
                    'group-hover:text-primary',
                  ]
            )}
          >
            {icon}
          </div>

          {/* Text content with proper spacing for arrow */}
          <div className="pr-10">
            <h3
              className={cn(
                'text-base font-semibold mb-1 transition-colors duration-150',
                'text-foreground',
                isPrimary && 'group-hover:text-primary'
              )}
            >
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Arrow indicator - enhanced slide-in animation */}
        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-primary">
          <ArrowRight
            className={cn(
              'w-5 h-5 transition-all duration-150',
              'opacity-0 -translate-x-2',
              'group-hover:opacity-100 group-hover:translate-x-0'
            )}
          />
        </div>
      </>
    );

    const baseClasses = cn(
      // Layout
      'relative group p-5 rounded-xl overflow-hidden',
      // Background
      'bg-card',
      // Border
      'border',
      'border-border',
      // Interaction
      'cursor-pointer',
      // Transitions
      'transition-all duration-200 ease-out',
      // Hover states
      'hover:border-primary/20',
      'hover:shadow-md',
      'hover:-translate-y-0.5',
      // Active state
      'active:scale-[0.99]',
      className
    );

    // Render as link or button
    if (href) {
      return (
        <Link href={href} className={baseClasses}>
          {cardContent}
        </Link>
      );
    }

    return (
      <div
        ref={ref}
        className={baseClasses}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick?.();
          }
        }}
        {...props}
      >
        {cardContent}
      </div>
    );
  }
);

ActionCard.displayName = 'ActionCard';

// Updated Quick Actions Grid - 2x2 layout for 4 cards
interface QuickActionsGridProps {
  children: ReactNode;
  className?: string;
}

const QuickActionsGrid = ({ children, className }: QuickActionsGridProps) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 gap-4',
        className
      )}
    >
      {children}
    </div>
  );
};

// Preset Quick Actions with Lucide icons
const NewBookingAction = ({ href = '/business/bookings/new' }) => (
  <ActionCard
    href={href}
    variant="primary"
    icon={<Plus className="h-6 w-6" />}
    title="New Booking"
    description="Create a new transfer booking for your customers"
  />
);

const WalletAction = ({ href = '/business/wallet' }) => (
  <ActionCard
    href={href}
    icon={<Wallet className="h-6 w-6" />}
    title="Wallet"
    description="View balance and manage your credits"
  />
);

const ViewBookingsAction = ({ href = '/business/bookings' }) => (
  <ActionCard
    href={href}
    icon={<CalendarCheck className="h-6 w-6" />}
    title="View Bookings"
    description="See all your transfer bookings"
  />
);

const SettingsAction = ({ href = '/business/settings' }) => (
  <ActionCard
    href={href}
    icon={<Settings className="h-6 w-6" />}
    title="Settings"
    description="Manage your account preferences"
  />
);

export {
  ActionCard,
  QuickActionsGrid,
  NewBookingAction,
  WalletAction,
  ViewBookingsAction,
  SettingsAction,
};
