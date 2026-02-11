"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, Car, Calendar, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { getBookings, getBookingStats, type BookingFilters } from "@/app/account/booking-actions"
import { BookingCard } from "./booking-card"
import { BookingDetailModal } from "./booking-detail-modal"
import { useCurrency } from '@/lib/currency/context'

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
  const { currentCurrency, exchangeRates } = useCurrency()
  const [bookings, setBookings] = useState<any[]>([])
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

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const [bookingsResult, statsResult] = await Promise.all([
      getBookings(userId, filters),
      getBookingStats(userId),
    ])
    setBookings(bookingsResult.bookings)
    setPagination({
      total: bookingsResult.total,
      totalPages: bookingsResult.totalPages,
      page: bookingsResult.page,
    })
    setStats(statsResult)
    setIsLoading(false)
  }, [userId, filters])

  useEffect(() => {
    const loadData = () => fetchData()
    loadData()
  }, [fetchData])

  const handleFilterChange = (key: keyof BookingFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Car className="w-5 h-5" />} label="Total" value={stats.total} color="gold" />
        <StatCard icon={<Calendar className="w-5 h-5" />} label="Upcoming" value={stats.upcoming} color="blue" />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Completed" value={stats.completed} color="green" />
        <StatCard icon={<XCircle className="w-5 h-5" />} label="Cancelled" value={stats.cancelled} color="red" />
      </div>

      {/* Filters */}
      <div className="luxury-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by booking number or address..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="luxury-input pl-11"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="luxury-input min-w-[140px]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange("paymentStatus", e.target.value)}
              className="luxury-input min-w-[140px]"
            >
              {PAYMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="luxury-card p-12 text-center">
            <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="luxury-card p-12 text-center">
            <Car className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No bookings found</h3>
            <p className="text-sm text-[var(--text-muted)]">
              {filters.search || filters.status !== "all" || filters.paymentStatus !== "all"
                ? "Try adjusting your filters"
                : "Book a transfer to get started"}
            </p>
          </div>
        ) : (
          <>
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onClick={() => setSelectedBookingId(booking.id)}
              />
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            Showing {(pagination.page - 1) * 10 + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedBookingId && (
        <BookingDetailModal
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onRefresh={fetchData}
          currentCurrency={currentCurrency}
          exchangeRates={exchangeRates}
        />
      )}
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  color: "gold" | "blue" | "green" | "red"
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const iconColorClasses = {
    gold: "text-[var(--gold)]",
    blue: "text-blue-400",
    green: "text-green-400",
    red: "text-red-400",
  }

  return (
    <div className="luxury-card p-4">
      <div className="flex items-center gap-3">
        <div className="profile-stat">
          <div className={`profile-stat-icon ${color}`}>
            <span className={iconColorClasses[color]}>{icon}</span>
          </div>
        </div>
        <div>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  )
}
