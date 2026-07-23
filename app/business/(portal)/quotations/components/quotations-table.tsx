'use client';

/**
 * Quotation list table.
 *
 * Rows are already filtered, sorted and paginated by the server — this renders what it is
 * given and never re-filters in the client.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { FileText, MoreHorizontal, Trash2, Download, Loader2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { formatAmount } from '@/lib/currency/format';
import { displayStatus } from '@/lib/business/quotations/status';
import { QuotationStatusBadge } from './quotation-status-badge';
import { deleteQuotation } from '../mutations';
import type { QuotationListRow } from '@/lib/business/quotations/types';

interface QuotationsTableProps {
  rows: QuotationListRow[];
  /** Today in Asia/Dubai, resolved on the server so expiry does not shift with the viewer's clock. */
  today: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function QuotationsTable({ rows, today }: QuotationsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<QuotationListRow | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

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

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No quotations yet"
        description="Build a priced proposal covering one or more trips, then share the PDF with your customer."
        action={
          <Button asChild>
            <Link href="/business/quotations/new">New Quotation</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-center">Trips</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="group">
                <TableCell className="font-medium">
                  <Link
                    href={`/business/quotations/${row.id}`}
                    className="hover:underline"
                  >
                    {row.quotation_number}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>{row.customer_name}</div>
                  {row.customer_company && (
                    <div className="text-sm text-muted-foreground">
                      {row.customer_company}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center tabular-nums">{row.item_count}</TableCell>
                <TableCell>
                  <QuotationStatusBadge
                    status={displayStatus(row.status, row.valid_until, today)}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(row.valid_until)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {/* Converted at the rate locked on the quotation, matching the PDF. */}
                  {formatAmount(row.total_sell_aed * row.exchange_rate, row.currency)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Quotation actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/business/quotations/${row.id}`}>View</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          void handleDownload(row);
                        }}
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
                        onSelect={(event) => {
                          event.preventDefault();
                          setPendingDelete(row);
                        }}
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
