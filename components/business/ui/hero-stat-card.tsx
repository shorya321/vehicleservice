/**
 * Hero Stat Card Component
 * Large prominent stat cards for dashboard hero sections
 *
 * Design System: Clean shadcn with Gold Accent
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
        border: 'border-border',
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        labelColor: 'text-primary',
      },
      warning: {
        border: 'border-border',
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-500 dark:text-amber-400',
        labelColor: 'text-amber-500 dark:text-amber-400',
      },
      success: {
        border: 'border-border',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        labelColor: 'text-emerald-600 dark:text-emerald-400',
      },
      info: {
        border: 'border-border',
        iconBg: 'bg-sky-500/10',
        iconColor: 'text-sky-600 dark:text-sky-400',
        labelColor: 'text-sky-600 dark:text-sky-400',
      },
    };

    const styles = variantStyles[variant];

    const renderValue = () => {
      const valueClassName =
        'text-4xl lg:text-5xl font-medium text-foreground tracking-tight';

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
          'relative overflow-hidden rounded-xl p-6 lg:p-8',
          'bg-card',
          'border',
          styles.border,
          'hover:border-primary/30',
          'shadow-sm',
          'transition-all duration-150',
          className
        )}
        {...props}
      >
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p
                className={cn(
                  'text-xs uppercase tracking-wider font-semibold mb-1',
                  styles.labelColor
                )}
              >
                {title}
              </p>
              {subtitle && (
                <p className="text-sm text-muted-foreground">
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
          <div className="mb-4" ref={inViewRef}>
            {renderValue()}
          </div>

          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-2 mb-4">
              <span
                className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  trend.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
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
                <span className="text-sm text-muted-foreground">
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

export { HeroStatCard };
