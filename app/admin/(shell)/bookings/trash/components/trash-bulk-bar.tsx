'use client'

import { Loader2, RotateCcw, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TrashBulkBarProps {
  selectedCount: number
  busy: boolean
  onClear: () => void
  onRestore: () => void
  onPurge: () => void
}

/** Selection bar for the trash, in the same style as the other admin bulk bars. */
export function TrashBulkBar({ selectedCount, busy, onClear, onRestore, onPurge }: TrashBulkBarProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onClear} aria-label="Clear selection" className="h-8 px-2" disabled={busy}>
          <X className="h-4 w-4" />
        </Button>
        <p className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? 'trip' : 'trips'} selected
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRestore} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
          Restore
        </Button>
        <Button variant="outline" size="sm" className="text-destructive" onClick={onPurge} disabled={busy}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete for good
        </Button>
      </div>
    </div>
  )
}
