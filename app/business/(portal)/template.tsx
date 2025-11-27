/**
 * Business Portal Page Transition Template
 * Wraps all business portal pages with smooth animations
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { pageTransition } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';

interface TemplateProps {
  children: ReactNode;
}

export default function BusinessPortalTemplate({ children }: TemplateProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  // Skip animation if user prefers reduced motion
  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
