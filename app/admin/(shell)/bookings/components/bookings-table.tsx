'use client'

import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  StatusPill,
  assignmentStatusTone,
  bookingStatusTone,
  paymentStatusTone,
  statusLabel,
} from '@/components/admin/ui/status-pill'
import { RowViewLink } from '@/components/admin/ui/row-view-link'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  MoreHorizontal, 
  Eye, 
  FileText, 
  MapPin,
  Car,
  CreditCard,
  Building2,
  User,
  UserPlus,
  Mail,
  Phone,
  RefreshCw,
  Trash2,
  Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { toBookingTz } from '@/lib/utils/timezone'
import { toast } from 'sonner'
import { BookingWithCustomer, updatePaymentStatus, deleteBooking } from '../actions'
import { RefundBusinessBookingDialog } from './refund-business-booking-dialog'
import { customerPaymentBlockedReason } from '@/lib/bookings/admin-booking-rules'

/**
 * "Mark Paid" in the row menu. Customer bookings follow the admin booking rules (only a
 * booking still waiting for payment); business bookings keep their existing rule.
 */
function canMarkPaid(booking: BookingWithCustomer): boolean {
  if (booking.bookingType === 'business') {
    return booking.payment_status !== 'completed' && booking.payment_status !== 'refunded'
  }
  return customerPaymentBlockedReason(booking, 'completed') === null
}
import { BulkActionsBar } from './bulk-actions-bar'
import { AssignVendorModal } from './assign-vendor-modal'
import { TripGroupRow, activeAssignmentOf, unassignedOtherLegIds } from './trip-group-row'
import { TripJourneysPanel } from './trip-journeys-panel'
import { EmptyState } from '@/components/ui/empty-state'
import { customerPaymentLabel, vendorAssignBlockedReason, type PaymentBadgeRow } from '@/lib/bookings/unpaid-expiry'
import { hourlySummary, isHourlyBooking, legLabel, tripTypeLabel, tripTypeOf } from '@/lib/trips/display'

interface BookingsTableProps {
  bookings: BookingWithCustomer[]
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  const router = useRouter()
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set())
  const [assignModalBookingId, setAssignModalBookingId] = useState<string | null>(null)
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null)
  const [deleteBookingType, setDeleteBookingType] = useState<'customer' | 'business'>('customer')
  const [isDeleting, setIsDeleting] = useState(false)
  const [refundBookingId, setRefundBookingId] = useState<string | null>(null)
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set())

  const getStatusBadge = (status: string) => (
    <StatusPill tone={bookingStatusTone(status)}>{statusLabel(status)}</StatusPill>
  )

  // Customer rows read "Awaiting payment" / "Expired (unpaid)"; business rows keep their labels.
  const getPaymentStatusBadge = (status: string, row?: PaymentBadgeRow) => {
    if (row?.bookingType === 'customer' && status) {
      const state = { bookingStatus: row.booking_status, paymentStatus: status, paymentExpiredAt: row.payment_expired_at }
      return (
        <StatusPill tone={state.paymentExpiredAt ? 'neutral' : paymentStatusTone(status)}>
          {customerPaymentLabel(state)}
        </StatusPill>
      )
    }
    return (
      <StatusPill tone={paymentStatusTone(status || 'pending')}>
        {status === 'completed' ? 'Paid' : status ? statusLabel(status) : 'Pending'}
      </StatusPill>
    )
  }

  const getBookingTypeBadge = (type?: 'customer' | 'business') => (
    <StatusPill tone="neutral">
      <User />
      {type === 'business' ? 'Business' : 'Customer'}
    </StatusPill>
  )

  const getAssignmentStatusBadge = (status?: string | null) => (
    <StatusPill tone={assignmentStatusTone(status)}>{statusLabel(status)}</StatusPill>
  )

  // A grouped trip row stands for several journeys; selection and lookups work on the journeys.
  const journeys = bookings.flatMap((booking) => booking.trip_legs ?? [booking])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(new Set(journeys.map(booking => booking.id)))
    } else {
      setSelectedBookings(new Set())
    }
  }

  const handleSelectMany = (bookingIds: string[], checked: boolean) => {
    const newSelected = new Set(selectedBookings)
    for (const bookingId of bookingIds) {
      if (checked) {
        newSelected.add(bookingId)
      } else {
        newSelected.delete(bookingId)
      }
    }
    setSelectedBookings(newSelected)
  }

  const handleSelectOne = (bookingId: string, checked: boolean) => handleSelectMany([bookingId], checked)

  const isSelected = (bookingId: string) => selectedBookings.has(bookingId)
  const isAllSelected = journeys.length > 0 && selectedBookings.size === journeys.length
  const isIndeterminate = selectedBookings.size > 0 && !isAllSelected

  const toggleTrip = (groupId: string) => {
    const next = new Set(expandedTrips)
    if (next.has(groupId)) {
      next.delete(groupId)
    } else {
      next.add(groupId)
    }
    setExpandedTrips(next)
  }

  const renderTripGroup = (row: BookingWithCustomer, legs: BookingWithCustomer[], groupNumber: string) => {
    const groupId = row.booking_group_id ?? row.id
    const expanded = expandedTrips.has(groupId)
    const selectedCount = legs.filter((leg) => isSelected(leg.id)).length
    const needsVendor = legs.find((leg) => leg.booking_status !== 'cancelled' && !activeAssignmentOf(leg))
    return (
      <Fragment key={`trip-${groupId}`}>
        <TripGroupRow
          row={row}
          legs={legs}
          groupNumber={groupNumber}
          expanded={expanded}
          selected={selectedCount === 0 ? false : selectedCount === legs.length ? true : 'indeterminate'}
          onToggle={() => toggleTrip(groupId)}
          onSelect={(checked) => handleSelectMany(legs.map((leg) => leg.id), checked)}
          onOpen={() => router.push(`/admin/bookings/${(needsVendor ?? legs[0]).id}`)}
          statusBadge={getStatusBadge}
          paymentBadge={getPaymentStatusBadge}
        />
        <TripJourneysPanel
          legs={legs}
          legCount={row.booking_group?.leg_count ?? legs.length}
          expanded={expanded}
          colSpan={10}
          canNavigate={() => !deleteBookingId}
          onOpenJourney={(bookingId) => router.push(`/admin/bookings/${bookingId}`)}
          renderMenu={renderBookingMenu}
          statusBadge={getStatusBadge}
          assignmentBadge={getAssignmentStatusBadge}
        />
      </Fragment>
    )
  }

  const handleUpdatePaymentStatus = async (
    bookingId: string,
    status: 'completed' | 'failed' | 'refunded',
    bookingType: 'customer' | 'business'
  ) => {
    try {
      // The action needs the type to pick the table, exactly as the status update does.
      const result = await updatePaymentStatus(bookingId, status, bookingType)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(`Payment status updated to ${status}`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to update payment status')
    }
  }

  const handleDeleteBooking = async () => {
    if (!deleteBookingId) return
    setIsDeleting(true)
    try {
      const result = await deleteBooking(deleteBookingId, deleteBookingType)
      if (result.error) {
        toast.error(result.error)
      } else {
        const removed = result.deletedIds?.length ?? 1
        toast.success(removed > 1 ? `Trip moved to trash (${removed} journeys)` : 'Booking moved to trash')
        router.refresh()
      }
    } catch (error) {
      toast.error('Failed to delete booking')
    } finally {
      setIsDeleting(false)
      setDeleteBookingId(null)
    }
  }

  // One journey or one-way booking. Also used for the journeys under an expanded trip row.
  // Per-booking actions. Shared by plain rows and the journey lines inside an expanded trip.
  const renderBookingMenu = (booking: BookingWithCustomer) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push(`/admin/bookings/${booking.id}`)}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          disabled={vendorAssignBlockedReason(booking.bookingType, booking.payment_status) !== null}
          title={vendorAssignBlockedReason(booking.bookingType, booking.payment_status) ?? undefined}
          onClick={(e) => {
            e.stopPropagation()
            setAssignModalBookingId(booking.id)
          }}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {booking.booking_assignments && booking.booking_assignments.length > 0 ? 'Reassign Vendor' : 'Assign Vendor'}
        </DropdownMenuItem>
        
        {(canMarkPaid(booking) ||
          (booking.bookingType === 'business' && booking.booking_status === 'cancelled' && booking.payment_status !== 'refunded')) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Payment</DropdownMenuLabel>
          </>
        )}

        {canMarkPaid(booking) && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              handleUpdatePaymentStatus(booking.id, 'completed', booking.bookingType || 'customer')
            }}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Mark Paid
          </DropdownMenuItem>
        )}
        
        {/* Business bookings are paid from the wallet, so a refund moves real money back through
            the refund dialog, and only once the booking is cancelled. A customer refund is a
            status change on the booking page only. */}
        {booking.bookingType === 'business'
          ? booking.booking_status === 'cancelled' && booking.payment_status !== 'refunded' && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setRefundBookingId(booking.id)
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refund to Wallet
              </DropdownMenuItem>
            )
          : null}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem>
          <Mail className="mr-2 h-4 w-4" />
          Email Customer
        </DropdownMenuItem>
        
        {booking.customer?.phone && (
          <DropdownMenuItem>
            <Phone className="mr-2 h-4 w-4" />
            Call Customer
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            setDeleteBookingId(booking.id)
            setDeleteBookingType(booking.bookingType || 'customer')
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Booking
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const renderBookingRow = (booking: BookingWithCustomer) => (
      <TableRow
        key={booking.id}
        className="cursor-pointer"
        onClick={(e) => {
          // Prevent row click if a dialog is open or the click came from an
          // interactive element. Dropdown menus and dialogs render through a
          // React portal, so their clicks bubble up the React tree into this
          // handler even though they are not DOM descendants of the row.
          const el = e.target as HTMLElement
          if (
            el.closest('.no-row-click') ||
            el.closest('[role="menuitem"]') ||
            el.closest('[role="alertdialog"]') ||
            deleteBookingId
          ) {
            return
          }
          router.push(`/admin/bookings/${booking.id}`)
        }}
      >
        <TableCell className="no-row-click">
          <Checkbox
            checked={isSelected(booking.id)}
            onCheckedChange={(checked) => handleSelectOne(booking.id, checked as boolean)}
            aria-label={`Select booking ${booking.booking_number}`}
          />
        </TableCell>
        <TableCell className="font-mono text-xs">
          <div>{booking.trip_number || booking.booking_number}</div>
          {booking.trip_number && <div className="max-w-[130px] truncate text-[11px] text-muted-foreground" title={booking.booking_number}>{booking.booking_number}</div>}
        </TableCell>
        <TableCell>
          <div className="flex flex-col items-start gap-1">
            {getBookingTypeBadge(booking.bookingType)}
            {tripTypeOf(booking) !== 'one_way' && (
              <StatusPill tone="neutral">{tripTypeLabel(booking)}</StatusPill>
            )}
            {booking.booking_group && legLabel(booking, booking.booking_group.leg_count) && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {booking.booking_group.group_number} · {legLabel(booking, booking.booking_group.leg_count)}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 whitespace-nowrap text-sm">
            <div className="space-y-1">
              <div className="font-medium">
                {format(toBookingTz(booking.pickup_datetime), 'MMM dd, yyyy')}
              </div>
              <div className="text-muted-foreground">
                {format(toBookingTz(booking.pickup_datetime), 'HH:mm')}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1 text-sm max-w-[150px]">
            <div className="flex items-start gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="truncate" title={booking.pickup_address}>{booking.pickup_address}</span>
            </div>
            <div className="flex items-start gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="truncate" title={(isHourlyBooking(booking) ? hourlySummary(booking) : booking.dropoff_address) ?? undefined}>
                {isHourlyBooking(booking) ? hourlySummary(booking) : booking.dropoff_address}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {(() => {
            const assignment = booking.booking_assignments?.[0]

            if (!assignment) {
              return (
                <StatusPill tone="warning">Unassigned</StatusPill>
              )
            }

            const vendorName = assignment.vendor?.business_name || 'Unknown Vendor'

            return (
              <div className="flex items-start gap-2 max-w-[150px]">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 space-y-1">
                  <div className="font-medium text-sm truncate" title={vendorName}>
                    {vendorName}
                  </div>
                  <div>{getAssignmentStatusBadge(assignment.status)}</div>
                  {assignment.status === 'accepted' && assignment.driver && (
                    <div className="text-xs text-muted-foreground truncate">
                      Driver: {assignment.driver.first_name} {assignment.driver.last_name}
                    </div>
                  )}
                  {assignment.status === 'accepted' && assignment.vehicle && (
                    <div className="text-xs text-muted-foreground truncate">
                      Vehicle: {assignment.vehicle.registration_number}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </TableCell>
        <TableCell>
          {getStatusBadge(booking.booking_status)}
        </TableCell>
        <TableCell>
          {getPaymentStatusBadge(booking.payment_status, booking)}
        </TableCell>
        <TableCell className="whitespace-nowrap text-right font-semibold">
          {formatCurrency(booking.total_price)}
        </TableCell>
        <TableCell className="text-right no-row-click">
          <div className="inline-flex items-center gap-0.5">
            <RowViewLink href={`/admin/bookings/${booking.id}`} />
            {renderBookingMenu(booking)}
          </div>
        </TableCell>
      </TableRow>
  )

  return (
    <>
      <div className="space-y-4">
        {selectedBookings.size > 0 && (
          <BulkActionsBar 
            selectedCount={selectedBookings.size}
            selectedBookingIds={Array.from(selectedBookings)}
            onClearSelection={() => setSelectedBookings(new Set())}
          />
        )}
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[120px]">Booking #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-[400px] p-0">
                    <EmptyState
                      icon={Car}
                      title="No Bookings Found"
                      description="There are no bookings matching your current filters. Try adjusting your search criteria."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) =>
                  booking.trip_legs && booking.booking_group ? (
                    renderTripGroup(booking, booking.trip_legs, booking.booking_group.group_number)
                  ) : (
                    renderBookingRow(booking)
                  )
                )
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog
        open={!!deleteBookingId}
        onOpenChange={(open) => {
          // Keep the dialog up while the delete is in flight so the spinner stays visible.
          if (!open && !isDeleting) setDeleteBookingId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Move this booking to the trash? Every journey of a round trip or multi-city
              trip moves with it. You can restore it from Bookings, Trash for 30 days, after
              which it is removed for good. Vendor assignments are not restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBooking}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Booking'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {assignModalBookingId && (() => {
        const targetBooking = journeys.find(b => b.id === assignModalBookingId)
        const tripLegs = bookings.find(b => b.trip_legs?.some(leg => leg.id === assignModalBookingId))?.trip_legs ?? []
        const activeAssignment = targetBooking?.booking_assignments?.find(
          (a: any) => ['pending', 'accepted'].includes(a.status)
        )
        const driverAssigned = activeAssignment?.status === 'accepted' && !!activeAssignment?.driver_id
        return (
          <AssignVendorModal
            bookingId={assignModalBookingId}
            bookingType={targetBooking?.bookingType || 'customer'}
            currentVendorId={activeAssignment?.vendor_id}
            vehicleTypeId={targetBooking?.vehicle_type_id}
            otherLegIds={unassignedOtherLegIds(tripLegs, assignModalBookingId)}
            hasDriverAssigned={driverAssigned}
            currentDriverName={
              driverAssigned && activeAssignment?.driver
                ? `${activeAssignment.driver.first_name} ${activeAssignment.driver.last_name}`
                : undefined
            }
            currentVehicleName={
              driverAssigned && activeAssignment?.vehicle
                ? `${activeAssignment.vehicle.make} ${activeAssignment.vehicle.model} (${activeAssignment.vehicle.registration_number})`
                : undefined
            }
            onClose={() => setAssignModalBookingId(null)}
          />
        )
      })()}

      <RefundBusinessBookingDialog
        bookingId={refundBookingId}
        open={!!refundBookingId}
        onOpenChange={(open) => !open && setRefundBookingId(null)}
      />
    </>
  )
}