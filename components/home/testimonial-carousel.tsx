"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Star, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"

interface Review {
  id: string
  rating: number
  review_text: string | null
  route_from: string | null
  route_to: string | null
  customer: {
    full_name: string | null
    email: string | null
    avatar_url: string | null
  } | null
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`${rating} out of 5 stars`}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-5 h-5 ${i < rating ? "text-[var(--gold)] fill-[var(--gold)]" : "text-[var(--text-muted)]/30"}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export function TestimonialCarousel({ reviews }: { reviews: Review[] }) {
  const [current, setCurrent] = useState(0)
  const displayReviews = reviews.slice(0, 5)
  const total = displayReviews.length

  const prev = () => setCurrent((c) => (c - 1 + total) % total)
  const next = () => setCurrent((c) => (c + 1) % total)

  if (total === 0) return null

  const review = displayReviews[current]

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="testimonial-featured relative">
        {/* Large decorative quote */}
        <div className="testimonial-quote-mark" aria-hidden="true">
          &quot;
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="relative z-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Stars */}
            <div className="flex justify-center">
              <ReviewStars rating={review.rating} />
            </div>

            {/* Quote */}
            <blockquote className="mt-6 mb-8 text-center">
              <p className="font-display text-2xl lg:text-3xl text-[var(--text-primary)] italic leading-relaxed">
                &quot;{review.review_text || "Exceptional service that exceeded all expectations."}&quot;
              </p>
            </blockquote>

            {/* Author */}
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--charcoal)] border border-[var(--gold)]/20 flex items-center justify-center">
                <span className="font-display text-lg text-[var(--gold)]">
                  {(review.customer?.full_name || review.customer?.email?.charAt(0) || "C").charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-lg text-[var(--text-primary)]">
                    {review.customer?.full_name || review.customer?.email?.split("@")[0] || "Customer"}
                  </h4>
                  <CheckCircle className="w-4 h-4 text-[var(--gold)]" aria-label="Verified Customer" />
                </div>
                {review.route_from && review.route_to && (
                  <p className="text-sm text-[var(--text-muted)]">
                    {review.route_from} → {review.route_to}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation controls */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-6 mt-8">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full border border-[var(--gold)]/20 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--gold)] hover:border-[var(--gold)]/40 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {displayReviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current
                    ? "bg-[var(--gold)] w-6"
                    : "bg-[var(--text-muted)]/30 hover:bg-[var(--text-muted)]/50"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
                aria-current={i === current ? "true" : undefined}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-10 h-10 rounded-full border border-[var(--gold)]/20 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--gold)] hover:border-[var(--gold)]/40 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
