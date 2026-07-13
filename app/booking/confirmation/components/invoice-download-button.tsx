'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2 } from 'lucide-react'
import { useCurrency } from '@/lib/currency/context'

interface InvoiceDownloadButtonProps {
  bookingNumber: string
  invoiceNumber: string
  className?: string
}

export function InvoiceDownloadButton({
  bookingNumber,
  invoiceNumber,
  className,
}: InvoiceDownloadButtonProps) {
  const { currentCurrency } = useCurrency()
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setDownloading(true)

      const response = await fetch(
        `/api/booking/${bookingNumber}/invoice?currency=${currentCurrency}`
      )

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to download invoice')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()

      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Invoice downloaded')
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to download invoice')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={className}
      aria-label="Download PDF invoice"
    >
      {downloading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {downloading ? 'Preparing' : 'Invoice (PDF)'}
    </button>
  )
}
