/**
 * Hero Stat Card Component
 * Large prominent stat cards for dashboard hero sections
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion } from 'motion/react';
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

    // Clean card styling matching dashboard stats cards
    // Value color matches icon color for visual consistency
    const variantStyles = {
      default: {
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        valueColor: 'text-primary',
      },
      warning: {
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-600 dark:text-amber-400',
        valueColor: 'text-amber-600 dark:text-amber-400',
      },
      success: {
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        valueColor: 'text-emerald-600 dark:text-emerald-400',
      },
      info: {
        iconBg: 'bg-sky-500/20',
        iconColor: 'text-sky-600 dark:text-sky-400',
        valueColor: 'text-sky-600 dark:text-sky-400',
      },
    };

    const styles = variantStyles[variant];

    const renderValue = () => {
      const valueClassName = cn('text-3xl font-bold tracking-tight', styles.valueColor);

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
          'group relative overflow-hidden rounded-xl p-5 h-full',
          'bg-card',
          'border border-border',
          'shadow-sm card-hover',
          'transition-all duration-300 ease-out',
          'hover:shadow-md hover:border-border/80 dark:hover:border-white/[0.12]',
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              {title}
            </p>

            {/* Value */}
            <div className="mb-1" ref={inViewRef}>
              {renderValue()}
            </div>

            {/* Subtitle or Trend */}
            {trend ? (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    trend.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {trend.direction === 'up' ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  +{trend.value}% {trend.label || 'from last month'}
                </span>
              </div>
            ) : subtitle ? (
              <p className="text-xs text-muted-foreground mt-2">
                {subtitle}
              </p>
            ) : null}

            {/* Action Button */}
            {actionLabel && onAction && (
              <LuxuryButton
                variant="secondary"
                size="sm"
                onClick={onAction}
                className="mt-3"
              >
                {actionLabel}
              </LuxuryButton>
            )}
          </div>

          {/* Icon */}
          {icon && (
            prefersReducedMotion ? (
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-full', styles.iconBg, styles.iconColor)}>
                {icon}
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={cn('flex h-11 w-11 items-center justify-center rounded-full', styles.iconBg, styles.iconColor)}
              >
                {icon}
              </motion.div>
            )
          )}
        </div>
      </div>
    );

    // Wrap with motion for animation
    if (!prefersReducedMotion) {
      return (
        <motion.div
          className="h-full"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          whileHover={{ y: -2 }}
          transition={{ delay, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {content}
        </motion.div>
      );
    }

    return content;
  }
);

HeroStatCard.displayName = 'HeroStatCard';

export { HeroStatCard };
