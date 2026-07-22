import { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { requireVendor } from '@/lib/auth/user-actions'
import { createClient } from '@/lib/supabase/server'
import { toBookingTz } from '@/lib/utils/timezone'
import type {
  DirectBookingFormValues,
  DirectBookingPaymentMethod,
  DirectBookingPaymentStatus,
  DirectBookingStatus,
} from '@/lib/vendor/direct-bookings/schema'
import { getDirectBooking, getVendorFleetOptions } from '../../actions'
import { DirectBookingForm } from '../../components/direct-booking-form'

export const metadata: Metadata = {
  title: 'Edit Direct Booking - Vendor Portal',
  description: 'Update a direct booking',
}

interface EditDirectBookingPageProps {
  params: Promise<{ id: string }>
}

/** Splits a stored UTC instant back into the Dubai date and time the form edits. */
function splitDateTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  const zoned = toBookingTz(iso)
  return { date: format(zoned, 'yyyy-MM-dd'), time: format(zoned, 'HH:mm') }
}

export default async function EditDirectBookingPage({
  params,
}: EditDirectBookingPageProps) {
  const { id } = await params

  const user = await requireVendor()
  const supabase = await createClient()

  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!vendorApplication || vendorApplication.status !== 'approved') {
    redirect('/vendor/profile')
  }

  const [{ data: booking }, fleet] = await Promise.all([
    getDirectBooking(id),
    getVendorFleetOptions(vendorApplication.id),
  ])

  // getDirectBooking already scopes by vendor, so a miss means "not yours" or
  // "does not exist" — both are a 404 from the vendor's point of view.
  if (!booking) {
    notFound()
  }

  const pickup = splitDateTime(booking.pickup_datetime)
  const returned = splitDateTime(booking.return_datetime)

  const defaultValues: Partial<DirectBookingFormValues> = {
    customer_name: booking.customer_name,
    customer_phone: booking.customer_phone,
    customer_email: booking.customer_email ?? '',
    customer_notes: booking.customer_notes ?? '',
    vehicle_id: booking.vehicle_id,
    driver_id: booking.driver_id ?? '',
    pickup_date: pickup.date,
    pickup_time: pickup.time,
    return_date: returned.date,
    return_time: returned.time,
    pickup_location: booking.pickup_location,
    dropoff_location: booking.dropoff_location ?? '',
    total_price: Number(booking.total_price),
    amount_paid: Number(booking.amount_paid),
    payment_status: booking.payment_status as DirectBookingPaymentStatus,
    payment_method: (booking.payment_method ?? '') as DirectBookingPaymentMethod | '',
    booking_status: booking.booking_status as DirectBookingStatus,
    cancellation_reason: booking.cancellation_reason ?? '',
    internal_notes: booking.internal_notes ?? '',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendor/direct-bookings">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to direct bookings</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Direct Booking</h1>
          <p className="text-muted-foreground font-mono text-sm">
            {booking.reference_number}
          </p>
        </div>
      </div>

      <DirectBookingForm
        fleet={fleet}
        mode="edit"
        bookingId={booking.id}
        defaultValues={defaultValues}
      />
    </div>
  )
}
