/**
 * Business Portal Animation Hooks
 * Custom hooks for animation functionality
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { useEffect, useState, useCallback, useRef, MutableRefObject } from 'react';
import { useInView as useFramerInView } from 'motion/react';
import { viewportOptions } from './config';

/**
 * Hook to detect reduced motion preference
 * Returns true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to detect if element is in viewport
 * Wrapper around Framer Motion's useInView with default options
 */
export function useInView(options?: {
  once?: boolean;
  margin?: string;
  amount?: number | 'some' | 'all';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useFramerInView(ref, {
    once: options?.once ?? viewportOptions.once,
    margin: options?.margin ?? viewportOptions.margin,
    amount: options?.amount ?? viewportOptions.amount,
  });

  return { ref, isInView };
}

/**
 * Hook for counting animation
 * Animates a number from start to end value
 */
export function useCountUp(
  endValue: number,
  options?: {
    duration?: number;
    startValue?: number;
    decimals?: number;
    enabled?: boolean;
  }
): number {
  const {
    duration = 1500,
    startValue = 0,
    decimals = 0,
    enabled = true,
  } = options ?? {};

  const [count, setCount] = useState(startValue);
  const hasCompletedRef = useRef(false); // Track if animation has completed
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // If animation already completed, preserve the final value
    if (hasCompletedRef.current) {
      return;
    }

    if (!enabled) {
      setCount(startValue);
      return;
    }

    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion) {
      setCount(endValue);
      hasCompletedRef.current = true;
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;

      setCount(Number(currentValue.toFixed(decimals)));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Mark animation as completed to preserve final value
        hasCompletedRef.current = true;
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [endValue, duration, startValue, decimals, enabled, prefersReducedMotion]);

  return count;
}

/**
 * Hook for staggered animation delays
 * Returns animation delay for nth item
 */
export function useStaggerDelay(
  index: number,
  baseDelay: number = 60
): number {
  return index * baseDelay;
}

/**
 * Hook for animation state based on visibility
 * Returns animation controls for enter/exit states
 */
export function useAnimationState(isVisible: boolean) {
  const [animationState, setAnimationState] = useState<'hidden' | 'visible' | 'exit'>(
    isVisible ? 'visible' : 'hidden'
  );

  useEffect(() => {
    if (isVisible) {
      setAnimationState('visible');
    } else {
      setAnimationState('exit');
      // Reset to hidden after exit animation
      const timer = setTimeout(() => {
        setAnimationState('hidden');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return animationState;
}

/**
 * Hook for scroll-triggered animations
 * Triggers callback when scroll passes threshold
 */
export function useScrollTrigger(
  threshold: number = 100,
  callback?: (triggered: boolean) => void
): boolean {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const isTriggered = window.scrollY > threshold;
      if (isTriggered !== triggered) {
        setTriggered(isTriggered);
        callback?.(isTriggered);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold, callback, triggered]);

  return triggered;
}

/**
 * Hook for delayed visibility
 * Useful for entrance animations with delay
 */
export function useDelayedVisibility(delay: number = 0): boolean {
  const [isVisible, setIsVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) {
      setIsVisible(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isVisible;
}
