'use client'

import { Loader2, RotateCcw, Trash2 } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { StatusPill, bookingStatusTone, statusLabel } from '@/components/admin/ui/status-pill'
import { formatCurrency } from '@/lib/utils'
import type { TrashedBookingRow } from '../types'

interface TrashRowProps {
  row: TrashedBookingRow
  selected: boolean
  /** Any restore or purge is running; every control waits. */
  busy: boolean
  /** This row's own restore is running (shows the spinner). */
  restoring: boolean
  onToggle: (checked: boolean) => void
  onRestore: () => void
  onPurge: () => void
}

/** One deleted trip in the trash table. */
export function TrashRow({ row, selected, busy, restoring, onToggle, onRestore, onPurge }: TrashRowProps): React.JSX.Element {
  return (
    <TableRow data-state={selected ? 'selected' : undefined}>
      <TableCell>
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onToggle(checked === true)}
          aria-label={`Select ${row.tripLabel}`}
          className="translate-y-[2px]"
          disabled={busy}
        />
      </TableCell>
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
          <Button size="sm" variant="outline" disabled={busy} onClick={onRestore}>
            {restoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
            Restore
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            aria-label={`Delete ${row.tripLabel} for good`}
            disabled={busy}
            onClick={onPurge}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
