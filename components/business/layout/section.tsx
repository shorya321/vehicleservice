'use client';

/**
 * Business Portal Section Component
 * Reusable section wrapper with optional title and consistent spacing
 *
 * SCOPE: Business module ONLY
 */

import { cn } from '@/lib/utils';
import { FadeIn } from '@/components/business/motion/fade-in';

interface SectionProps {
  /** Section contents */
  children: React.ReactNode;
  /** Optional section title */
  title?: string;
  /** Optional section description */
  description?: string;
  /** Optional action buttons aligned to section title */
  actions?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate the section */
  animate?: boolean;
  /** Animation delay in seconds */
  delay?: number;
}

export function Section({
  children,
  title,
  description,
  actions,
  className,
  animate = true,
  delay = 0,
}: SectionProps) {
  const content = (
    <section className={cn('space-y-4', className)}>
      {/* Section Header */}
      {(title || actions) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {title && (
              <h2
                className={cn(
                  'text-lg sm:text-xl font-medium',
                  'text-[var(--business-text-primary)]'
                )}
                style={{ fontFamily: 'var(--business-font-display)' }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                className="text-sm text-[var(--business-text-muted)]"
                style={{ fontFamily: 'var(--business-font-body)' }}
              >
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Section Content */}
      {children}
    </section>
  );

  if (animate) {
    return <FadeIn delay={delay}>{content}</FadeIn>;
  }

  return content;
}

export default Section;
