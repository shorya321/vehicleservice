'use client';

/**
 * Quotation list table.
 *
 * Rows are already filtered, sorted and paginated by the server — this renders what it is
 * given and never re-filters in the client. Paging is URL-driven for the same reason the
 * filters are: a page is a shareable address, not component state.
 *
 * The shadcn <Table> primitive in components/ui is skinned for the PUBLIC site (gold headers,
 * pearl text), so every Table* here carries semantic overrides — the same treatment
 * wallet/transactions/components/transactions-list.tsx applies.
 */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  FileText,
  MoreHorizontal,
  Trash2,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// The business alert dialog, not the shared one: this dialog is opened from a DropdownMenuItem,
// and only this copy clears the `pointer-events: none` Radix leaves on <body> in that pairing.
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/business/(portal)/components/ui/alert-dialog';
// Business empty state — the shared one paints text-luxury-pearl, which is invisible on the
// portal's light theme.
import { EmptyState } from '@/components/business/ui/empty-state';
import { PortalSectionCard } from '@/app/business/(portal)/components/ui/section-card';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/business/animation/hooks';
// The portal writes money as "AED 150.00" everywhere else (bookings, wallet, dashboard); the
// customer-facing PDF keeps the platform's "150.00 AED" via formatAmount.
import { formatCurrency } from '@/lib/business/wallet-operations';
import { displayStatus } from '@/lib/business/quotations/status';
import { QuotationStatusBadge } from './quotation-status-badge';
import { QuotationMobileCard } from './quotation-mobile-card';
import { deleteQuotation } from '../mutations';
import type { QuotationListRow } from '@/lib/business/quotations/types';

interface QuotationsTableProps {
  rows: QuotationListRow[];
  /** Today in Asia/Dubai, resolved on the server so expiry does not shift with the viewer's clock. */
  today: string;
  /** Total across every page, for the card header count and the footer copy. */
  total: number;
  /** 1-based page currently rendered, as resolved by the server query. */
  page: number;
  /** Page size the server used, so the footer can name the visible range. */
  limit: number;
  /** True when a search term or status filter is narrowing the list. */
  hasFilters: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Elided pager, matching the bookings list: 1 … 4 5 6 … 12. */
function pageNumbers(current: number, totalPages: number): (number | string)[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (current <= 3) return [1, 2, 3, '...', totalPages];
  if (current >= totalPages - 2) {
    return [1, '...', totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', current - 1, current, current + 1, '...', totalPages];
}

const HEAD_CLASS = 'text-xs uppercase tracking-wider text-muted-foreground';

export function QuotationsTable({
  rows,
  today,
  total,
  page,
  limit,
  hasFilters,
}: QuotationsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<QuotationListRow | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + rows.length;

  /**
   * Paging preserves whatever filters are in the URL. Built from searchParams rather than
   * passed down, because a Server Component cannot hand a function to a Client Component.
   */
  function pageHref(target: number): string {
    const next = new URLSearchParams(searchParams.toString());
    if (target > 1) next.set('page', String(target));
    else next.delete('page');
    const query = next.toString();
    return query ? `/business/quotations?${query}` : '/business/quotations';
  }

  async function handleDownload(row: QuotationListRow) {
    setDownloading(row.id);
    try {
      const response = await fetch(`/api/business/quotations/${row.id}/pdf`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? 'Could not generate the PDF');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${row.quotation_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Quotation downloaded');
    } catch {
      toast.error('Could not generate the PDF');
    } finally {
      setDownloading(null);
    }
  }

  function handleDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    startTransition(async () => {
      const result = await deleteQuotation(target.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${target.quotation_number} deleted`);
      router.refresh();
    });
  }

  return (
    <>
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <PortalSectionCard
          title="All Quotations"
          icon={FileText}
          bodyClassName="p-0"
          action={
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {total} total
            </span>
          }
        >
          {rows.length === 0 ? (
            /* Rendered INSIDE the card so the shell does not vanish, and the copy follows
               whether the list is genuinely empty or merely filtered to nothing. */
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title={hasFilters ? 'No matching quotations' : 'No quotations yet'}
              description={
                hasFilters
                  ? "Try adjusting your search or status filter to find what you're looking for."
                  : 'Build a priced proposal covering one or more trips, then share the PDF with your customer.'
              }
              action={
                hasFilters ? undefined : (
                  <Button asChild className="gap-2">
                    <Link href="/business/quotations/new">
                      <Plus className="h-4 w-4" />
                      New Quotation
                    </Link>
                  </Button>
                )
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  {/* TableHeader's own `[&_tr]:border-luxury-gold/20` is a descendant rule, so
                      it outranks a border class set on the row and tailwind-merge cannot see
                      the conflict — it has to be neutralised here, on the same element. */}
                  <TableHeader className="[&_tr]:border-border">
                    <TableRow className="border-border hover:bg-muted/50">
                      <TableHead className={HEAD_CLASS}>Number</TableHead>
                      <TableHead className={HEAD_CLASS}>Customer</TableHead>
                      <TableHead className={cn(HEAD_CLASS, 'text-center')}>Trips</TableHead>
                      <TableHead className={HEAD_CLASS}>Status</TableHead>
                      <TableHead className={HEAD_CLASS}>Valid Until</TableHead>
                      <TableHead className={cn(HEAD_CLASS, 'text-right')}>Total</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.id}
                        /* `border-border` (not border-b-border) so tailwind-merge recognises
                           the conflict with TableRow's built-in border-luxury-gold/20. */
                        className="group border-border border-l-2 border-l-transparent transition-all duration-150 hover:border-l-primary hover:bg-muted/50"
                      >
                        <TableCell className="font-medium text-foreground">
                          <Link
                            href={`/business/quotations/${row.id}`}
                            className="transition-colors hover:text-primary hover:underline"
                          >
                            {row.quotation_number}
                          </Link>
                        </TableCell>
                        <TableCell className="text-foreground">
                          <div>{row.customer_name}</div>
                          {row.customer_company && (
                            <div className="text-sm text-muted-foreground">
                              {row.customer_company}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-foreground">
                          {row.item_count}
                        </TableCell>
                        <TableCell className="text-foreground">
                          <QuotationStatusBadge
                            status={displayStatus(row.status, row.valid_until, today)}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(row.valid_until)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums text-primary">
                          {/* Converted at the rate locked on the quotation, matching the PDF. */}
                          {formatCurrency(row.total_sell_aed * row.exchange_rate, row.currency)}
                        </TableCell>
                        <TableCell className="text-foreground">
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
                              {/* No preventDefault: suppressing the close left the menu open
                                  through the whole PDF fetch, and painted behind the delete
                                  dialog. Radix closing normally is safe here — the portal's
                                  AlertDialog clears the `pointer-events: none` this pairing
                                  would otherwise strand on <body>. */}
                              <DropdownMenuItem
                                onSelect={() => void handleDownload(row)}
                                disabled={downloading === row.id || row.item_count === 0}
                              >
                                {downloading === row.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="mr-2 h-4 w-4" />
                                )}
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => setPendingDelete(row)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 p-4 md:hidden">
                {rows.map((row, index) => (
                  <QuotationMobileCard
                    key={row.id}
                    row={row}
                    index={index}
                    today={today}
                    prefersReducedMotion={prefersReducedMotion}
                    formatDate={formatDate}
                    downloading={downloading === row.id}
                    onDownload={() => void handleDownload(row)}
                    onDelete={() => setPendingDelete(row)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col items-center justify-between gap-4 border-t border-border px-5 py-4 sm:flex-row">
                  <p className="text-sm text-muted-foreground">
                    Showing{' '}
                    <span className="font-medium text-foreground">
                      {startIndex + 1}-{endIndex}
                    </span>{' '}
                    of <span className="font-medium text-foreground">{total}</span> quotation
                    {total === 1 ? '' : 's'}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      asChild={page > 1}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      disabled={page <= 1}
                      aria-label="Previous page"
                    >
                      {page > 1 ? (
                        <Link href={pageHref(page - 1)} scroll={false}>
                          <ChevronLeft className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span>
                          <ChevronLeft className="h-4 w-4" />
                        </span>
                      )}
                    </Button>

                    {pageNumbers(page, totalPages).map((target, index) =>
                      typeof target === 'number' ? (
                        <Button
                          key={`${target}`}
                          asChild={target !== page}
                          variant={target === page ? 'default' : 'ghost'}
                          size="icon"
                          className={cn(
                            'h-9 w-9',
                            target === page && 'bg-primary font-medium text-primary-foreground'
                          )}
                        >
                          {target === page ? (
                            <span aria-current="page">{target}</span>
                          ) : (
                            <Link href={pageHref(target)} scroll={false}>
                              {target}
                            </Link>
                          )}
                        </Button>
                      ) : (
                        <span key={`gap-${index}`} className="px-1 text-muted-foreground">
                          {target}
                        </span>
                      )
                    )}

                    <Button
                      asChild={page < totalPages}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      disabled={page >= totalPages}
                      aria-label="Next page"
                    >
                      {page < totalPages ? (
                        <Link href={pageHref(page + 1)} scroll={false}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span>
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </PortalSectionCard>
      </motion.div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.quotation_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the quotation and all of its trips. Quotations with
              trips that have already been booked cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
