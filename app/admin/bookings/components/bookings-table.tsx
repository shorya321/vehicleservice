'use client'

import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MoreHorizontal, 
  Eye, 
  FileText, 
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Car,
  CreditCard,
  User,
  UserPlus,
  Mail,
  Phone,
  RefreshCw
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { BookingWithCustomer, updateBookingStatus, updatePaymentStatus } from '../actions'
import { BulkActionsBar } from './bulk-actions-bar'
import { AssignVendorModal } from './assign-vendor-modal'
import { EmptyState } from '@/components/ui/empty-state'

interface BookingsTableProps {
  bookings: BookingWithCustomer[]
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  const router = useRouter()
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set())
  const [statusUpdateId, setStatusUpdateId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<'confirmed' | 'completed' | 'cancelled' | null>(null)
  const [statusUpdateBookingType, setStatusUpdateBookingType] = useState<'customer' | 'business' | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [assignModalBookingId, setAssignModalBookingId] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    // Handle undefined/null status
    if (!status) {
      return (
        <Badge variant="outline">
          Unknown
        </Badge>
      )
    }

    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      confirmed: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
      pending: 'outline',
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    // Handle undefined/null status
    if (!status) {
      return (
        <Badge variant="outline" className="text-xs">
          <CreditCard className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }

    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      refunded: 'outline',
      pending: 'outline',
    }

    return (
      <Badge variant={variants[status] || 'outline'} className="text-xs">
        <CreditCard className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getBookingTypeBadge = (type?: 'customer' | 'business') => {
    if (!type || type === 'customer') {
      return (
        <Badge variant="outline" className="text-xs">
          <User className="h-3 w-3 mr-1" />
          Customer
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="text-xs">
        <User className="h-3 w-3 mr-1" />
        Business
      </Badge>
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(new Set(bookings.map(booking => booking.id)))
    } else {
      setSelectedBookings(new Set())
    }
  }

  const handleSelectOne = (bookingId: string, checked: boolean) => {
    const newSelected = new Set(selectedBookings)
    if (checked) {
      newSelected.add(bookingId)
    } else {
      newSelected.delete(bookingId)
    }
    setSelectedBookings(newSelected)
  }

  const isSelected = (bookingId: string) => selectedBookings.has(bookingId)
  const isAllSelected = bookings.length > 0 && selectedBookings.size === bookings.length
  const isIndeterminate = selectedBookings.size > 0 && !isAllSelected

  const handleUpdateStatus = async () => {
    if (!statusUpdateId || !newStatus) return

    setIsUpdating(true)
    try {
      let cancellationReason = undefined
      if (newStatus === 'cancelled') {
        cancellationReason = 'Cancelled by admin'
      }

      await updateBookingStatus(
        statusUpdateId,
        newStatus,
        statusUpdateBookingType || 'customer',
        cancellationReason
      )
      toast.success(`Booking status updated to ${newStatus}`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to update booking status')
    } finally {
      setIsUpdating(false)
      setStatusUpdateId(null)
      setNewStatus(null)
      setStatusUpdateBookingType(null)
    }
  }

  const handleUpdatePaymentStatus = async (bookingId: string, status: 'completed' | 'failed' | 'refunded') => {
    try {
      await updatePaymentStatus(bookingId, status)
      toast.success(`Payment status updated to ${status}`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to update payment status')
    }
  }

  const getInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

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
                    checked={isAllSelected}
                    indeterminate={isIndeterminate || undefined}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[120px]">Booking #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Vehicle</TableHead>
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
                  <TableCell colSpan={12} className="h-[400px] p-0">
                    <EmptyState
                      icon={Car}
                      title="No Bookings Found"
                      description="There are no bookings matching your current filters. Try adjusting your search criteria."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={(e) => {
                      // Prevent row click if dialog is open or clicking on interactive elements
                      if (!(e.target as HTMLElement).closest('.no-row-click') || statusUpdateId) {
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
                    <TableCell className="font-mono text-sm">
                      {booking.booking_number}
                    </TableCell>
                    <TableCell>
                      {getBookingTypeBadge(booking.bookingType)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={booking.customer?.avatar_url || ''} />
                          <AvatarFallback>
                            {getInitials(booking.customer?.full_name, booking.customer?.email || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <div className="font-medium">
                            {booking.customer?.full_name || 'N/A'}
                          </div>
                          <div className="text-muted-foreground">
                            {booking.customer?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(booking.pickup_datetime), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-muted-foreground">
                            {format(new Date(booking.pickup_datetime), 'HH:mm')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm max-w-xs">
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="truncate">{booking.pickup_address}</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="truncate">{booking.dropoff_address}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.vehicle_type?.name && (
                        <div className="flex items-center gap-2 text-sm">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          {booking.vehicle_type.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {booking.booking_assignments && booking.booking_assignments.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {booking.booking_assignments[0].vendor?.business_name}
                            </Badge>
                            {/* Assignment Status Badge */}
                            {booking.booking_assignments[0].status === 'pending' && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                Pending
                              </Badge>
                            )}
                            {booking.booking_assignments[0].status === 'accepted' && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                Accepted
                              </Badge>
                            )}
                            {booking.booking_assignments[0].status === 'rejected' && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                Rejected
                              </Badge>
                            )}
                            {booking.booking_assignments[0].status === 'completed' && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                Completed
                              </Badge>
                            )}
                          </div>
                          {booking.booking_assignments[0].status === 'accepted' && booking.booking_assignments[0].driver && (
                            <span className="text-xs text-muted-foreground">
                              Driver: {booking.booking_assignments[0].driver.first_name} {booking.booking_assignments[0].driver.last_name}
                            </span>
                          )}
                          {booking.booking_assignments[0].status === 'accepted' && booking.booking_assignments[0].vehicle && (
                            <span className="text-xs text-muted-foreground">
                              Vehicle: {booking.booking_assignments[0].vehicle.registration_number}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(booking.booking_status)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(booking.payment_status)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(booking.total_price)}
                    </TableCell>
                    <TableCell className="text-right no-row-click">
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
                            onClick={(e) => {
                              e.stopPropagation()
                              setAssignModalBookingId(booking.id)
                            }}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            {booking.booking_assignments && booking.booking_assignments.length > 0 ? 'Reassign Vendor' : 'Assign Vendor'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs">Update Status</DropdownMenuLabel>
                          
                          {booking.booking_status !== 'confirmed' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setStatusUpdateId(booking.id)
                                setNewStatus('confirmed')
                                setStatusUpdateBookingType(booking.bookingType || 'customer')
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Confirmed
                            </DropdownMenuItem>
                          )}
                          
                          {booking.booking_status !== 'completed' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setStatusUpdateId(booking.id)
                                setNewStatus('completed')
                                setStatusUpdateBookingType(booking.bookingType || 'customer')
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Completed
                            </DropdownMenuItem>
                          )}
                          
                          {booking.booking_status !== 'cancelled' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setStatusUpdateId(booking.id)
                                setNewStatus('cancelled')
                                setStatusUpdateBookingType(booking.bookingType || 'customer')
                              }}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Booking
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs">Payment</DropdownMenuLabel>
                          
                          {booking.payment_status !== 'completed' && (
                            <DropdownMenuItem
                              onClick={() => handleUpdatePaymentStatus(booking.id, 'completed')}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Mark Paid
                            </DropdownMenuItem>
                          )}
                          
                          {booking.payment_status === 'completed' && (
                            <DropdownMenuItem
                              onClick={() => handleUpdatePaymentStatus(booking.id, 'refunded')}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Process Refund
                            </DropdownMenuItem>
                          )}
                          
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!statusUpdateId} onOpenChange={() => setStatusUpdateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Booking Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the booking status to {newStatus}?
              {newStatus === 'cancelled' && ' This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateStatus}
              disabled={isUpdating}
              className={newStatus === 'cancelled' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {assignModalBookingId && (
        <AssignVendorModal
          bookingId={assignModalBookingId}
          bookingType={bookings.find(b => b.id === assignModalBookingId)?.bookingType || 'customer'}
          currentVendorId={bookings.find(b => b.id === assignModalBookingId)?.booking_assignments?.[0]?.vendor_id}
          onClose={() => setAssignModalBookingId(null)}
        />
      )}
    </>
  )
}