'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CustomerLayout } from '@/components/layout/customer-layout'
import { AnimatedPage } from '@/components/layout/animated-page'
import { AnimatedCard } from '@/components/ui/animated-card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ReviewForm } from '@/components/reviews/review-form'
import { createReview } from '../actions'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface BookingDetails {
  routeFrom: string
  routeTo: string
  date: string
  vehicleClass: string
}

function ReviewSubmissionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBookingData() {
      if (!bookingId) {
        router.push('/customer/reviews')
        return
      }

      const supabase = createClient()

      // Get authenticated user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login?redirect=/customer/reviews/create?bookingId=' + bookingId)
        return
      }

      setUser(currentUser)

      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(
          `
          id,
          booking_number,
          pickup_address,
          dropoff_address,
          pickup_datetime,
          booking_status,
          customer_id,
          vehicle_type_id,
          vehicle_types(name)
        `
        )
        .eq('id', bookingId)
        .single()

      if (bookingError || !booking) {
        router.push('/customer/reviews')
        return
      }

      // Verify booking belongs to user
      if (booking.customer_id !== currentUser.id) {
        router.push('/customer/reviews')
        return
      }

      // Check if booking is completed
      if (booking.booking_status !== 'completed') {
        router.push('/customer/reviews')
        return
      }

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .single()

      if (existingReview) {
        router.push('/customer/reviews')
        return
      }

      // Set booking details
      setBookingDetails({
        routeFrom: booking.pickup_address,
        routeTo: booking.dropoff_address,
        date: format(new Date(booking.pickup_datetime), 'MMM d, yyyy'),
        vehicleClass: booking.vehicle_types?.name || 'Unknown',
      })

      setLoading(false)
    }

    loadBookingData()
  }, [bookingId, router])

  const handleSubmit = async (formData: any) => {
    const result = await createReview(formData)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Review submitted successfully! Thank you for your feedback.')
    router.push('/customer/reviews')
  }

  const handleCancel = () => {
    router.push('/customer/reviews')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-luxury-gold animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error || !bookingDetails || !bookingId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Unable to load booking details</p>
          <button
            onClick={() => router.push('/customer/reviews')}
            className="text-luxury-gold hover:underline"
          >
            Return to Reviews
          </button>
        </div>
      </div>
    )
  }

  return (
    <CustomerLayout user={user}>
      <AnimatedPage>
        <Breadcrumb
          items={[
            { label: 'My Reviews', href: '/customer/reviews' },
            { label: 'Write Review', href: '/customer/reviews/create' },
          ]}
        />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Write Review
          </h1>
          <p className="text-muted-foreground">
            Share your experience and help other travelers
          </p>
        </div>

        {/* Form */}
        <AnimatedCard delay={0.1}>
          <ReviewForm
            bookingId={bookingId}
            bookingDetails={bookingDetails}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </AnimatedCard>
      </AnimatedPage>
    </CustomerLayout>
  )
}

export default function ReviewSubmissionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-luxury-gold animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <ReviewSubmissionContent />
    </Suspense>
  )
}
