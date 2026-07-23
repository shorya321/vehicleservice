/**
 * A titled block of form fields with an icon bubble.
 *
 * Matches the booking wizard's details step
 * (app/business/(portal)/bookings/new/components/details-step.tsx) down to the icon tones, so
 * every form in this portal reads as one family rather than several products.
 *
 * Extracted from new-quotation-form.tsx so the trip editor sheet can use the same chrome
 * instead of bare `h3 text-sm font-medium` headings.
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FieldGroupProps {
  title: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon bubble — background and foreground together. */
  tone: string;
  /** Optional one-liner under the title. */
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FieldGroup({
  title,
  icon: Icon,
  tone,
  description,
  children,
  className,
}: FieldGroupProps) {
  return (
    <div
      className={cn('space-y-4 rounded-xl border border-border bg-muted/30 p-5', className)}
    >
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
