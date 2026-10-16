'use client'

/**
 * Refund a cancelled business booking to its wallet.
 *
 * Built so a misclick cannot move money: the dialog only opens a form, the amount and reason
 * must be filled in, and the admin has to type the booking number before the button enables.
 * The figures are read fresh each time it opens, and the server checks everything again.
 */

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/utils'
import {
  REFUND_REASON_MAX,
  REFUND_REASON_MIN,
  refundBlockedReason,
  refundConfirmationMatches,
} from '@/lib/business/refunds'
import { getBusinessRefundSummary, refundBusinessBooking } from '../refund-actions'

interface RefundBusinessBookingDialogProps {
  bookingId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Summary {
  bookingNumber: string
  bookingStatus: string
  paid: number
  alreadyRefunded: number
  refundable: number
}

export function RefundBusinessBookingDialog({ bookingId, open, onOpenChange }: RefundBusinessBookingDialogProps) {
  const [busy, setBusy] = useState(false)
  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refund to business wallet</DialogTitle>
          <DialogDescription>
            Money goes back to the business wallet straight away and cannot be taken back here.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted per opening, so every field starts empty and the figures are read fresh. */}
        {open && bookingId && (
          <RefundForm
            key={bookingId}
            bookingId={bookingId}
            onBusyChange={setBusy}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface RefundFormProps {
  bookingId: string
  onBusyChange: (busy: boolean) => void
  onDone: () => void
}

function RefundForm({ bookingId, onBusyChange, onDone }: RefundFormProps) {
  const router = useRouter()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [isSubmitting, startSubmit] = useTransition()

  useEffect(() => {
    onBusyChange(isSubmitting)
  }, [isSubmitting, onBusyChange])

  // Closing on success unmounts the form mid-transition; release the wrapper's lock with it.
  useEffect(() => () => onBusyChange(false), [onBusyChange])

  useEffect(() => {
    let cancelled = false
    getBusinessRefundSummary(bookingId)
      .then((result) => {
        if (cancelled) return
        if (result.error || !result.summary) {
          setLoadError(result.error ?? 'Could not load this booking.')
          return
        }
        setSummary(result.summary)
        setAmount(result.summary.refundable > 0 ? result.summary.refundable.toFixed(2) : '')
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load this booking.')
      })
    return () => {
      cancelled = true
    }
  }, [bookingId])

  const amountNumber = Number(amount)
  const blocked = summary
    ? refundBlockedReason({
        bookingStatus: summary.bookingStatus,
        paid: summary.paid,
        alreadyRefunded: summary.alreadyRefunded,
        amount: amountNumber,
      })
    : null
  const reasonOk = reason.trim().length >= REFUND_REASON_MIN && reason.trim().length <= REFUND_REASON_MAX
  const confirmed = summary ? refundConfirmationMatches(confirmation, summary.bookingNumber) : false
  const canSubmit = Boolean(summary) && !blocked && reasonOk && confirmed && !isSubmitting

  function submit() {
    if (!canSubmit) return
    startSubmit(async () => {
      const result = await refundBusinessBooking({ bookingId, amount: amountNumber, reason, confirmation })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(`Refunded ${formatCurrency(result.refunded ?? amountNumber)} to the business wallet`)
      onDone()
      router.refresh()
    })
  }

  return (
    <>
        {loadError && <p className="text-sm text-destructive">{loadError}</p>}
        {!summary && !loadError && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the booking
          </div>
        )}

        {summary && (
          <div className="space-y-4">
            <dl className="grid grid-cols-3 gap-2 rounded-lg border border-border p-3 text-sm">
              <div className="space-y-1">
                <dt className="text-xs text-muted-foreground">Paid</dt>
                <dd className="font-medium tabular-nums">{formatCurrency(summary.paid)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs text-muted-foreground">Refunded</dt>
                <dd className="font-medium tabular-nums">{formatCurrency(summary.alreadyRefunded)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs text-muted-foreground">Refundable</dt>
                <dd className="font-semibold tabular-nums">{formatCurrency(summary.refundable)}</dd>
              </div>
            </dl>

            <div className="space-y-1.5">
              <Label htmlFor="refund-amount">Amount (AED)</Label>
              <Input
                id="refund-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                max={summary.refundable}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={summary.refundable <= 0}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="refund-reason">Reason</Label>
              <Textarea
                id="refund-reason"
                rows={2}
                maxLength={REFUND_REASON_MAX}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why this booking is being refunded"
              />
              <p className="text-xs text-muted-foreground">
                At least {REFUND_REASON_MIN} characters. Shown in the business wallet history.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="refund-confirm">
                Type <span className="font-mono font-semibold">{summary.bookingNumber}</span> to confirm
              </Label>
              <Input
                id="refund-confirm"
                autoComplete="off"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </div>

            {blocked && <p className="text-sm text-destructive">{blocked}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onDone} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={!canSubmit}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refund {summary && amountNumber > 0 ? formatCurrency(amountNumber) : ''} to wallet
          </Button>
        </DialogFooter>
    </>
  )
}
