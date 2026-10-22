'use client'

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
import type { TrashedBookingRow } from '../types'

export type PendingAction =
  | { kind: 'purge'; row: TrashedBookingRow }
  | { kind: 'purgeSelected'; ids: string[] }
  | { kind: 'empty' }
  | null

interface TrashConfirmDialogProps {
  pending: PendingAction
  /** Everything in the trash, for the Empty trash wording. */
  totalCount: number
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}

function describe(pending: PendingAction, totalCount: number): string {
  if (pending?.kind === 'empty') {
    return `All ${totalCount} deleted trips will be removed permanently. They can no longer be restored.`
  }
  if (pending?.kind === 'purgeSelected') {
    const n = pending.ids.length
    return `${n} selected ${n === 1 ? 'trip' : 'trips'} will be removed permanently and can no longer be restored.`
  }
  return `${pending?.kind === 'purge' ? pending.row.tripLabel : ''} will be removed permanently and can no longer be restored.`
}

/** Confirmation before anything leaves the trash for good. */
export function TrashConfirmDialog({ pending, totalCount, busy, onCancel, onConfirm }: TrashConfirmDialogProps): React.JSX.Element {
  return (
    <AlertDialog open={pending !== null} onOpenChange={(open) => !open && !busy && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pending?.kind === 'empty' ? 'Empty the trash?' : 'Delete for good?'}</AlertDialogTitle>
          <AlertDialogDescription>{describe(pending, totalCount)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Keep</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? 'Removing...' : 'Delete for good'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
