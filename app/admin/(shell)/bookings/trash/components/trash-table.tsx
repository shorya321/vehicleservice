'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, RotateCcw, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { StatusPill, bookingStatusTone, statusLabel } from '@/components/admin/ui/status-pill'
import { formatCurrency } from '@/lib/utils'
import { purgeTrashedBookings, restoreTrashedBooking } from '../actions'
import type { TrashedBookingRow } from '../types'

type PendingAction = { kind: 'purge'; row: TrashedBookingRow } | { kind: 'empty' } | null

interface TrashTableProps {
  rows: TrashedBookingRow[]
}

export function TrashTable({ rows }: TrashTableProps): React.JSX.Element {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAction>(null)

  async function restore(row: TrashedBookingRow): Promise<void> {
    setBusyId(row.id)
    try {
      const result = await restoreTrashedBooking(row.id)
      if (result.error) toast.error(result.error)
      else {
        toast.success(`${row.tripLabel} restored`)
        router.refresh()
      }
    } catch {
      toast.error('Failed to restore booking')
    } finally {
      setBusyId(null)
    }
  }

  async function confirmPurge(): Promise<void> {
    if (!pending) return
    const target = pending.kind === 'purge' ? pending.row.id : undefined
    setBusyId(target ?? 'all')
    try {
      const result = await purgeTrashedBookings(target)
      if (result.error) toast.error(result.error)
      else {
        toast.success(target ? 'Deleted for good' : 'Trash emptied')
        router.refresh()
      }
    } catch {
      toast.error('Failed to remove deleted bookings')
    } finally {
      setBusyId(null)
      setPending(null)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border bg-card p-10 text-center text-sm text-muted-foreground">
        The trash is empty. Deleted bookings appear here for 30 days.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" disabled={busyId !== null} onClick={() => setPending({ kind: 'empty' })}>
          <Trash2 className="mr-2 h-4 w-4" />
          Empty trash
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trip</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deleted</TableHead>
              <TableHead>Removed for good</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="font-medium">{row.tripLabel}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.tripType}
                    {row.legCount > 1 ? `, ${row.legCount} journeys` : ''}
                    {row.fromQuotation ? ', from a quotation' : ''}
                  </div>
                </TableCell>
                <TableCell>
                  <div>{row.customerName}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.source === 'business' ? row.businessName ?? 'Business' : 'Customer booking'}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">{row.pickupAt}</TableCell>
                <TableCell>
                  {row.bookingStatus && (
                    <StatusPill tone={bookingStatusTone(row.bookingStatus)}>{statusLabel(row.bookingStatus)}</StatusPill>
                  )}
                  {row.totalPrice !== null && (
                    <div className="mt-1 text-xs text-muted-foreground">{formatCurrency(row.totalPrice)}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="whitespace-nowrap">{row.deletedAt}</div>
                  <div className="text-xs text-muted-foreground">by {row.deletedBy}</div>
                </TableCell>
                <TableCell className="whitespace-nowrap">{row.expiresAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" disabled={busyId !== null} onClick={() => restore(row)}>
                      {busyId === row.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      aria-label={`Delete ${row.tripLabel} for good`}
                      disabled={busyId !== null}
                      onClick={() => setPending({ kind: 'purge', row })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && busyId === null && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending?.kind === 'empty' ? 'Empty the trash?' : 'Delete for good?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === 'empty'
                ? `All ${rows.length} deleted trips will be removed permanently. They can no longer be restored.`
                : `${pending?.kind === 'purge' ? pending.row.tripLabel : ''} will be removed permanently and can no longer be restored.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId !== null}>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void confirmPurge()
              }}
              disabled={busyId !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busyId !== null ? 'Removing...' : 'Delete for good'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
