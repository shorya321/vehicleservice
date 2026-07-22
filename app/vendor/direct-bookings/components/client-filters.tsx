'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  type DirectBookingFilters,
} from '@/lib/vendor/direct-bookings/schema'

export function ClientFilters({ initialFilters }: { initialFilters: DirectBookingFilters }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(initialFilters.search ?? '')

  /** Any filter change resets to page 1 — otherwise page 3 of the old result set
   *  can land outside the new one and render empty. */
  function apply(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())

    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }

    params.delete('page')

    startTransition(() => {
      router.push(`/vendor/direct-bookings?${params.toString()}`)
    })
  }

  const hasFilters =
    !!initialFilters.search ||
    (initialFilters.status && initialFilters.status !== 'all') ||
    (initialFilters.paymentStatus && initialFilters.paymentStatus !== 'all') ||
    !!initialFilters.from ||
    !!initialFilters.to

  return (
    <div className="flex flex-wrap items-end gap-2">
      <form
        className="flex flex-1 min-w-[220px] gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          apply({ search })
        }}
      >
        <Input
          placeholder="Search name, phone, reference, location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="secondary" size="icon" disabled={isPending}>
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </form>

      <Select
        value={initialFilters.status ?? 'all'}
        onValueChange={(value) => apply({ status: value })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {BOOKING_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {BOOKING_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={initialFilters.paymentStatus ?? 'all'}
        onValueChange={(value) => apply({ paymentStatus: value })}
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="All payments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All payments</SelectItem>
          {PAYMENT_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {PAYMENT_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        className="w-[150px]"
        aria-label="Pickup from"
        value={initialFilters.from ?? ''}
        onChange={(e) => apply({ from: e.target.value })}
      />
      <Input
        type="date"
        className="w-[150px]"
        aria-label="Pickup to"
        value={initialFilters.to ?? ''}
        onChange={(e) => apply({ to: e.target.value })}
      />

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => {
            setSearch('')
            startTransition(() => router.push('/vendor/direct-bookings'))
          }}
        >
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
