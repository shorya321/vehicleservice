'use client';

/**
 * Detail-page actions: download the PDF and move the quotation through its lifecycle.
 *
 * Download follows the invoice-download-button pattern (fetch -> blob -> objectURL ->
 * synthetic <a download>), copied rather than imported because that component depends on
 * useCurrency() and a quotation is locked to the business's own currency.
 */

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Download, Loader2, Send, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setQuotationStatus } from '../../mutations';
import type { QuotationStatus } from '@/lib/business/quotations/status';

interface QuotationActionsProps {
  quotationId: string;
  quotationNumber: string;
  status: QuotationStatus;
  /** The PDF needs at least one trip to render. */
  hasTrips: boolean;
  canEdit: boolean;
}

export function QuotationActions({
  quotationId,
  quotationNumber,
  status,
  hasTrips,
  canEdit,
}: QuotationActionsProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleDownload() {
    setDownloading(true);
    try {
      const response = await fetch(`/api/business/quotations/${quotationId}/pdf`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? 'Could not generate the PDF');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quotationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Quotation downloaded');
    } catch {
      toast.error('Could not generate the PDF');
    } finally {
      setDownloading(false);
    }
  }

  function changeStatus(next: 'sent' | 'accepted' | 'rejected') {
    startTransition(async () => {
      const result = await setQuotationStatus(quotationId, { status: next });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Marked as ${next}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleDownload} disabled={downloading || !hasTrips}>
        {downloading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Download PDF
      </Button>

      {/* Status is advanced by hand: the business knows when they actually sent it and what
          the customer said, and none of that is observable from inside the product. */}
      {canEdit && status === 'draft' && (
        <Button variant="outline" onClick={() => changeStatus('sent')} disabled={isPending || !hasTrips}>
          <Send className="mr-2 h-4 w-4" />
          Mark as sent
        </Button>
      )}

      {canEdit && status === 'sent' && (
        <>
          <Button variant="outline" onClick={() => changeStatus('accepted')} disabled={isPending}>
            <Check className="mr-2 h-4 w-4" />
            Customer accepted
          </Button>
          <Button variant="outline" onClick={() => changeStatus('rejected')} disabled={isPending}>
            <X className="mr-2 h-4 w-4" />
            Customer declined
          </Button>
        </>
      )}
    </div>
  );
}
