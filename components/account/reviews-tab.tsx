"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, MessageSquare, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { getMyReviews, getReviewStats, getEligibleBookings, deleteReview, type ReviewFilters } from "@/app/account/review-actions"
import { ReviewCard } from "./review-card"
import { ReviewFormModal } from "./review-form-modal"
import { toast } from "sonner"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { ContentSection } from "./content-section"
import { InlineStats } from "./inline-stats"
import { ListSkeleton } from "./list-skeleton"
import { EmptyState } from "./empty-state"
import type { ReviewListItem, EligibleBooking } from "./types"

interface ReviewsTabProps {
  userId: string
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
]

const RATING_OPTIONS = [
  { value: "all", label: "All Ratings" },
  { value: "5", label: "5 Stars" },
  { value: "4-5", label: "4-5 Stars" },
  { value: "1-3", label: "1-3 Stars" },
]

export function ReviewsTab({ userId }: ReviewsTabProps) {
  const [reviews, setReviews] = useState<ReviewListItem[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, averageRating: 0 })
  const [eligibleBookings, setEligibleBookings] = useState<EligibleBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingReview, setEditingReview] = useState<ReviewListItem | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [filters, setFilters] = useState<ReviewFilters>({
    search: "",
    sortBy: "newest",
    status: "all",
    ratingRange: "all",
    page: 1,
    limit: 20,
  })
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, page: 1 })
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch, page: 1 }))
  }, [debouncedSearch])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const [reviewsResult, statsResult, eligibleResult] = await Promise.all([
      getMyReviews(filters),
      getReviewStats(),
      getEligibleBookings(),
    ])
    setReviews((reviewsResult.data || []) as ReviewListItem[])
    setPagination({
      total: reviewsResult.total,
      totalPages: reviewsResult.totalPages,
      page: reviewsResult.page || 1,
    })
    if (statsResult.data) setStats(statsResult.data)
    if (eligibleResult.data) setEligibleBookings(eligibleResult.data as EligibleBooking[])
    setIsLoading(false)
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = (key: keyof ReviewFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  const handleDeleteRequest = (reviewId: string) => {
    setPendingDeleteId(reviewId)
  }

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return
    const result = await deleteReview(pendingDeleteId)
    setPendingDeleteId(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Review deleted")
      fetchData()
    }
  }

  const handleDeleteCancel = () => {
    setPendingDeleteId(null)
  }

  const inlineStats = useMemo(() => [
    { label: "total", value: stats.total },
    { label: "pending", value: stats.pending },
    { label: "approved", value: stats.approved },
  ], [stats.total, stats.pending, stats.approved])

  const writeReviewButton = eligibleBookings.length > 0 ? (
    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary text-sm">
      <Plus className="w-4 h-4" />
      Write Review
    </button>
  ) : undefined

  return (
    <ContentSection
      title="Reviews"
      action={
        <div className="flex items-center gap-4">
          <InlineStats stats={inlineStats} />
          {writeReviewButton}
        </div>
      }
    >
      {/* Eligible bookings prompt */}
      {eligibleBookings.length > 0 && (
        <div className="mb-6 py-3 px-4 rounded-md bg-[var(--gold)]/5 border border-[var(--border-accent)]">
          <p className="text-sm text-[var(--gold-text)]">
            {eligibleBookings.length} completed booking{eligibleBookings.length > 1 ? "s" : ""} awaiting review
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="luxury-input pl-11"
            aria-label="Search reviews"
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            className="luxury-input min-w-0 w-full sm:min-w-[130px]"
            aria-label="Sort reviews by"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="luxury-input min-w-0 w-full sm:min-w-[120px]"
            aria-label="Filter by review status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filters.ratingRange}
            onChange={(e) => handleFilterChange("ratingRange", e.target.value)}
            className="luxury-input min-w-0 w-full sm:min-w-[120px]"
            aria-label="Filter by rating"
          >
            {RATING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div key={`${filters.sortBy}-${filters.status}-${filters.ratingRange}`} className="space-y-3 account-tab-enter">
        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={
              filters.search || filters.status !== "all" || filters.ratingRange !== "all"
                ? "No matching reviews"
                : "Share your experience after your next transfer"
            }
            description={
              filters.search || filters.status !== "all" || filters.ratingRange !== "all"
                ? "Try adjusting your filters"
                : "Your feedback helps other travellers and the drivers who serve you"
            }
          />
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={() => setEditingReview(review)}
              onDelete={() => handleDeleteRequest(review.id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-[var(--text-muted)] tabular-nums">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters((p) => ({ ...p, page: p.page! - 1 }))}
              disabled={pagination.page === 1}
              className="btn btn-secondary disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setFilters((p) => ({ ...p, page: p.page! + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="btn btn-secondary disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <ReviewFormModal
          eligibleBookings={eligibleBookings}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); fetchData() }}
        />
      )}
      {editingReview && (
        <ReviewFormModal
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onSuccess={() => { setEditingReview(null); fetchData() }}
        />
      )}

      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-bg)] account-overlay-enter p-4" onClick={handleDeleteCancel}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-review-title"
            aria-describedby="delete-review-desc"
            className="w-full max-w-sm bg-[var(--black-rich)] border border-[var(--border-default)] rounded-lg p-6 account-modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-review-title" className="text-base font-medium text-[var(--text-primary)] mb-2">Delete review?</h3>
            <p id="delete-review-desc" className="text-sm text-[var(--text-muted)] mb-6">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={handleDeleteCancel} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDeleteConfirm} className="btn border border-[var(--status-cancelled-border)] text-[var(--error-text)] hover:bg-[var(--status-cancelled-bg)]">Delete</button>
            </div>
          </div>
        </div>
      )}
    </ContentSection>
  )
}
