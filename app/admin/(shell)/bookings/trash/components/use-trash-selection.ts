'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { TrashedBookingRow } from '../types'

interface TrashSelection {
  selected: Set<string>
  selectedIds: string[]
  isAllSelected: boolean
  isIndeterminate: boolean
  toggleRow: (id: string, checked: boolean) => void
  setAll: (checked: boolean) => void
  clear: () => void
}

/** Row selection for the trash. Rows that left the list (restored, purged, expired) drop out. */
export function useTrashSelection(rows: TrashedBookingRow[]): TrashSelection {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const selectedIds = rows.filter((row) => selected.has(row.id)).map((row) => row.id)
  const isAllSelected = rows.length > 0 && selectedIds.length === rows.length

  return {
    selected,
    selectedIds,
    isAllSelected,
    isIndeterminate: selectedIds.length > 0 && !isAllSelected,
    toggleRow: (id, checked) =>
      setSelected((prev) => {
        const next = new Set(prev)
        if (checked) next.add(id)
        else next.delete(id)
        return next
      }),
    setAll: (checked) => setSelected(checked ? new Set(rows.map((row) => row.id)) : new Set()),
    clear: () => setSelected(new Set()),
  }
}

/**
 * Runs a single-trip action once per id, in order, so each trip keeps its own server
 * checks and error message, then toasts how many worked and the first failure.
 */
export async function runForEachTrip(
  ids: string[],
  action: (id: string) => Promise<{ error?: string }>,
  doneWord: string
): Promise<void> {
  let done = 0
  const failed: string[] = []
  for (const id of ids) {
    try {
      const result = await action(id)
      if (result.error) failed.push(result.error)
      else done++
    } catch {
      failed.push('Something went wrong')
    }
  }
  const trips = (n: number): string => `${n} ${n === 1 ? 'trip' : 'trips'}`
  if (done > 0) toast.success(`${trips(done)} ${doneWord}`)
  if (failed.length > 0) {
    toast.error(failed.length === 1 ? failed[0] : `${trips(failed.length)} not ${doneWord}. ${failed[0]}`)
  }
}
