'use client';

/**
 * Business Portal Page Header Component
 * Standardized page header with title, description, actions, and optional breadcrumbs
 *
 * SCOPE: Business module ONLY
 */

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn } from '@/components/business/motion/fade-in';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  /** Page title - uses display font */
  title: string;
  /** Optional description text below title */
  description?: string;
  /** Optional action buttons/elements aligned to the right */
  actions?: React.ReactNode;
  /** Optional breadcrumb navigation */
  breadcrumbs?: BreadcrumbItem[];
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate the header */
  animate?: boolean;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
  animate = true,
}: PageHeaderProps) {
  const content = (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-[var(--business-text-muted)]" />
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    'text-[var(--business-text-muted)] hover:text-[var(--business-text-primary)]',
                    'transition-colors duration-200'
                  )}
                  style={{ fontFamily: 'var(--business-font-body)' }}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="text-[var(--business-text-secondary)]"
                  style={{ fontFamily: 'var(--business-font-body)' }}
                >
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Title and Actions Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1
            className={cn(
              'text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight',
              'text-[var(--business-text-primary)]'
            )}
            style={{ fontFamily: 'var(--business-font-display)' }}
          >
            {title}
          </h1>
          {description && (
            <p
              className="text-[var(--business-text-muted)] text-sm sm:text-base max-w-2xl"
              style={{ fontFamily: 'var(--business-font-body)' }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );

  if (animate) {
    return <FadeIn>{content}</FadeIn>;
  }

  return content;
}

export default PageHeader;
