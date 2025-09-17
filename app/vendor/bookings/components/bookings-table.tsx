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
  MoreHorizontal, 
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Car,
  User,
  Phone,
  UserCheck
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { VendorBooking } from '../actions'
import { AssignResourcesModal } from './assign-resources-modal'

interface BookingsTableProps {
  bookings: VendorBooking[]
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  const router = useRouter()
  const [assignModalData, setAssignModalData] = useState<{
    assignmentId: string
    bookingNumber: string
  } | null>(null)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      accepted: 'default',
      completed: 'secondary',
      rejected: 'destructive',
      pending: 'outline',
    }
    
    const icons: Record<string, React.ReactNode> = {
      accepted: <CheckCircle className="h-3 w-3 mr-1" />,
      completed: <CheckCircle className="h-3 w-3 mr-1" />,
      rejected: <XCircle className="h-3 w-3 mr-1" />,
      pending: <Calendar className="h-3 w-3 mr-1" />,
    }
    
    return (
      <Badge variant={variants[status] || 'outline'} className="text-xs">
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Booking #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Pickup Date/Time</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Vehicle Type</TableHead>
              <TableHead>Assignment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No bookings assigned yet
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-mono text-sm">
                    {assignment.booking?.booking_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {assignment.booking?.booking_passengers && assignment.booking.booking_passengers.length > 0 ? (
                        (() => {
                          const primaryPassenger = assignment.booking.booking_passengers.find(p => p.is_primary) || assignment.booking.booking_passengers[0]
                          return (
                            <>
                              <div className="font-medium">
                                {primaryPassenger.first_name} {primaryPassenger.last_name}
                              </div>
                              <div className="text-muted-foreground">
                                {primaryPassenger.email || 'No email'}
                              </div>
                              {primaryPassenger.phone && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {primaryPassenger.phone}
                                </div>
                              )}
                            </>
                          )
                        })()
                      ) : (
                        <div className="text-muted-foreground">No passenger info</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {assignment.booking?.pickup_datetime ? format(new Date(assignment.booking.pickup_datetime), 'MMM dd, yyyy') : 'N/A'}
                        </div>
                        <div className="text-muted-foreground">
                          {assignment.booking?.pickup_datetime ? format(new Date(assignment.booking.pickup_datetime), 'HH:mm') : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm max-w-xs">
                      <div className="flex items-start gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="truncate">{assignment.booking?.pickup_address || 'N/A'}</span>
                      </div>
                      <div className="flex items-start gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="truncate">{assignment.booking?.dropoff_address || 'N/A'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      {assignment.booking?.vehicle_type?.name || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {assignment.driver && assignment.vehicle ? (
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {assignment.driver.first_name} {assignment.driver.last_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Car className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {assignment.vehicle.make} {assignment.vehicle.model}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Not assigned
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(assignment.status)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {assignment.booking?.total_price ? formatCurrency(assignment.booking.total_price) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
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
                        
                        {assignment.status === 'pending' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setAssignModalData({
                                assignmentId: assignment.id,
                                bookingNumber: assignment.booking?.booking_number || 'N/A'
                              })}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Accept & Assign
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                // TODO: Implement reject functionality
                                toast.error('Reject functionality coming soon')
                              }}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject Assignment
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {assignment.status === 'accepted' && !assignment.driver && (
                          <DropdownMenuItem
                            onClick={() => setAssignModalData({
                              assignmentId: assignment.id,
                              bookingNumber: assignment.booking.booking_number
                            })}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Assign Resources
                          </DropdownMenuItem>
                        )}
                        
                        {assignment.status === 'accepted' && assignment.driver && (
                          <DropdownMenuItem
                            onClick={() => setAssignModalData({
                              assignmentId: assignment.id,
                              bookingNumber: assignment.booking.booking_number
                            })}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Change Assignment
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

      {assignModalData && (
        <AssignResourcesModal
          assignmentId={assignModalData.assignmentId}
          bookingNumber={assignModalData.bookingNumber}
          onClose={() => setAssignModalData(null)}
        />
      )}
    </>
  )
}