import { Tables } from '@/lib/supabase/types'
import { formatDistanceToNow, format } from 'date-fns'

export type Review = Tables<'reviews'>

// Calculate average rating from an array of reviews
export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
  return sum / reviews.length
}

// Get rating distribution from reviews
export function getRatingDistribution(reviews: Review[]): {
  5: number
  4: number
  3: number
  2: number
  1: number
} {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

  reviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      distribution[review.rating as 1 | 2 | 3 | 4 | 5]++
    }
  })

  return distribution
}

// Format review date as relative time or absolute
export function formatReviewDate(date: string | Date, relative = true): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (relative) {
    return formatDistanceToNow(dateObj, { addSuffix: true })
  }

  return format(dateObj, 'MMM d, yyyy')
}

// Truncate review text with ellipsis
export function truncateReviewText(text: string, maxLength: number = 300): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// Check if user can review a booking
export function canReviewBooking(
  booking: { booking_status: string; customer_id: string | null },
  userId: string
): { can: boolean; reason?: string } {
  if (booking.customer_id !== userId) {
    return { can: false, reason: 'You can only review your own bookings' }
  }

  if (booking.booking_status !== 'completed') {
    return { can: false, reason: 'Booking must be completed to leave a review' }
  }

  return { can: true }
}

// Get display status for review
export function getReviewStatusDisplay(status: string): {
  label: string
  color: 'yellow' | 'green' | 'red'
} {
  switch (status) {
    case 'pending':
      return { label: 'Pending Approval', color: 'yellow' }
    case 'approved':
      return { label: 'Published', color: 'green' }
    case 'rejected':
      return { label: 'Rejected', color: 'red' }
    default:
      return { label: status, color: 'yellow' }
  }
}

// Sort reviews by different criteria
export function sortReviews<T extends Review>(
  reviews: T[],
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest'
): T[] {
  const sorted = [...reviews]

  switch (sortBy) {
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    case 'oldest':
      return sorted.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    case 'highest':
      return sorted.sort((a, b) => b.rating - a.rating)
    case 'lowest':
      return sorted.sort((a, b) => a.rating - b.rating)
    default:
      return sorted
  }
}

// Filter reviews by rating
export function filterReviewsByRating<T extends Review>(
  reviews: T[],
  minRating: number
): T[] {
  return reviews.filter((review) => review.rating >= minRating)
}

// Get customer initials from name or email
export function getCustomerInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return email.slice(0, 2).toUpperCase()
}

// Validate and sanitize review text
export function sanitizeReviewText(text: string): string {
  // Remove excessive whitespace
  let sanitized = text.replace(/\s+/g, ' ').trim()

  // Remove potentially harmful HTML/script tags
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  return sanitized
}

// Check if review has photos
export function hasPhotos(review: Review): boolean {
  return !!review.photos && review.photos.length > 0
}

// Get review summary statistics
export function getReviewSummary(reviews: Review[]): {
  total: number
  average: number
  distribution: { 5: number; 4: number; 3: number; 2: number; 1: number }
  withText: number
  withPhotos: number
} {
  return {
    total: reviews.length,
    average: calculateAverageRating(reviews),
    distribution: getRatingDistribution(reviews),
    withText: reviews.filter((r) => r.review_text && r.review_text.length > 0).length,
    withPhotos: reviews.filter(hasPhotos).length,
  }
}
