'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { toBookingTz } from '@/lib/utils/timezone'
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  type DirectBookingStatus,
} from '@/lib/vendor/direct-bookings/schema'
import type { DirectBookingRow } from '@/lib/vendor/direct-bookings/types'
import {
  bulkDeleteDirectBookings,
  deleteDirectBooking,
  updateDirectBookingStatus,
} from '../actions'
import { BookingStatusBadge, PaymentStatusBadge } from './status-badges'

interface DirectBookingsTableProps {
  bookings: DirectBookingRow[]
}

/** Stored UTC, displayed as Dubai wall-clock — never via raw `new Date()`. */
function formatPickup(iso: string): string {
  return format(toBookingTz(iso), 'dd MMM yyyy, HH:mm')
}

export function DirectBookingsTable({ bookings }: DirectBookingsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pendingDelete, setPendingDelete] = useState<{
    ids: string[]
    label: string
  } | null>(null)

  const allSelected = bookings.length > 0 && selected.size === bookings.length

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(bookings.map((b) => b.id)) : new Set())
  }

  function toggleOne(id: string, checked: boolean) {
    // Rebuild rather than mutate the existing Set, so React sees a new reference.
    const next = new Set(selected)
    if (checked) {
      next.add(id)
    } else {
      next.delete(id)
    }
    setSelected(next)
  }

  function handleStatusChange(id: string, status: DirectBookingStatus) {
    startTransition(async () => {
      const result = await updateDirectBookingStatus(id, status)

      if (result.error) {
        toast.error('Could not update status', { description: result.error })
        return
      }

      toast.success(`Marked as ${BOOKING_STATUS_LABELS[status]}`)
      router.refresh()
    })
  }

  function confirmDelete() {
    if (!pendingDelete) return
    const { ids } = pendingDelete

    startTransition(async () => {
      const result =
        ids.length === 1
          ? await deleteDirectBooking(ids[0])
          : await bulkDeleteDirectBookings(ids)

      if (result.error) {
        toast.error('Could not delete', { description: result.error })
        return
      }

      toast.success(ids.length === 1 ? 'Booking deleted' : `${ids.length} bookings deleted`)
      setSelected(new Set())
      setPendingDelete(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-muted/40 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {selected.size} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() =>
              setPendingDelete({
                ids: Array.from(selected),
                label: `${selected.size} bookings`,
              })
            }
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => toggleAll(checked === true)}
                  aria-label="Select all bookings"
                />
              </TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id} data-state={selected.has(booking.id) && 'selected'}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(booking.id)}
                    onCheckedChange={(checked) => toggleOne(booking.id, checked === true)}
                    aria-label={`Select ${booking.reference_number}`}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {booking.reference_number}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{booking.customer_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {booking.customer_phone}
                  </div>
                </TableCell>
                <TableCell>
                  {booking.vehicle ? (
                    <>
                      <div>
                        {booking.vehicle.make} {booking.vehicle.model}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {booking.vehicle.registration_number}
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {booking.driver ? (
                    `${booking.driver.first_name} ${booking.driver.last_name}`
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div>{formatPickup(booking.pickup_datetime)}</div>
                  <div className="text-xs text-muted-foreground">
                    {booking.return_datetime
                      ? `until ${formatPickup(booking.return_datetime)}`
                      : booking.pickup_location}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div>{formatCurrency(booking.total_price)}</div>
                  {booking.amount_paid > 0 && booking.amount_paid < booking.total_price && (
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(booking.amount_paid)} paid
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={booking.payment_status} />
                </TableCell>
                <TableCell>
                  <BookingStatusBadge status={booking.booking_status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/vendor/direct-bookings/${booking.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        Mark as
                      </DropdownMenuLabel>
                      {BOOKING_STATUSES.filter(
                        (status) =>
                          status !== 'cancelled' && status !== booking.booking_status
                      ).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleStatusChange(booking.id, status)}
                        >
                          {BOOKING_STATUS_LABELS[status]}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() =>
                          setPendingDelete({
                            ids: [booking.id],
                            label: booking.reference_number,
                          })
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the booking record. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              disabled={isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
