/**
 * Hero Stat Card Component
 * Large prominent stat cards for dashboard hero sections
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * SCOPE: Business module ONLY
 */

'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CountUp, CurrencyCountUp, PercentageCountUp } from '@/components/business/motion/count-up';
import { fadeInUp } from '@/lib/business/animation/variants';
import { useReducedMotion, useInView } from '@/lib/business/animation/hooks';
import { LuxuryButton } from './luxury-button';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface HeroStatCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card title/label */
  title: string;
  /** Main value to display */
  value: number;
  /** Value format type */
  format?: 'number' | 'currency' | 'percentage';
  /** Currency symbol (if format is 'currency') */
  currency?: string;
  /** Decimal places */
  decimals?: number;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Icon to display */
  icon?: ReactNode;
  /** Action button text */
  actionLabel?: string;
  /** Action button click handler */
  onAction?: () => void;
  /** Trend indicator */
  trend?: {
    value: number;
    direction?: 'up' | 'down';
    label?: string;
  };
  /** Animation delay in seconds */
  delay?: number;
  /** Card variant for styling */
  variant?: 'default' | 'warning' | 'success' | 'info';
}

const HeroStatCard = forwardRef<HTMLDivElement, HeroStatCardProps>(
  (
    {
      className,
      title,
      value,
      format = 'number',
      currency = '$',
      decimals,
      subtitle,
      icon,
      actionLabel,
      onAction,
      trend,
      delay = 0,
      variant = 'default',
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const { ref: inViewRef, isInView } = useInView({ once: true });

    const variantStyles = {
      default: {
        border: 'border-[var(--business-primary-500)]/30',
        iconBg: 'bg-[var(--business-primary-500)]/10',
        iconColor: 'text-[var(--business-primary-400)]',
        labelColor: 'text-[var(--business-primary-400)]',
      },
      warning: {
        border: 'border-[var(--business-warning)]/30',
        iconBg: 'bg-[var(--business-warning)]/10',
        iconColor: 'text-[var(--business-warning)]',
        labelColor: 'text-[var(--business-warning)]',
      },
      success: {
        border: 'border-[var(--business-success)]/30',
        iconBg: 'bg-[var(--business-success)]/10',
        iconColor: 'text-[var(--business-success)]',
        labelColor: 'text-[var(--business-success)]',
      },
      info: {
        border: 'border-[var(--business-info)]/30',
        iconBg: 'bg-[var(--business-info)]/10',
        iconColor: 'text-[var(--business-info)]',
        labelColor: 'text-[var(--business-info)]',
      },
    };

    const styles = variantStyles[variant];

    const renderValue = () => {
      const valueClassName =
        'text-4xl lg:text-5xl font-medium text-[var(--business-text-primary)] tracking-tight';

      switch (format) {
        case 'currency':
          return (
            <CurrencyCountUp
              value={value}
              currency={currency}
              className={valueClassName}
              triggerOnView={!prefersReducedMotion}
            />
          );
        case 'percentage':
          return (
            <PercentageCountUp
              value={value}
              decimals={decimals ?? 1}
              className={valueClassName}
              triggerOnView={!prefersReducedMotion}
            />
          );
        default:
          return (
            <CountUp
              value={value}
              decimals={decimals ?? 0}
              className={valueClassName}
              triggerOnView={!prefersReducedMotion}
            />
          );
      }
    };

    const content = (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-2xl p-6 lg:p-8',
          'bg-gradient-to-br from-[var(--business-surface-1)] via-[var(--business-surface-2)] to-[var(--business-surface-1)]',
          'border',
          styles.border,
          'shadow-business-elevated',
          className
        )}
        {...props}
      >
        {/* Background gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--business-primary-500)]/5 to-transparent pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p
                className={cn(
                  'text-xs uppercase tracking-wider font-semibold mb-1',
                  styles.labelColor
                )}
                style={{ fontFamily: 'var(--business-font-body)' }}
              >
                {title}
              </p>
              {subtitle && (
                <p
                  className="text-sm text-[var(--business-text-muted)]"
                  style={{ fontFamily: 'var(--business-font-body)' }}
                >
                  {subtitle}
                </p>
              )}
            </div>
            {icon && (
              <div className={cn('p-3 rounded-xl', styles.iconBg, styles.iconColor)}>
                {icon}
              </div>
            )}
          </div>

          {/* Value */}
          <div className="mb-4" ref={inViewRef} style={{ fontFamily: 'var(--business-font-display)' }}>
            {renderValue()}
          </div>

          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-2 mb-4">
              <span
                className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  trend.direction === 'up' ? 'text-[var(--business-success)]' : 'text-[var(--business-error)]'
                )}
              >
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-sm text-[var(--business-text-muted)]">
                  {trend.label}
                </span>
              )}
            </div>
          )}

          {/* Action Button */}
          {actionLabel && onAction && (
            <LuxuryButton
              variant="secondary"
              size="sm"
              onClick={onAction}
              className="mt-2"
            >
              {actionLabel}
            </LuxuryButton>
          )}
        </div>
      </div>
    );

    // Wrap with motion for animation
    if (!prefersReducedMotion) {
      return (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay }}
        >
          {content}
        </motion.div>
      );
    }

    return content;
  }
);

HeroStatCard.displayName = 'HeroStatCard';

// Wallet Balance Hero Card - Preset configuration
interface WalletHeroCardProps extends Omit<HeroStatCardProps, 'format' | 'title'> {
  balance: number;
  currency?: string;
  onAddCredits?: () => void;
}

const WalletHeroCard = ({
  balance,
  currency = '$',
  onAddCredits,
  trend,
  ...props
}: WalletHeroCardProps) => {
  return (
    <HeroStatCard
      title="Wallet Balance"
      value={balance}
      format="currency"
      currency={currency}
      actionLabel="Add Credits"
      onAction={onAddCredits}
      trend={trend}
      icon={
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      }
      {...props}
    />
  );
};

export { HeroStatCard, WalletHeroCard };
