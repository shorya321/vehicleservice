/**
 * Stagger Container & Item Components
 * For staggered reveal animations on lists/grids
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { ReactNode, createContext, useContext } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useReducedMotion, useInView } from '@/lib/business/animation/hooks';
import { staggerContainer, staggerContainerFast, staggerItem } from '@/lib/business/animation/variants';
import { stagger } from '@/lib/business/animation/config';

type StaggerSpeed = 'fast' | 'normal' | 'slow';

interface StaggerContainerProps {
  children: ReactNode;
  /** Stagger speed preset */
  speed?: StaggerSpeed;
  /** Custom stagger delay in seconds */
  staggerDelay?: number;
  /** Delay before starting animations */
  delayChildren?: number;
  /** Whether to animate only once when entering viewport */
  once?: boolean;
  /** Custom className */
  className?: string;
  /** HTML tag to render */
  as?: keyof JSX.IntrinsicElements;
}

interface StaggerItemProps {
  children: ReactNode;
  /** Custom className */
  className?: string;
  /** Custom variants */
  variants?: Variants;
  /** HTML tag to render */
  as?: keyof JSX.IntrinsicElements;
}

// Context to track if we're inside a stagger container
const StaggerContext = createContext(false);

const speedMap: Record<StaggerSpeed, number> = {
  fast: stagger.fast,
  normal: stagger.cards,
  slow: stagger.slow,
};

export function StaggerContainer({
  children,
  speed = 'normal',
  staggerDelay,
  delayChildren = 0.1,
  once = true,
  className,
  as: Component = 'div',
}: StaggerContainerProps) {
  const prefersReducedMotion = useReducedMotion();
  const { ref, isInView } = useInView({ once });

  // Skip animation if user prefers reduced motion
  if (prefersReducedMotion) {
    return <Component className={className}>{children}</Component>;
  }

  const staggerTime = staggerDelay ?? speedMap[speed];

  const variants: Variants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerTime,
        delayChildren,
      },
    },
  };

  // Using motion.div and applying className
  // TypeScript doesn't allow dynamic motion components easily
  return (
    <StaggerContext.Provider value={true}>
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={variants}
        className={className}
      >
        {children}
      </motion.div>
    </StaggerContext.Provider>
  );
}

export function StaggerItem({
  children,
  className,
  variants: customVariants,
  as: Component = 'div',
}: StaggerItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const isInsideContainer = useContext(StaggerContext);

  // Skip animation if user prefers reduced motion or not in container
  if (prefersReducedMotion || !isInsideContainer) {
    return <Component className={className}>{children}</Component>;
  }

  const variants = customVariants ?? staggerItem;

  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}

// Grid-specific stagger container for cards
interface StaggerGridProps extends Omit<StaggerContainerProps, 'as'> {
  /** Number of columns (for responsive class generation) */
  cols?: 1 | 2 | 3 | 4;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
}

const gapMap: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
};

const colsMap: Record<1 | 2 | 3 | 4, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

export function StaggerGrid({
  children,
  cols = 3,
  gap = 'md',
  className,
  ...props
}: StaggerGridProps) {
  const gridClasses = `grid ${colsMap[cols]} ${gapMap[gap]} ${className ?? ''}`;

  return (
    <StaggerContainer {...props} className={gridClasses}>
      {children}
    </StaggerContainer>
  );
}
