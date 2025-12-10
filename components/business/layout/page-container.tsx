'use client';

/**
 * Business Portal Page Container Component
 * Main content wrapper with consistent spacing and optional max-width constraints
 *
 * SCOPE: Business module ONLY
 */

import { cn } from '@/lib/utils';

type ContainerWidth = 'narrow' | 'default' | 'wide' | 'full';

interface PageContainerProps {
  /** Container contents */
  children: React.ReactNode;
  /** Max width constraint */
  maxWidth?: ContainerWidth;
  /** Additional CSS classes */
  className?: string;
  /** Whether to add default vertical spacing between sections */
  spaced?: boolean;
}

const maxWidthClasses: Record<ContainerWidth, string> = {
  narrow: 'max-w-2xl',
  default: 'max-w-5xl',
  wide: 'max-w-7xl',
  full: 'max-w-full',
};

export function PageContainer({
  children,
  maxWidth = 'full',
  className,
  spaced = true,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        maxWidthClasses[maxWidth],
        spaced && 'space-y-6 sm:space-y-8',
        className
      )}
    >
      {children}
    </div>
  );
}

export default PageContainer;
