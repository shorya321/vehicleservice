'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface StatusResult {
  success: boolean
  error?: string
  /** Items actually changed, when the action reports it. */
  count?: number
  /** One message per item the server refused to change. */
  failed?: string[]
}

interface DeleteResult {
  count: number
  /** One message per item the server refused to delete. */
  failed: string[]
}

interface BulkActionsBarProps {
  selectedCount: number
  /** Singular and plural noun, e.g. ['location type', 'location types']. */
  noun: [string, string]
  onClearSelection: () => void
  onSetStatus: (isActive: boolean) => Promise<StatusResult>
  /** Omit to hide Delete All (e.g. pages, which cannot be deleted). */
  onDelete?: () => Promise<DeleteResult>
  /** Wording for the two status actions. Defaults to Activate / Deactivate. */
  statusWords?: StatusWords
}

interface StatusWords {
  on: string
  off: string
  onDone: string
  offDone: string
}

const ACTIVE_WORDS: StatusWords = { on: 'Activate', off: 'Deactivate', onDone: 'activated', offDone: 'deactivated' }

type Confirm = 'delete' | 'deactivate' | null

/**
 * Selection bar for admin tables: Activate, Deactivate (confirmed) and an
 * optional Delete (confirmed). Same look as the zones and routes bars.
 */
export function BulkActionsBar({
  selectedCount,
  noun,
  onClearSelection,
  onSetStatus,
  onDelete,
  statusWords = ACTIVE_WORDS,
}: BulkActionsBarProps): React.JSX.Element {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const label = (n: number): string => `${n} ${n === 1 ? noun[0] : noun[1]}`

  const done = (): void => {
    onClearSelection()
    router.refresh()
  }

  // The server explains each refusal; show the first and a total.
  const reportFailed = (failed: string[], verb: string): void => {
    if (failed.length === 0) return
    toast.error(failed.length === 1 ? failed[0] : `${label(failed.length)} not ${verb}. ${failed[0]}`)
  }

  const setStatus = async (isActive: boolean): Promise<void> => {
    const result = await onSetStatus(isActive)
    const failed = result.failed ?? []
    if (!result.success && failed.length === 0) {
      toast.error(result.error ?? 'Failed to update status')
      return
    }
    const count = result.count ?? selectedCount
    const doneWord = isActive ? statusWords.onDone : statusWords.offDone
    if (count > 0) toast.success(`${label(count)} ${doneWord}`)
    else if (failed.length === 0) toast.info(`Already ${doneWord}`)
    reportFailed(failed, 'changed')
    done()
  }

  const remove = async (): Promise<void> => {
    if (!onDelete) return
    const { count, failed } = await onDelete()
    if (count > 0) toast.success(`${label(count)} deleted`)
    reportFailed(failed, 'deleted')
    done()
  }

  const run = async (task: () => Promise<void>): Promise<void> => {
    setLoading(true)
    try {
      await task()
    } catch {
      toast.error('Something went wrong. Try again.')
    } finally {
      setLoading(false)
      setConfirm(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClearSelection} aria-label="Clear selection" className="h-8 px-2">
            <X className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium">{label(selectedCount)} selected</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              Bulk Actions
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => run(() => setStatus(true))} disabled={loading}>
              <ToggleRight className="mr-2 h-4 w-4" />
              {statusWords.on} All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setConfirm('deactivate')} disabled={loading}>
              <ToggleLeft className="mr-2 h-4 w-4" />
              {statusWords.off} All
            </DropdownMenuItem>
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setConfirm('delete')} disabled={loading} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === 'delete' ? `Delete ${noun[1]}` : `${statusWords.off} ${noun[1]}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'delete'
                ? `Delete ${label(selectedCount)}? This cannot be undone. Any still in use are skipped.`
                : `${statusWords.off} ${label(selectedCount)}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => run(confirm === 'delete' ? remove : () => setStatus(false))}
              disabled={loading}
              className={confirm === 'delete' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {loading ? 'Processing' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
