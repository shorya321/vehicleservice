'use client';

/**
 * One quotation, as a card.
 *
 * The desktop table is unreadable below `md` — seven columns of addresses and money do not
 * survive a 375px viewport. Mirrors MobileBookingCard in
 * app/business/(portal)/bookings/components/bookings-page-content.tsx so the two lists behave
 * identically on a phone.
 */

import Link from 'next/link';
import { motion } from 'motion/react';
import { MoreHorizontal, Trash2, Download, Loader2, MapPin, CalendarClock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { displayStatus } from '@/lib/business/quotations/status';
import { QuotationStatusBadge } from './quotation-status-badge';
import type { QuotationListRow } from '@/lib/business/quotations/types';

interface QuotationMobileCardProps {
  row: QuotationListRow;
  index: number;
  /** Today in Asia/Dubai, resolved on the server so expiry does not shift with the viewer's clock. */
  today: string;
  prefersReducedMotion: boolean;
  formatDate: (iso: string | null) => string;
  downloading: boolean;
  onDownload: () => void;
  onDelete: () => void;
}

export function QuotationMobileCard({
  row,
  index,
  today,
  prefersReducedMotion,
  formatDate,
  downloading,
  onDownload,
  onDelete,
}: QuotationMobileCardProps) {
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card className="rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-md">
        <CardContent className="p-4">
          {/* Status + number */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <QuotationStatusBadge status={displayStatus(row.status, row.valid_until, today)} />
            <span className="text-xs text-muted-foreground">
              {formatDate(row.valid_until)}
            </span>
          </div>

          <Link href={`/business/quotations/${row.id}`} className="mb-3 block">
            <p className="text-sm font-medium text-foreground transition-colors hover:text-primary">
              {row.customer_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.quotation_number}
              {row.customer_company && (
                <span className="ml-1 opacity-60">({row.customer_company})</span>
              )}
            </p>
          </Link>

          <div className="mb-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              {row.item_count} trip{row.item_count === 1 ? '' : 's'}
            </span>
            {!row.valid_until && (
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                No expiry
              </span>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-lg font-bold tabular-nums text-primary">
              {/* Converted at the rate locked on the quotation, matching the PDF. */}
              {formatCurrency(row.total_sell_aed * row.exchange_rate, row.currency)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  aria-label="Quotation actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/business/quotations/${row.id}`}>View</Link>
                </DropdownMenuItem>
                {/* No preventDefault — see the note in quotations-table.tsx: suppressing the
                    close leaves the menu open through the fetch and behind the delete dialog. */}
                <DropdownMenuItem
                  onSelect={() => onDownload()}
                  disabled={downloading || row.item_count === 0}
                >
                  {downloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => onDelete()}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
