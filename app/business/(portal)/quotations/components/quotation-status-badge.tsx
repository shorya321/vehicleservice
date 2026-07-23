/**
 * Status pill for a quotation.
 *
 * Takes a QuotationDisplayStatus rather than the stored status, because 'expired' is derived
 * from valid_until and never exists in the database.
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  QUOTATION_STATUS_LABELS,
  type QuotationDisplayStatus,
} from '@/lib/business/quotations/status';

/**
 * Colour carries meaning here: amber = waiting on the customer, green = money is next,
 * blue = money has moved, muted = nothing to do.
 */
const STATUS_CLASSES: Record<QuotationDisplayStatus, string> = {
  draft:
    'bg-muted text-muted-foreground border-border',
  sent:
    'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400',
  accepted:
    'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
  rejected:
    'bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400',
  converting:
    'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400',
  partially_converted:
    'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400',
  converted:
    'bg-blue-500/15 text-blue-700 border-blue-500/40 dark:text-blue-300',
  expired:
    'bg-orange-500/10 text-orange-600 border-orange-500/30 dark:text-orange-400',
};

interface QuotationStatusBadgeProps {
  status: QuotationDisplayStatus;
  className?: string;
}

export function QuotationStatusBadge({ status, className }: QuotationStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', STATUS_CLASSES[status], className)}
    >
      {QUOTATION_STATUS_LABELS[status]}
    </Badge>
  );
}
