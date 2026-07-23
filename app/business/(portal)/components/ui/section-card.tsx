/**
 * Business Portal Section Card
 * SCOPE: Business module ONLY
 *
 * The card shell every portal detail screen already draws by hand — see the Route Details card
 * in bookings/[id]/components/booking-details.tsx. Extracted so new screens inherit the same
 * header strip, radius and border instead of falling back to a plain shadcn <Card>, which is
 * how the quotation pages ended up looking like a different product.
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PortalSectionCardProps {
  title: string;
  icon?: LucideIcon;
  /** Rendered at the right of the header strip — a button, a count, a badge. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Drop the default padding when the body draws its own (a table, for instance). */
  bodyClassName?: string;
}

export function PortalSectionCard({
  title,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
}: PortalSectionCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-card border border-border shadow-sm overflow-hidden',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-muted/30">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </h2>
        {action}
      </div>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </div>
  );
}
