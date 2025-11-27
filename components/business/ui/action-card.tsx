/**
 * Action Card Component
 * Quick action cards for dashboard
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * SCOPE: Business module ONLY
 */

'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardHover } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
  variant?: 'default' | 'primary' | 'outline';
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
    const prefersReducedMotion = useReducedMotion();

    const variantStyles = {
      default:
        'bg-[var(--business-surface-2)] border-[rgba(99,102,241,0.2)] hover:border-[rgba(99,102,241,0.5)] hover:bg-[var(--business-surface-3)]',
      primary:
        'bg-[rgba(99,102,241,0.15)] border-[rgba(99,102,241,0.4)] hover:border-[rgba(129,140,248,0.6)] hover:bg-[rgba(99,102,241,0.2)]',
      outline:
        'bg-transparent border-2 border-dashed border-[rgba(99,102,241,0.2)] hover:border-[rgba(99,102,241,0.5)] hover:bg-[rgba(22,22,25,0.5)]',
    };

    const iconVariantStyles = {
      default: 'bg-[var(--business-surface-3)] text-[var(--business-primary-400)]',
      primary: 'bg-[rgba(99,102,241,0.25)] text-[var(--business-primary-400)]',
      outline: 'bg-[var(--business-surface-2)] text-[var(--business-primary-400)]',
    };

    const cardContent = (
      <>
        {/* Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
            iconVariantStyles[variant]
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <h3
          className="text-lg font-medium text-[var(--business-text-primary)] mb-1"
          style={{ fontFamily: 'var(--business-font-display)' }}
        >
          {title}
        </h3>
        {description && (
          <p
            className="text-sm text-[var(--business-text-muted)]"
            style={{ fontFamily: 'var(--business-font-body)' }}
          >
            {description}
          </p>
        )}

        {/* Arrow indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--business-primary-400)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
          <ArrowRight className="w-5 h-5" />
        </div>
      </>
    );

    const baseClasses = cn(
      'relative group p-6 rounded-2xl border cursor-pointer transition-all',
      variantStyles[variant],
      'hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)] hover:-translate-y-1',
      className
    );

    // Animated wrapper
    const MotionWrapper = ({
      children,
    }: {
      children: ReactNode;
    }) => {
      if (prefersReducedMotion) {
        return <>{children}</>;
      }

      return (
        <motion.div
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          variants={cardHover}
          transition={{ delay }}
        >
          {children}
        </motion.div>
      );
    };

    // Render as link or button
    if (href) {
      return (
        <MotionWrapper>
          <Link href={href} className={baseClasses}>
            {cardContent}
          </Link>
        </MotionWrapper>
      );
    }

    return (
      <MotionWrapper>
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
      </MotionWrapper>
    );
  }
);

ActionCard.displayName = 'ActionCard';

// Quick Actions Grid
interface QuickActionsGridProps {
  children: ReactNode;
  className?: string;
}

const QuickActionsGrid = ({ children, className }: QuickActionsGridProps) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
        className
      )}
    >
      {children}
    </div>
  );
};

// Preset Quick Actions
const NewBookingAction = ({ href = '/business/bookings/new' }) => (
  <ActionCard
    href={href}
    variant="primary"
    icon={
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    }
    title="New Booking"
    description="Create a new transfer booking"
  />
);

const WalletAction = ({ href = '/business/wallet' }) => (
  <ActionCard
    href={href}
    icon={
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    }
    title="Wallet"
    description="Manage your credits"
  />
);

const ViewBookingsAction = ({ href = '/business/bookings' }) => (
  <ActionCard
    href={href}
    icon={
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    }
    title="View Bookings"
    description="See all your bookings"
  />
);

const SettingsAction = ({ href = '/business/settings' }) => (
  <ActionCard
    href={href}
    icon={
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    }
    title="Settings"
    description="Account settings"
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
