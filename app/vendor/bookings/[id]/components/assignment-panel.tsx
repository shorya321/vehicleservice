'use client'

import { format } from 'date-fns'
import { Car, CheckCircle, Clock, Phone, UserCheck, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toBookingTz } from '@/lib/utils/timezone'
import type { VendorBookingDetail } from '@/lib/vendor/bookings/types'

const STATUS_STYLES: Record<string, { wrap: string; text: string; icon: typeof CheckCircle }> = {
  completed: {
    wrap: 'bg-sky-500/10 border-sky-500/30',
    text: 'text-sky-500',
    icon: CheckCircle,
  },
  accepted: {
    wrap: 'bg-emerald-500/10 border-emerald-500/30',
    text: 'text-emerald-500',
    icon: CheckCircle,
  },
  pending: {
    wrap: 'bg-amber-500/10 border-amber-500/30',
    text: 'text-amber-500',
    icon: Clock,
  },
  rejected: {
    wrap: 'bg-destructive/10 border-destructive/30',
    text: 'text-destructive',
    icon: XCircle,
  },
  cancelled: {
    wrap: 'bg-destructive/10 border-destructive/30',
    text: 'text-destructive',
    icon: XCircle,
  },
}

function stamp(iso: string): string {
  return format(toBookingTz(iso), 'PPp')
}

interface AssignmentPanelProps {
  booking: VendorBookingDetail
}

/**
 * The vendor's own side of the job: what they committed, when, and for how long.
 *
 * The hold window comes from `resource_schedules`, which is what actually makes a vehicle and
 * driver read as busy for other bookings. Showing it next to the duration is what makes the
 * Change Duration action legible.
 */
export function AssignmentPanel({ booking }: AssignmentPanelProps) {
  const style = STATUS_STYLES[booking.assignmentStatus] || STATUS_STYLES.pending
  const StatusIcon = style.icon
  const label =
    booking.assignmentStatus.charAt(0).toUpperCase() + booking.assignmentStatus.slice(1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`rounded-lg border p-3 ${style.wrap}`}>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${style.text}`} />
            <span className={`font-semibold ${style.text}`}>Assignment {label}</span>
          </div>
        </div>

        {booking.driver || booking.vehicle ? (
          <div className="space-y-3">
            {booking.driver && (
              <div className="flex items-start gap-2 text-sm">
                <UserCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-medium">
                    {booking.driver.firstName} {booking.driver.lastName}
                  </p>
                  <a
                    href={`tel:${booking.driver.phone}`}
                    className="flex items-center gap-1 text-muted-foreground hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {booking.driver.phone}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    License {booking.driver.licenseNumber}
                  </p>
                </div>
              </div>
            )}

            {booking.vehicle && (
              <div className="flex items-start gap-2 text-sm">
                <Car className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-medium">
                    {booking.vehicle.make} {booking.vehicle.model} ({booking.vehicle.year})
                  </p>
                  <p className="text-muted-foreground">
                    Reg {booking.vehicle.registrationNumber}
                  </p>
                  {booking.vehicle.seats != null && (
                    <p className="text-xs text-muted-foreground">
                      {booking.vehicle.seats} seats
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No driver or vehicle allocated yet.
          </p>
        )}

        {booking.hold && (
          <>
            <Separator />
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">Vehicle and driver held</p>
              <p className="font-medium">
                {format(toBookingTz(booking.hold.startDatetime), 'd MMM, HH:mm')} to{' '}
                {format(toBookingTz(booking.hold.endDatetime), 'd MMM, HH:mm')}
              </p>
              {booking.estimatedDurationHours != null && (
                <p className="text-xs text-muted-foreground">
                  {booking.estimatedDurationHours} hour
                  {booking.estimatedDurationHours === 1 ? '' : 's'} estimated
                </p>
              )}
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>Assigned {stamp(booking.assignedAt)}</span>
          </div>
          {booking.acceptedAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>Accepted {stamp(booking.acceptedAt)}</span>
            </div>
          )}
          {booking.completedAt && (
            <div className="flex items-center gap-2 text-emerald-500">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Completed {stamp(booking.completedAt)}</span>
            </div>
          )}
          {booking.rejectedAt && (
            <div className="flex items-start gap-2 text-destructive">
              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">Rejected {stamp(booking.rejectedAt)}</p>
                {booking.rejectionReason && (
                  <p className="text-xs">Reason: {booking.rejectionReason}</p>
                )}
              </div>
            </div>
          )}
          {booking.cancelledAt && (
            <div className="flex items-start gap-2 text-destructive">
              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">Cancelled {stamp(booking.cancelledAt)}</p>
                {booking.cancellationReason && (
                  <p className="text-xs">Reason: {booking.cancellationReason}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {booking.assignmentNotes && (
          <>
            <Separator />
            <div className="rounded-lg bg-muted p-3">
              <p className="mb-1 text-sm font-medium">Notes from admin</p>
              <p className="text-sm text-muted-foreground">{booking.assignmentNotes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
