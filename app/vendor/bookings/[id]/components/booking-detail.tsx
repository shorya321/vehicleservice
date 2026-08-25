'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Calendar,
  Car,
  CheckCircle,
  Clock,
  History,
  Luggage,
  Mail,
  MapPin,
  Phone,
  Users,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { toBookingTz } from '@/lib/utils/timezone'
import type { VendorBookingDetail } from '@/lib/vendor/bookings/types'
import { completeBooking } from '../../actions'
import { AssignResourcesModal } from '../../components/assign-resources-modal'
import { ChangeDurationModal } from '../../components/change-duration-modal'
import { RejectAssignmentModal } from '../../components/reject-assignment-modal'
import { AssignmentPanel } from './assignment-panel'
import { ServiceRequirements } from './service-requirements'

interface BookingDetailProps {
  booking: VendorBookingDetail
}

const BOOKING_STATUS_VARIANTS: Record<
  string,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }
> = {
  confirmed: { variant: 'default', icon: CheckCircle },
  completed: { variant: 'secondary', icon: CheckCircle },
  cancelled: { variant: 'destructive', icon: XCircle },
  pending: { variant: 'outline', icon: Clock },
}

function statusBadge(status: string) {
  const config = BOOKING_STATUS_VARIANTS[status] || BOOKING_STATUS_VARIANTS.pending
  const Icon = config.icon
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

/**
 * One assigned booking, in full.
 *
 * Mirrors the admin detail page's structure (three column grid, cards, shared badge and
 * timezone helpers) because the vendor portal renders with the admin design system. It
 * diverges in two places on purpose: add-ons are lifted out of the price list into their own
 * operational card, and the named pickup and dropoff locations are shown alongside the raw
 * addresses.
 */
export function BookingDetail({ booking }: BookingDetailProps) {
  const router = useRouter()
  const [showAssign, setShowAssign] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [showDuration, setShowDuration] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  const reference = booking.tripNumber || booking.bookingNumber
  const isPending = booking.assignmentStatus === 'pending'
  const isAccepted = booking.assignmentStatus === 'accepted'
  const hasResources = !!booking.driver && !!booking.vehicle

  const handleComplete = async () => {
    try {
      setIsCompleting(true)
      await completeBooking(booking.assignmentId)
      toast.success(`Booking ${reference} marked as completed.`)
      router.refresh()
    } catch (error) {
      console.error('Error completing booking:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to complete booking')
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Trip overview */}
          <Card>
            <CardHeader>
              <CardTitle>Trip Overview</CardTitle>
              <CardDescription>Reference numbers, status and departure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Trip Number</p>
                  <p className="font-mono text-lg font-semibold">{reference}</p>
                  {booking.tripNumber && (
                    <p className="font-mono text-xs text-muted-foreground">
                      {booking.bookingNumber}
                    </p>
                  )}
                  {booking.referenceNumber && (
                    <p className="text-xs text-muted-foreground">
                      Client reference: {booking.referenceNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-sm text-muted-foreground">Booking Status</p>
                  {statusBadge(booking.bookingStatus)}
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Pickup Date and Time</p>
                    <p className="font-medium">
                      {format(toBookingTz(booking.pickupDatetime), 'PPP')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(toBookingTz(booking.pickupDatetime), 'p')}
                    </p>
                    {/* Still awaiting this vendor with departure already behind us. The assign
                        dialog judges availability against that historic window, so resources
                        can read as unavailable over a trip that is long finished. Unmarked,
                        that looks like a bug. */}
                    {booking.pickupHasPassed && (
                      <Badge variant="outline" className="mt-1 text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        Past pickup
                      </Badge>
                    )}
                  </div>
                </div>

                {booking.clientName && (
                  <div className="flex items-start gap-3">
                    <UserCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Booked By</p>
                      <p className="font-medium">{booking.clientName}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Journey */}
          <Card>
            <CardHeader>
              <CardTitle>Journey</CardTitle>
              <CardDescription>Where the driver collects and drops off</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm text-muted-foreground">Pickup</p>
                  {booking.fromLocationName && (
                    <p className="font-medium">{booking.fromLocationName}</p>
                  )}
                  {/* A saved location often carries its own name as the address. Printing both
                      just renders the same line twice. */}
                  {booking.pickupAddress !== booking.fromLocationName && (
                    <p
                      className={
                        booking.fromLocationName ? 'text-sm text-muted-foreground' : 'font-medium'
                      }
                    >
                      {booking.pickupAddress || 'No address recorded'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm text-muted-foreground">Dropoff</p>
                  {booking.toLocationName && (
                    <p className="font-medium">{booking.toLocationName}</p>
                  )}
                  {booking.dropoffAddress !== booking.toLocationName && (
                    <p
                      className={
                        booking.toLocationName ? 'text-sm text-muted-foreground' : 'font-medium'
                      }
                    >
                      {booking.dropoffAddress || 'No address recorded'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passengers and load */}
          <Card>
            <CardHeader>
              <CardTitle>Passengers and Load</CardTitle>
              <CardDescription>Who is travelling and the vehicle class booked</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Adults</p>
                  <p className="text-2xl font-bold">{booking.adults}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Children</p>
                  <p
                    className={`text-2xl font-bold ${
                      booking.children > 0 ? 'text-amber-500' : ''
                    }`}
                  >
                    {booking.children}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Infants</p>
                  <p
                    className={`text-2xl font-bold ${
                      booking.infants > 0 ? 'text-amber-500' : ''
                    }`}
                  >
                    {booking.infants}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{booking.passengerCount}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <Car className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="font-semibold">{booking.vehicleTypeName || 'N/A'}</p>
                    {booking.vehicleTypeCategory && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {booking.vehicleTypeCategory}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {booking.vehicleTypePassengerCapacity != null && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Up to {booking.vehicleTypePassengerCapacity} passengers
                      </span>
                    )}
                    {booking.vehicleTypeLuggageCapacity != null && (
                      <span className="flex items-center gap-1">
                        <Luggage className="h-3 w-3" />
                        {booking.vehicleTypeLuggageCapacity} luggage
                      </span>
                    )}
                    {booking.luggageCount != null && booking.luggageCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Luggage className="h-3 w-3" />
                        {booking.luggageCount} bags booked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <ServiceRequirements addons={booking.addons} />

          {booking.customerNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{booking.customerNotes}</p>
              </CardContent>
            </Card>
          )}

          {booking.reschedules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pickup Time Changes</CardTitle>
                <CardDescription>
                  This trip has been rescheduled since it was booked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booking.reschedules.map((change) => (
                    <div key={change.id} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <History className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground line-through">
                          {format(toBookingTz(change.previousDatetime), 'd MMM yyyy, HH:mm')}
                        </span>
                        <span className="font-medium">
                          {format(toBookingTz(change.newDatetime), 'd MMM yyyy, HH:mm')}
                        </span>
                      </div>
                      {change.reason && (
                        <p className="mt-1 pl-6 text-xs text-muted-foreground">
                          Reason: {change.reason}
                        </p>
                      )}
                      <p className="mt-1 pl-6 text-xs text-muted-foreground">
                        Changed {format(toBookingTz(change.createdAt), 'PPp')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {booking.passengers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Passenger Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {booking.passengers.map((passenger) => (
                    <div key={passenger.id} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {passenger.firstName} {passenger.lastName}
                        </p>
                        {passenger.isPrimary && (
                          <Badge variant="secondary" className="text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>
                      {passenger.email && (
                        <a
                          href={`mailto:${passenger.email}`}
                          className="mt-1 flex items-center gap-1 text-sm text-muted-foreground hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          {passenger.email}
                        </a>
                      )}
                      {passenger.phone && (
                        <a
                          href={`tel:${passenger.phone}`}
                          className="mt-1 flex items-center gap-1 text-sm text-muted-foreground hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {passenger.phone}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AssignmentPanel booking={booking} />

          <Card>
            <CardHeader>
              <CardTitle>Passenger Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium">{booking.customerName}</p>
              {booking.customerPhone && (
                <a
                  href={`tel:${booking.customerPhone}`}
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {booking.customerPhone}
                </a>
              )}
              {booking.customerEmail && (
                <a
                  href={`mailto:${booking.customerEmail}`}
                  className="flex items-center gap-2 break-all text-sm hover:underline"
                >
                  <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  {booking.customerEmail}
                </a>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Booking Value</span>
                <span className="text-lg font-bold">{formatCurrency(booking.totalPrice)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isPending && (
                <>
                  <Button className="w-full" onClick={() => setShowAssign(true)}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Accept and Assign
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-destructive"
                    onClick={() => setShowReject(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Assignment
                  </Button>
                </>
              )}

              {isAccepted && (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowAssign(true)}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    {hasResources ? 'Change Assignment' : 'Assign Resources'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowDuration(true)}
                    disabled={!hasResources}
                    title={
                      hasResources
                        ? undefined
                        : 'Allocate a driver and vehicle before setting how long they are held'
                    }
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Change Duration
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleComplete}
                    disabled={isCompleting || !hasResources}
                    title={
                      hasResources
                        ? undefined
                        : 'Allocate a driver and vehicle before completing this trip'
                    }
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Completed
                  </Button>
                </>
              )}

              {!isPending && !isAccepted && (
                <p className="text-sm text-muted-foreground">
                  This assignment is {booking.assignmentStatus}. No further action is available.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showAssign && (
        <AssignResourcesModal
          assignmentId={booking.assignmentId}
          bookingNumber={reference}
          onClose={() => setShowAssign(false)}
        />
      )}

      {showReject && (
        <RejectAssignmentModal
          assignmentId={booking.assignmentId}
          bookingNumber={reference}
          onClose={() => setShowReject(false)}
        />
      )}

      {showDuration && (
        <ChangeDurationModal
          assignmentId={booking.assignmentId}
          bookingNumber={reference}
          pickupDatetime={booking.pickupDatetime}
          currentHours={booking.estimatedDurationHours}
          onClose={() => setShowDuration(false)}
        />
      )}
    </>
  )
}
