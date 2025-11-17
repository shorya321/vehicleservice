'use client';

/**
 * Transaction Invoice Download Button
 * Allows businesses to download PDF invoices for individual transactions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Loader2 } from 'lucide-react';

interface InvoiceDownloadButtonProps {
  transactionId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function InvoiceDownloadButton({
  transactionId,
  variant = 'outline',
  size = 'sm',
  showText = true,
}: InvoiceDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const response = await fetch(`/api/business/wallet/transactions/${transactionId}/invoice`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to download invoice');
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${transactionId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={downloading}
    >
      {downloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {showText && !downloading && <span className="ml-2">Invoice</span>}
      {showText && downloading && <span className="ml-2">Downloading...</span>}
    </Button>
  );
}
