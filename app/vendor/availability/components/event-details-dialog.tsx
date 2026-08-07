'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import {
  AlertCircle,
  Car,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Hash,
  MapPin,
  Phone,
  User,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { toBookingTz } from '@/lib/utils/timezone'
import {
  bookingDetailsOf,
  isPastEvent,
  unavailabilityDetailsOf,
  type CalendarEvent,
} from '../types'

interface EventDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent | null
  onRemoveUnavailability: () => void
}

const SOURCE_LABELS: Record<CalendarEvent['source'], string> = {
  online: 'Online booking',
  offline: 'Offline booking',
  blocked: 'Blocked',
}

/**
 * Always Asia/Dubai, never the browser's timezone.
 *
 * Pickup times are Dubai wall-clock everywhere else in the product, and the fleet
 * timeline positions its bars against a Dubai-anchored window. Formatting a raw
 * Date here would render browser-local, so a vendor outside the UAE would read one
 * time on the bar and a different one in this dialog for the same trip.
 */
function formatBookingTime(date: Date, pattern = 'MMM dd, yyyy HH:mm'): string {
  return format(toBookingTz(date.toISOString()), pattern)
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm font-medium">{label}:</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

export function EventDetailsDialog({
  open,
  onOpenChange,
  event,
  onRemoveUnavailability,
}: EventDetailsDialogProps) {
  const booking = event ? bookingDetailsOf(event) : null
  const blocked = event ? unavailabilityDetailsOf(event) : null

  // A pending offer has no vehicle or driver yet and its end time is a default,
  // not a decision. Saying so is the whole point of showing it here.
  const isPendingOffer = event?.source === 'online' && event.status === 'pending'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {event?.type === 'booking' ? 'Booking Details' : 'Unavailability Details'}
            {event && (
              <Badge variant="outline" className="font-normal">
                {SOURCE_LABELS[event.source]}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {event && (
          <div className="space-y-4">
            {booking ? (
              <div className="space-y-2">
                {booking.reference && (
                  <Row icon={Hash} label="Reference">
                    {booking.reference}
                  </Row>
                )}

                {!booking.reference && (
                  <Row icon={CalendarIcon} label="Trip #">
                    {booking.tripNumber || booking.bookingNumber}
                  </Row>
                )}

                {booking.status && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant="secondary" className="capitalize">
                      {String(booking.status).replace(/_/g, ' ')}
                    </Badge>
                  </div>
                )}

                <Row icon={User} label="Customer">
                  {booking.customer}
                </Row>
                <Row icon={Phone} label="Phone">
                  {booking.phone}
                </Row>
                <Row icon={Clock} label="Time">
                  {formatBookingTime(event.start)} - {formatBookingTime(event.end, 'HH:mm')}
                  <span className="ml-1 text-muted-foreground">(Dubai time)</span>
                </Row>

                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <div>
                      <span className="font-medium">Pickup:</span> {booking.pickup}
                    </div>
                    <div>
                      <span className="font-medium">Dropoff:</span> {booking.dropoff}
                    </div>
                  </div>
                </div>

                {typeof booking.totalPrice === 'number' && (
                  <Row icon={Hash} label="Total">
                    {formatCurrency(booking.totalPrice, booking.currency ?? 'AED')}
                  </Row>
                )}

                {isPendingOffer && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    Awaiting your response. No vehicle or driver is reserved yet, and
                    the end time shown is the default hold length, not a confirmed
                    duration.
                  </div>
                )}

                {!event.occupies && !isPendingOffer && !isPastEvent(event) && (
                  <div className="rounded-md border border-muted bg-muted/50 p-3 text-sm text-muted-foreground">
                    This booking no longer holds its vehicle or driver. Both are free
                    for this period.
                  </div>
                )}

                {booking.vehicle && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Vehicle:</span>
                    </div>
                    <div className="text-sm ml-6">
                      <div>
                        {booking.vehicle.make} {booking.vehicle.model}
                      </div>
                      <div className="text-muted-foreground">
                        Reg: {booking.vehicle.registrationNumber}
                      </div>
                    </div>
                  </div>
                )}

                {booking.driver && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Driver:</span>
                    </div>
                    <div className="text-sm ml-6">
                      <div>
                        {booking.driver.firstName} {booking.driver.lastName}
                      </div>
                      {booking.driver.phone && (
                        <div className="text-muted-foreground">
                          Phone: {booking.driver.phone}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {booking.notes && (
                  <div className="pt-2 border-t space-y-1">
                    <span className="text-sm font-medium">Notes:</span>
                    <p className="text-sm text-muted-foreground">{booking.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              blocked && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">Reason:</span>
                    <Badge variant="destructive">{blocked.reason}</Badge>
                  </div>
                  <Row icon={Clock} label="Period">
                    {formatBookingTime(event.start)} - {formatBookingTime(event.end)}
                    <span className="ml-1 text-muted-foreground">(Dubai time)</span>
                  </Row>
                  {blocked.notes && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Notes:</span>
                      <p className="text-sm text-muted-foreground">{blocked.notes}</p>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}

        <DialogFooter>
          {event?.href && (
            <Button variant="outline" size="sm" asChild>
              <Link href={event.href}>
                Open booking
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          {event?.type === 'unavailable' && !isPastEvent(event) && (
            <Button variant="destructive" size="sm" onClick={onRemoveUnavailability}>
              Remove Unavailability
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
