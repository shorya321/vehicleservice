'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CustomerLayout } from '@/components/layout/customer-layout'
import { AnimatedPage } from '@/components/layout/animated-page'
import { AnimatedCard } from '@/components/ui/animated-card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ReviewForm } from '@/components/reviews/review-form'
import { updateReview, getReviewById } from '../../actions'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ReviewFormData } from '@/lib/reviews/validation'

interface BookingDetails {
  routeFrom: string
  routeTo: string
  date: string
  vehicleClass: string
}

interface InitialData {
  rating: number
  reviewText: string
  photos: string[]
}

function EditReviewContent() {
  const router = useRouter()
  const params = useParams()
  const reviewId = params.id as string

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [bookingId, setBookingId] = useState<string>('')
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [initialData, setInitialData] = useState<InitialData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadReviewData() {
      if (!reviewId) {
        router.push('/customer/reviews')
        return
      }

      const supabase = createClient()

      // Get authenticated user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login?redirect=/customer/reviews/' + reviewId + '/edit')
        return
      }

      setUser(currentUser)

      // Get review details
      const { data: review, error: reviewError } = await getReviewById(reviewId)

      if (reviewError || !review) {
        toast.error('Review not found')
        router.push('/customer/reviews')
        return
      }

      // Verify review belongs to user
      if (review.customer_id !== currentUser.id) {
        toast.error('Unauthorized')
        router.push('/customer/reviews')
        return
      }

      // Only allow editing pending reviews
      if (review.status !== 'pending') {
        toast.error('Only pending reviews can be edited')
        router.push(`/customer/reviews/${reviewId}`)
        return
      }

      // Set booking details
      setBookingId(review.booking_id)
      setBookingDetails({
        routeFrom: review.route_from || '',
        routeTo: review.route_to || '',
        date: review.booking
          ? format(new Date(review.booking.pickup_datetime), 'MMMM d, yyyy')
          : '',
        vehicleClass: review.vehicle_class || '',
      })

      // Set initial form data
      setInitialData({
        rating: review.rating,
        reviewText: review.review_text || '',
        photos: review.photos || [],
      })

      setLoading(false)
    }

    loadReviewData()
  }, [reviewId, router])

  const handleSubmit = async (formData: ReviewFormData) => {
    const result = await updateReview(reviewId, {
      rating: formData.rating,
      reviewText: formData.reviewText,
      photos: formData.photos,
    })

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Review updated successfully!')
    router.push('/customer/reviews')
  }

  const handleCancel = () => {
    router.push(`/customer/reviews/${reviewId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-luxury-gold animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading review...</p>
        </div>
      </div>
    )
  }

  if (error || !bookingDetails || !initialData || !bookingId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Unable to load review</p>
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
            { label: 'Review Details', href: `/customer/reviews/${reviewId}` },
            { label: 'Edit', href: `/customer/reviews/${reviewId}/edit` },
          ]}
        />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Review
          </h1>
          <p className="text-muted-foreground">
            Update your review and feedback
          </p>
        </div>

        {/* Form */}
        <AnimatedCard delay={0.1}>
          <ReviewForm
            bookingId={bookingId}
            bookingDetails={bookingDetails}
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </AnimatedCard>
      </AnimatedPage>
    </CustomerLayout>
  )
}

export default function EditReviewPage() {
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
      <EditReviewContent />
    </Suspense>
  )
}
