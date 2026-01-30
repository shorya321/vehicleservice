/**
 * FadeIn Animation Component
 * Wrapper for fade-in animations with viewport detection
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { ReactNode } from 'react';
import { motion, type Variants } from 'motion/react';
import { useReducedMotion, useInView } from '@/lib/business/animation/hooks';
import { fadeInUp, fade, scaleIn, slideInLeft, slideInRight } from '@/lib/business/animation/variants';
import { duration } from '@/lib/business/animation/config';

type AnimationType = 'fadeUp' | 'fade' | 'scale' | 'slideLeft' | 'slideRight';

interface FadeInProps {
  children: ReactNode;
  /** Animation type */
  type?: AnimationType;
  /** Custom delay in seconds */
  delay?: number;
  /** Custom duration in seconds */
  duration?: number;
  /** Whether to animate only once when entering viewport */
  once?: boolean;
  /** Custom className */
  className?: string;
  /** Viewport margin for trigger */
  margin?: string;
  /** Custom variants */
  variants?: Variants;
}

const variantMap: Record<AnimationType, Variants> = {
  fadeUp: fadeInUp,
  fade: fade,
  scale: scaleIn,
  slideLeft: slideInLeft,
  slideRight: slideInRight,
};

export function FadeIn({
  children,
  type = 'fadeUp',
  delay = 0,
  duration: customDuration,
  once = true,
  className,
  margin = '-50px',
  variants: customVariants,
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();
  const { ref, isInView } = useInView({ once, margin });

  // Skip animation if user prefers reduced motion
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const selectedVariants = customVariants ?? variantMap[type];

  // Merge custom transition if provided
  const finalVariants: Variants = {
    ...selectedVariants,
    visible: {
      ...selectedVariants.visible,
      transition: {
        ...(typeof selectedVariants.visible === 'object' && 'transition' in selectedVariants.visible
          ? selectedVariants.visible.transition
          : {}),
        delay,
        ...(customDuration ? { duration: customDuration } : {}),
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={finalVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Preset variations for common use cases
export function FadeInUp(props: Omit<FadeInProps, 'type'>) {
  return <FadeIn {...props} type="fadeUp" />;
}

export function FadeInScale(props: Omit<FadeInProps, 'type'>) {
  return <FadeIn {...props} type="scale" />;
}

export function FadeInLeft(props: Omit<FadeInProps, 'type'>) {
  return <FadeIn {...props} type="slideLeft" />;
}

export function FadeInRight(props: Omit<FadeInProps, 'type'>) {
  return <FadeIn {...props} type="slideRight" />;
}
