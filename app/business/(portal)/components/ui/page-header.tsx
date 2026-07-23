'use client';

/**
 * Business Portal Page Header
 * SCOPE: Business module ONLY
 *
 * The title block every portal screen draws by hand, plus the entrance animation the dashboard
 * and bookings lists already use (bookings-page-content.tsx:318-334). Extracted as a client
 * component so Server Component pages can animate their header without becoming client
 * components themselves.
 *
 * `breadcrumb` and `actions` are rendered as passed — a Server Component may hand React
 * elements (including <Link>s) straight through.
 */

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/business/animation/hooks';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Back-link row rendered above the title. */
  breadcrumb?: ReactNode;
  /** Buttons rendered at the right on wide screens, below the title on narrow ones. */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        {breadcrumb}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </motion.div>
  );
}
