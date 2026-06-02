"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, Car, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { getBookings, getBookingStats, type BookingFilters } from "@/app/account/booking-actions"
import { BookingCard } from "./booking-card"
import { BookingDetailModal } from "./booking-detail-modal"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { ContentSection } from "./content-section"
import { InlineStats } from "./inline-stats"
import { ListSkeleton } from "./list-skeleton"
import { EmptyState } from "./empty-state"
import type { BookingListItem } from "./types"

interface BookingsTabProps {
  userId: string
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "pending", label: "Pending" },
]

const PAYMENT_OPTIONS = [
  { value: "all", label: "All Payments" },
  { value: "completed", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
]

export function BookingsTab({ userId }: BookingsTabProps) {
  const [bookings, setBookings] = useState<BookingListItem[]>([])
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, cancelled: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [filters, setFilters] = useState<BookingFilters>({
    search: "",
    status: "all",
    paymentStatus: "all",
    page: 1,
    limit: 10,
  })
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, page: 1 })
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    setFilters((prev) => {
      if (prev.search === debouncedSearch) return prev
      return { ...prev, search: debouncedSearch, page: 1 }
    })
  }, [debouncedSearch])

  const fetchStats = useCallback(async () => {
    const result = await getBookingStats(userId)
    setStats(result)
  }, [userId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const bookingsResult = await getBookings(userId, filters)
    setBookings(bookingsResult.bookings as BookingListItem[])
    setPagination({
      total: bookingsResult.total,
      totalPages: bookingsResult.totalPages,
      page: bookingsResult.page,
    })
    setIsLoading(false)
  }, [userId, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = (key: keyof BookingFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  const inlineStats = useMemo(() => [
    { label: "total", value: stats.total },
    { label: "upcoming", value: stats.upcoming, color: "var(--status-confirmed-text)" },
    { label: "completed", value: stats.completed, color: "var(--status-completed-text)" },
    { label: "cancelled", value: stats.cancelled, color: "var(--status-cancelled-text)" },
  ], [stats.total, stats.upcoming, stats.completed, stats.cancelled])

  return (
    <ContentSection
      title="Bookings"
      eyebrow="My Transfers"
      action={<InlineStats stats={inlineStats} />}
    >
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by booking number or address..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="luxury-input pl-11"
            aria-label="Search bookings"
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="luxury-input min-w-0 flex-1 min-w-[140px]"
            aria-label="Filter by booking status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filters.paymentStatus}
            onChange={(e) => handleFilterChange("paymentStatus", e.target.value)}
            className="luxury-input min-w-0 flex-1 min-w-[140px]"
            aria-label="Filter by payment status"
          >
            {PAYMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div key={`${filters.status}-${filters.paymentStatus}-${pagination.page}`} className="space-y-3 account-tab-enter">
        {isLoading ? (
          <ListSkeleton rows={3} />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Car}
            title={
              filters.search || filters.status !== "all" || filters.paymentStatus !== "all"
                ? "No matching bookings"
                : "Your journeys will appear here"
            }
            description={
              filters.search || filters.status !== "all" || filters.paymentStatus !== "all"
                ? "Try adjusting your filters"
                : "Once you book a transfer, you can track every detail from this page"
            }
            action={
              !(filters.search || filters.status !== "all" || filters.paymentStatus !== "all")
                ? <Link href="/" className="btn btn-primary">Book a Transfer</Link>
                : undefined
            }
          />
        ) : (
          bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onClick={() => setSelectedBookingId(booking.id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 mt-6">
          <p className="text-sm text-[var(--text-muted)] tabular-nums">
            Showing {(pagination.page - 1) * (filters.limit || 10) + 1} to {Math.min(pagination.page * (filters.limit || 10), pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedBookingId && (
        <BookingDetailModal
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onRefresh={() => { fetchData(); fetchStats() }}
        />
      )}
    </ContentSection>
  )
}
