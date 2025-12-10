/**
 * CountUp Animation Component
 * Animated number counting from start to end value
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
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
  const { ref, isInView } = useInView({ once: true, margin: '0px', amount: 0 });
  const [hasAnimated, setHasAnimated] = useState(false);
  // Track if we've ever shown the final value (survives re-renders, not remounts)
  const hasShownFinalRef = useRef(false);

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
      hasShownFinalRef.current = true;
    }
  }, [count, value, shouldAnimate]);

  // Format values
  const displayValue = formatter
    ? formatter(count)
    : formatNumber(count, decimals, separator);

  const finalValue = formatter
    ? formatter(value)
    : formatNumber(value, decimals, separator);

  // FIX: Determine which value to show
  // 1. If animation completed (hasAnimated or ref), show final
  // 2. If count reached value, show final
  // 3. If animation is in progress (count > startValue or count is animating towards value), show animated count
  // 4. If count is stuck at startValue but should have animated (isInView is true for a while), show final
  const animationInProgress = count > startValue && count < value;
  const animationComplete = hasShownFinalRef.current || hasAnimated || count === value;

  // If we're supposed to animate but count is still at 0 after being in view, show final value
  // This handles the case where component remounts and animation resets
  const shouldShowFinal = animationComplete || (isInView && !animationInProgress && count === startValue && value !== startValue);

  const showValue = shouldShowFinal ? finalValue : displayValue;

  return (
    <span ref={ref} className={className}>
      {prefix}
      {showValue}
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
