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
  XCircle,
  Calendar,
  MapPin,
  Car,
  CreditCard,
  Building2,
  User,
  Clock,
  AlertCircle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Booking {
  id: string
  booking_number: string
  pickup_datetime: string
  pickup_address: string
  dropoff_address: string
  total_price: number
  booking_status: string
  payment_status: string
  passenger_count: number
  luggage_count: number
  vehicle_type?: {
    name: string
  }
  booking_assignments?: Array<{
    status: string
    vendor?: {
      business_name: string
    }
    driver?: {
      first_name: string
      last_name: string
    }
  }>
}

interface BookingsTableProps {
  bookings: Booking[]
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  const router = useRouter()
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const getStatusBadge = (status: string) => {
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

  const handleCancelBooking = async () => {
    if (!cancelBookingId) return

    setIsCancelling(true)
    try {
      // TODO: Implement cancel booking API call
      toast.success('Booking cancelled successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to cancel booking')
    } finally {
      setIsCancelling(false)
      setCancelBookingId(null)
    }
  }

  const canCancelBooking = (booking: Booking) => {
    const pickupDate = new Date(booking.pickup_datetime)
    const now = new Date()
    const hoursBefore = (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    return booking.booking_status === 'confirmed' && 
           pickupDate > now && 
           hoursBefore > 24
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Booking #</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Service Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow 
                  key={booking.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    // Don't navigate if clicking on actions
                    if (!(e.target as HTMLElement).closest('.actions-cell')) {
                      router.push(`/customer/bookings/${booking.id}`)
                    }
                  }}
                >
                  <TableCell className="font-medium font-mono text-sm">
                    {booking.booking_number}
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
                    {booking.vehicle_type && (
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        {booking.vehicle_type.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {booking.booking_assignments && booking.booking_assignments.length > 0 ? (
                      <div className="space-y-1 text-sm">
                        {booking.booking_assignments[0].status === 'accepted' && booking.booking_assignments[0].vendor ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              <span className="font-medium">{booking.booking_assignments[0].vendor.business_name}</span>
                            </div>
                            {booking.booking_assignments[0].driver && (
                              <div className="flex items-center gap-1.5 text-muted-foreground ml-3.5">
                                <User className="h-3 w-3" />
                                <span className="text-xs">
                                  {booking.booking_assignments[0].driver.first_name} {booking.booking_assignments[0].driver.last_name}
                                </span>
                              </div>
                            )}
                          </>
                        ) : booking.booking_assignments[0].status === 'pending' ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                            <span className="text-muted-foreground">Pending Assignment</span>
                          </div>
                        ) : booking.booking_assignments[0].status === 'rejected' ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <span className="text-muted-foreground">Rejected</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Processing</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        <span>Not Assigned</span>
                      </div>
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
                  <TableCell className="text-right actions-cell">
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
                          onClick={() => router.push(`/customer/bookings/${booking.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        
                        {booking.payment_status === 'completed' && (
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Download Receipt
                          </DropdownMenuItem>
                        )}
                        
                        {canCancelBooking(booking) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setCancelBookingId(booking.id)
                              }}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Booking
                            </DropdownMenuItem>
                          </>
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

      <AlertDialog open={!!cancelBookingId} onOpenChange={() => setCancelBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
              Cancellation fees may apply based on our cancellation policy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}