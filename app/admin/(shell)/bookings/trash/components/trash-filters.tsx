'use client'

import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TrashedBookingRow } from '../types'

export type TrashSource = 'all' | TrashedBookingRow['source']

interface TrashFiltersProps {
  search: string
  source: TrashSource
  onSearchChange: (value: string) => void
  onSourceChange: (value: TrashSource) => void
}

/** Search and source filter for the trash, in the same row style as the CMS pages list. */
export function TrashFilters({ search, source, onSearchChange, onSourceChange }: TrashFiltersProps): React.JSX.Element {
  const hasFilters = search !== '' || source !== 'all'

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search deleted trips"
          placeholder="Search by trip, customer or business"
          className="pl-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select value={source} onValueChange={(v) => onSourceChange(v as TrashSource)}>
        <SelectTrigger aria-label="Filter by booking type" className="w-full md:w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All bookings</SelectItem>
          <SelectItem value="customer">Customer</SelectItem>
          <SelectItem value="business">Business</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Clear filters"
          onClick={() => {
            onSearchChange('')
            onSourceChange('all')
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

/** Rows matching the search (trip number, customer, business) and the source filter. */
export function filterTrashRows(rows: TrashedBookingRow[], search: string, source: TrashSource): TrashedBookingRow[] {
  const query = search.trim().toLowerCase()
  return rows.filter(
    (row) =>
      (source === 'all' || row.source === source) &&
      (!query ||
        row.tripLabel.toLowerCase().includes(query) ||
        row.customerName.toLowerCase().includes(query) ||
        (row.businessName ?? '').toLowerCase().includes(query))
  )
}
