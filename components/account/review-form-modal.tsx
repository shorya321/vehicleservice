"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Star, MapPin, Calendar, Car, Loader2 } from "lucide-react"
import { createReview, updateReview } from "@/app/account/review-actions"
import { reviewSchema, type ReviewFormData } from "@/app/account/schemas"
import { toast } from "sonner"

interface ReviewFormModalProps {
  review?: {
    id: string
    booking_id: string
    rating: number
    review_text: string | null
  }
  eligibleBookings?: Array<{
    id: string
    booking_number: string
    pickup_address: string
    dropoff_address: string
    pickup_datetime: string
    vehicle_types?: { name: string } | null
  }>
  onClose: () => void
  onSuccess: () => void
}

export function ReviewFormModal({ review, eligibleBookings, onClose, onSuccess }: ReviewFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<string>(review?.booking_id || "")
  const [hoverRating, setHoverRating] = useState(0)
  const isEditing = !!review

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      booking_id: review?.booking_id || "",
      rating: review?.rating || 0,
      title: "",
      content: review?.review_text || "",
    },
  })

  const currentRating = form.watch("rating")
  const selectedBookingData = eligibleBookings?.find((b) => b.id === selectedBooking)

  const handleSelectBooking = (bookingId: string) => {
    setSelectedBooking(bookingId)
    form.setValue("booking_id", bookingId)
  }

  const handleRatingClick = (rating: number) => {
    form.setValue("rating", rating)
  }

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true)

    if (isEditing) {
      const result = await updateReview(review.id, { rating: data.rating, content: data.content })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Review updated successfully")
        onSuccess()
      }
    } else {
      const result = await createReview(data)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Review submitted successfully")
        onSuccess()
      }
    }

    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[var(--black-rich)] border border-[var(--gold)]/20 rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--gold)]/10 flex items-center justify-between">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">
            {isEditing ? "Edit Review" : "Write a Review"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--charcoal)] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6">
          {/* Booking Selection (only for new reviews) */}
          {!isEditing && eligibleBookings && eligibleBookings.length > 0 && (
            <div>
              <label className="form-label">Select Booking</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {eligibleBookings.map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => handleSelectBooking(booking.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedBooking === booking.id
                        ? "border-[var(--gold)] bg-[var(--gold)]/10"
                        : "border-[var(--gold)]/10 hover:border-[var(--gold)]/30 bg-[var(--charcoal)]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono text-[var(--gold)]">#{booking.booking_number}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(booking.pickup_datetime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{booking.pickup_address} → {booking.dropoff_address}</span>
                    </div>
                    {booking.vehicle_types && (
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-1">
                        <Car className="w-3 h-3" />
                        <span>{booking.vehicle_types.name}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {form.formState.errors.booking_id && (
                <p className="mt-1.5 text-sm text-red-400">{form.formState.errors.booking_id.message}</p>
              )}
            </div>
          )}

          {/* Rating */}
          <div>
            <label className="form-label">Your Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRatingClick(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || currentRating)
                        ? "text-[var(--gold)] fill-[var(--gold)]"
                        : "text-[var(--graphite)]"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-[var(--text-muted)]">
                {currentRating > 0 ? `${currentRating} star${currentRating > 1 ? "s" : ""}` : "Select rating"}
              </span>
            </div>
            {form.formState.errors.rating && (
              <p className="mt-1.5 text-sm text-red-400">{form.formState.errors.rating.message}</p>
            )}
          </div>

          {/* Title (only for new reviews) */}
          {!isEditing && (
            <div>
              <label className="form-label">Review Title</label>
              <input
                {...form.register("title")}
                className="luxury-input"
                placeholder="Summarize your experience"
              />
              {form.formState.errors.title && (
                <p className="mt-1.5 text-sm text-red-400">{form.formState.errors.title.message}</p>
              )}
            </div>
          )}

          {/* Content */}
          <div>
            <label className="form-label">Your Review</label>
            <textarea
              {...form.register("content")}
              className="luxury-input min-h-[120px] resize-none"
              placeholder="Share your experience with this transfer service..."
            />
            {form.formState.errors.content && (
              <p className="mt-1.5 text-sm text-red-400">{form.formState.errors.content.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!isEditing && !selectedBooking)}
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditing ? "Updating..." : "Submitting..."}
                </>
              ) : (
                isEditing ? "Update Review" : "Submit Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
