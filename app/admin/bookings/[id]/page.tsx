import { Metadata } from 'next'
import { AdminLayout } from '@/components/layout/admin-layout'
import { getBookingDetails } from '../actions'
import { BookingDetail } from './components/booking-detail'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Booking Details - Admin',
  description: 'View and manage booking details',
}

interface BookingDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params
  
  let booking
  try {
    booking = await getBookingDetails(id)
  } catch (error) {
    console.error('Error fetching booking:', error)
    notFound()
  }

  if (!booking) {
    notFound()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/bookings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Booking #{booking.booking_number}
            </h1>
            <p className="text-muted-foreground">
              View and manage booking details
            </p>
          </div>
        </div>

        {/* Booking Details */}
        <BookingDetail booking={booking} />
      </div>
    </AdminLayout>
  )
}