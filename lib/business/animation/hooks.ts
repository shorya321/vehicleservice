/**
 * Business Portal Animation Hooks
 * Custom hooks for animation functionality
 *
 * SCOPE: Business module ONLY
 */

'use client';

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useSyncExternalStore,
  MutableRefObject,
} from 'react';
import { useInView as useFramerInView } from 'motion/react';
import { viewportOptions } from './config';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Module scope on purpose: useSyncExternalStore resubscribes whenever this identity
 * changes, so it must not be recreated per render.
 */
function subscribeToReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {};

  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener('change', onStoreChange);

  return () => {
    mediaQuery.removeEventListener('change', onStoreChange);
  };
}

function getReducedMotionSnapshot(): boolean {
  // React only calls this on the client, but matchMedia is still absent in jsdom and in
  // some embedded webviews, where the old lazy initializer threw.
  if (typeof window.matchMedia !== 'function') return false;

  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

/**
 * Whether the viewer asked for reduced motion. False on the server and on the first
 * client render, then the real value.
 *
 * This used to read matchMedia inside a useState initializer, which runs during render.
 * The server has no window, so it could only ever produce false, while the client's very
 * first render - the hydration render - saw the real preference. For a reduce-motion
 * viewer the two disagreed before any effect had run.
 *
 * That mattered because app/business/(portal)/template.tsx branches the tree SHAPE on
 * this value, and it wraps every portal page: one branch is a bare fragment, the other is
 * AnimatePresence, which renders its children as an array and so pushes a React tree
 * fork. React 19 derives useId from the fiber tree id at each fork, so the mismatched
 * branch shifted every useId underneath - the shadcn FormItem ids and the Radix Tabs
 * baseId - and React gave up and client-rendered the whole page instead of hydrating it.
 * Measured by id prefix (_R_ = hydrated, _r_ = client-rendered), every portal page went
 * to 100% client-rendered ids with the preference on.
 *
 * useSyncExternalStore rather than useState + useEffect: getServerSnapshot is used for
 * SSR *and* for the hydration render, so the first client render always matches the
 * server, and no state is set from an effect.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
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
      const resetCount = () => setCount(startValue);
      resetCount();
      return;
    }

    // Skip animation if user prefers reduced motion
    if (prefersReducedMotion) {
      const finishImmediately = () => {
        setCount(endValue);
        hasCompletedRef.current = true;
      };
      finishImmediately();
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
    const updateState = () => {
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
    };
    return updateState();
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
    const show = () => {
      if (delay === 0) {
        setIsVisible(true);
        return;
      }

      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);

      return () => clearTimeout(timer);
    };
    return show();
  }, [delay]);

  return isVisible;
}
