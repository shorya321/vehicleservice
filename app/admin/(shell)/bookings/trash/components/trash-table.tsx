'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { FilterToggle } from '@/components/admin/ui/filter-toggle'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { purgeTrashedBookings, restoreTrashedBooking } from '../actions'
import type { TrashedBookingRow } from '../types'
import { TrashBulkBar } from './trash-bulk-bar'
import { TrashRow } from './trash-row'
import { TrashConfirmDialog, type PendingAction } from './trash-confirm-dialog'
import { runForEachTrip, useTrashSelection } from './use-trash-selection'
import { TrashFilters, filterTrashRows, type TrashSource } from './trash-filters'


interface TrashTableProps {
  rows: TrashedBookingRow[]
}

export function TrashTable({ rows }: TrashTableProps): React.JSX.Element {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAction>(null)
  const [search, setSearch] = useState('')
  const [source, setSource] = useState<TrashSource>('all')
  const visible = filterTrashRows(rows, search, source)
  const activeFilterCount = [search.trim() !== '', source !== 'all'].filter(Boolean).length
  // Select-all and bulk actions only ever cover the rows the filters show.
  const selection = useTrashSelection(visible)
  const { selected, selectedIds, isAllSelected, isIndeterminate } = selection

  async function runForSelected(
    ids: string[],
    action: (id: string) => Promise<{ error?: string }>,
    doneWord: string
  ): Promise<void> {
    setBusyId('bulk')
    try {
      await runForEachTrip(ids, action, doneWord)
      selection.clear()
      router.refresh()
    } finally {
      setBusyId(null)
      setPending(null)
    }
  }

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
    if (pending.kind === 'purgeSelected') {
      await runForSelected(pending.ids, (id) => purgeTrashedBookings(id), 'deleted for good')
      return
    }
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

  return (
    <Card>
      <CardHeader>
        <FilterToggle
          activeCount={activeFilterCount}
          header={
            <div className="flex flex-1 flex-wrap items-start justify-between gap-4 md:flex-nowrap">
              <div className="min-w-0 space-y-1.5">
                <CardTitle>All Deleted Trips</CardTitle>
                <CardDescription>Restore a trip or remove it for good</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                disabled={busyId !== null || rows.length === 0}
                onClick={() => setPending({ kind: 'empty' })}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Empty trash
              </Button>
            </div>
          }
        >
          <TrashFilters search={search} source={source} onSearchChange={setSearch} onSourceChange={setSource} />
        </FilterToggle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedIds.length > 0 && (
          <TrashBulkBar
            selectedCount={selectedIds.length}
            busy={busyId !== null}
            onClear={selection.clear}
            onRestore={() => void runForSelected(selectedIds, (id) => restoreTrashedBooking(id), 'restored')}
            onPurge={() => setPending({ kind: 'purgeSelected', ids: selectedIds })}
          />
        )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                    onCheckedChange={(checked) => selection.setAll(checked === true)}
                    aria-label="Select all"
                    className="translate-y-[2px]"
                    disabled={busyId !== null || visible.length === 0}
                  />
                </TableHead>
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
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-[300px] p-0">
                    <EmptyState
                      icon={Trash2}
                      title={rows.length === 0 ? 'The Trash Is Empty' : 'No Deleted Trips Found'}
                      description={
                        rows.length === 0
                          ? 'Deleted bookings appear here for 30 days.'
                          : 'No deleted trips match your current filters.'
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
              {visible.map((row) => (
                <TrashRow
                  key={row.id}
                  row={row}
                  selected={selected.has(row.id)}
                  busy={busyId !== null}
                  restoring={busyId === row.id}
                  onToggle={(checked) => selection.toggleRow(row.id, checked)}
                  onRestore={() => restore(row)}
                  onPurge={() => setPending({ kind: 'purge', row })}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        <TrashConfirmDialog
          pending={pending}
          totalCount={rows.length}
          busy={busyId !== null}
          onCancel={() => setPending(null)}
          onConfirm={() => void confirmPurge()}
        />
      </CardContent>
    </Card>
  )
}
