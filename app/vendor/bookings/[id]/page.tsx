import { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { requireVendor } from '@/lib/auth/user-actions'
import { getVendorBookingDetail } from '../actions'
import { BookingDetail } from './components/booking-detail'

export const metadata: Metadata = {
  title: 'Booking Details - Vendor',
  description: 'View and manage an assigned booking',
}

interface VendorBookingDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * One assigned booking, keyed on `booking_assignments.id`.
 *
 * A booking id in the slot is answered with a redirect rather than a render: vendor mail sent
 * before this route existed links that way, and a job should have one address.
 */
export default async function VendorBookingDetailPage({
  params,
}: VendorBookingDetailPageProps) {
  const { id } = await params
  await requireVendor()

  const result = await getVendorBookingDetail(id)

  if (result.status === 'redirect') {
    redirect(`/vendor/bookings/${result.assignmentId}`)
  }

  // The fetch scopes by vendor, so a miss means "not yours" or "does not exist". Both are a
  // 404 from the vendor's point of view, and telling the two apart would leak which ids exist.
  if (result.status !== 'ok') {
    notFound()
  }

  const { detail } = result

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendor/bookings" aria-label="Back to assigned bookings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Booking #{detail.tripNumber || detail.bookingNumber}
          </h1>
          {detail.tripNumber && (
            <p className="font-mono text-sm text-muted-foreground">{detail.bookingNumber}</p>
          )}
          <p className="text-muted-foreground">
            Everything you need to accept this job and brief a driver
          </p>
        </div>
      </div>

      <BookingDetail booking={detail} />
    </div>
  )
}
