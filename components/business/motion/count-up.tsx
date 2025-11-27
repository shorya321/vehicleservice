/**
 * CountUp Animation Component
 * Animated number counting from start to end value
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useCountUp, useReducedMotion, useInView } from '@/lib/business/animation/hooks';

interface CountUpProps {
  /** End value to count to */
  value: number;
  /** Start value (default: 0) */
  startValue?: number;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Prefix (e.g., "$") */
  prefix?: string;
  /** Suffix (e.g., "%", "k") */
  suffix?: string;
  /** Format with thousand separators */
  separator?: boolean;
  /** Custom className */
  className?: string;
  /** Whether to start animation on viewport entry */
  triggerOnView?: boolean;
  /** Custom formatting function */
  formatter?: (value: number) => string;
}

function formatNumber(value: number, decimals: number, separator: boolean): string {
  const fixed = value.toFixed(decimals);

  if (!separator) return fixed;

  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export function CountUp({
  value,
  startValue = 0,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = true,
  className,
  triggerOnView = true,
  formatter,
}: CountUpProps) {
  const prefersReducedMotion = useReducedMotion();
  const { ref, isInView } = useInView({ once: true });
  const [hasAnimated, setHasAnimated] = useState(false);

  // Determine if animation should be enabled
  const shouldAnimate = triggerOnView ? isInView && !hasAnimated : !hasAnimated;

  const count = useCountUp(value, {
    duration: prefersReducedMotion ? 0 : duration,
    startValue,
    decimals,
    enabled: shouldAnimate,
  });

  // Mark as animated once it reaches the target
  useEffect(() => {
    if (count === value && shouldAnimate) {
      setHasAnimated(true);
    }
  }, [count, value, shouldAnimate]);

  // Format the display value
  const displayValue = formatter
    ? formatter(count)
    : formatNumber(count, decimals, separator);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

// Currency preset
interface CurrencyCountUpProps extends Omit<CountUpProps, 'prefix' | 'decimals'> {
  currency?: string;
}

export function CurrencyCountUp({
  currency = '$',
  ...props
}: CurrencyCountUpProps) {
  return <CountUp {...props} prefix={currency} decimals={2} />;
}

// Percentage preset
interface PercentageCountUpProps extends Omit<CountUpProps, 'suffix' | 'decimals'> {
  decimals?: number;
}

export function PercentageCountUp({
  decimals = 1,
  ...props
}: PercentageCountUpProps) {
  return <CountUp {...props} suffix="%" decimals={decimals} />;
}

// Large number preset (with K, M, B suffixes)
interface CompactCountUpProps extends Omit<CountUpProps, 'formatter'> {}

export function CompactCountUp(props: CompactCountUpProps) {
  const formatter = (value: number): string => {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(1) + 'B';
    }
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(1) + 'M';
    }
    if (value >= 1_000) {
      return (value / 1_000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  return <CountUp {...props} formatter={formatter} separator={false} />;
}
