'use client';

/**
 * Convert an accepted quotation into real bookings.
 *
 * Opening the dialog runs a PREFLIGHT (GET) which creates nothing: it re-prices every trip and
 * checks every wallet rule, so the business sees the true cost and any blocker before a single
 * booking exists. Confirming posts back the repriceToken, which binds the confirmation to the
 * exact figures shown — otherwise prices could move between review and purchase.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, ArrowRight, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
// The business Dialog, not the shared one: components/ui/dialog paints DialogContent
// bg-luxury-darkGray/95 + text-luxury-pearl, which is the public site's skin and ignores the
// portal's light/dark theme entirely.
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/business/ui/dialog';
// Portal money format ("AED 150.00"); the customer PDF keeps formatAmount.
import { formatCurrency } from '@/lib/business/wallet-operations';
import type { QuotationPreflightResult } from '@/lib/business/quotations/types';

interface ConvertDialogProps {
  quotationId: string;
}

export function ConvertDialog({ quotationId }: ConvertDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [preflight, setPreflight] = useState<QuotationPreflightResult | null>(null);

  async function openAndPreflight() {
    setOpen(true);
    setLoading(true);
    setPreflight(null);
    try {
      const response = await fetch(`/api/business/quotations/${quotationId}/convert`);
      const body = await response.json();
      if (!response.ok) {
        toast.error(body?.error ?? 'Could not check this quotation');
        setOpen(false);
        return;
      }
      setPreflight(body.data as QuotationPreflightResult);
    } catch {
      toast.error('Could not check this quotation');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    if (!preflight) return;
    setConverting(true);
    try {
      const response = await fetch(`/api/business/quotations/${quotationId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repriceToken: preflight.repriceToken,
          acceptRepricing: true,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        toast.error(body?.error ?? 'Conversion failed');
        return;
      }

      const lines = body.data?.lines ?? [];
      const failed = lines.filter((l: { status: string }) => l.status === 'failed');

      if (failed.length > 0) {
        // Never presented as a clean success: some bookings are real and already paid for.
        toast.warning(
          `Converted ${lines.length - failed.length} of ${lines.length} trips. ${failed[0].error ?? ''}`
        );
      } else {
        toast.success(`All ${lines.length} trips are now bookings`);
      }

      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Conversion failed');
    } finally {
      setConverting(false);
    }
  }

  const blocked = Boolean(preflight && !preflight.ok);
  const anyBelowCost = preflight?.lines.some((line) => line.belowCost) ?? false;
  const anyRepriced =
    preflight?.lines.some(
      (line) => Math.abs(line.netAedFresh - line.netAedStored) > 0.01
    ) ?? false;

  return (
    <>
      <Button onClick={openAndPreflight}>
        <ArrowRight className="mr-2 h-4 w-4" />
        Convert to bookings
      </Button>

      <Dialog open={open} onOpenChange={(next) => !converting && setOpen(next)}>
        {/* grid-cols-[minmax(0,1fr)] is load-bearing: DialogContent is a grid, and its children
            default to min-width:auto, so a long address would blow the track out past the
            dialog's own box and drag the footer buttons outside it. */}
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-lg grid-cols-[minmax(0,1fr)] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Convert to bookings</DialogTitle>
            <DialogDescription>
              This creates a real booking per trip and charges your wallet. Nothing has been
              created yet.
            </DialogDescription>
          </DialogHeader>

          {loading && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Re-pricing every trip…
            </div>
          )}

          {preflight && (
            <div className="space-y-4">
              <div className="space-y-2">
                {preflight.lines.map((line) => {
                  const moved = Math.abs(line.netAedFresh - line.netAedStored) > 0.01;
                  return (
                    <div
                      key={line.itemId}
                      className="rounded-lg border border-border p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 break-words">
                          <div>{line.pickup}</div>
                          <div className="text-muted-foreground">→ {line.dropoff}</div>
                        </div>
                        <span className="shrink-0 tabular-nums">
                          {moved && (
                            <span className="mr-1 text-muted-foreground line-through">
                              {formatCurrency(line.netAedStored, 'AED')}
                            </span>
                          )}
                          {formatCurrency(line.netAedFresh, 'AED')}
                        </span>
                      </div>
                      {line.error && (
                        <p className="mt-1 text-destructive">{line.error}</p>
                      )}
                      {line.belowCost && !line.error && (
                        <p className="mt-1 text-amber-600 dark:text-amber-400">
                          Cost now exceeds the {formatCurrency(line.sellAed, 'AED')} you quoted.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-3 text-sm">
                <span className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Wallet charge
                </span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(preflight.totalNetAed, 'AED')}
                </span>
              </div>

              {anyRepriced && !blocked && (
                <p className="text-sm text-muted-foreground">
                  Some costs changed since this quotation was priced. Your customer&apos;s price
                  is unaffected.
                </p>
              )}

              {anyBelowCost && !blocked && (
                <p className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  One or more trips now cost more than you quoted. Converting means selling at a
                  loss.
                </p>
              )}

              {blocked && (
                <div className="space-y-1 break-words rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  {preflight.blockingErrors.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={converting}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={!preflight || blocked || converting || loading}>
              {converting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {preflight ? `Charge ${formatCurrency(preflight.totalNetAed, 'AED')}` : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
