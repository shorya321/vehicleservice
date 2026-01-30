"use client"

import { MapPin, Calendar, Clock, Car, ChevronRight } from "lucide-react"
import { formatPrice } from "@/lib/currency/format"

interface BookingCardProps {
  booking: {
    id: string
    booking_number: string
    pickup_address: string
    dropoff_address: string
    pickup_datetime: string
    booking_status: string
    payment_status: string
    total_price: number
    currency: string
    vehicle_type?: { name: string; image_url?: string } | null
    booking_assignments?: Array<{
      status: string
      vendor?: { business_name: string } | null
      driver?: { first_name: string; last_name: string } | null
    }>
  }
  onClick: () => void
  currentCurrency: string
  exchangeRates: Record<string, number>
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
}

const PAYMENT_STYLES: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  processing: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
  refunded: "bg-purple-500/20 text-purple-400 border-purple-500/30",
}

export function BookingCard({ booking, onClick, currentCurrency, exchangeRates }: BookingCardProps) {
  const pickupDate = new Date(booking.pickup_datetime)
  const formattedDate = pickupDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  const formattedTime = pickupDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const assignment = booking.booking_assignments?.[0]
  const vendorName = assignment?.vendor?.business_name
  const driverName = assignment?.driver
    ? `${assignment.driver.first_name} ${assignment.driver.last_name}`
    : null

  return (
    <button
      onClick={onClick}
      className="w-full account-item-card text-left group"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Left: Route Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-mono text-[var(--gold)]">#{booking.booking_number}</span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${STATUS_STYLES[booking.booking_status] || STATUS_STYLES.pending}`}>
              {booking.booking_status}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${PAYMENT_STYLES[booking.payment_status] || PAYMENT_STYLES.processing}`}>
              {booking.payment_status}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
              <p className="text-sm text-[var(--text-primary)] truncate">{booking.pickup_address}</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
              </div>
              <p className="text-sm text-[var(--text-primary)] truncate">{booking.dropoff_address}</p>
            </div>
          </div>
        </div>

        {/* Middle: Date/Time & Vehicle */}
        <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-2">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Clock className="w-4 h-4" />
            <span>{formattedTime}</span>
          </div>
          {booking.vehicle_type && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Car className="w-4 h-4" />
              <span>{booking.vehicle_type.name}</span>
            </div>
          )}
        </div>

        {/* Right: Price & Arrow */}
        <div className="flex items-center justify-between md:justify-end gap-4">
          <div className="text-right">
            <p className="text-lg font-semibold text-[var(--gold)]">
              {formatPrice(booking.total_price, currentCurrency, exchangeRates)}
            </p>
            {vendorName && (
              <p className="text-xs text-[var(--text-muted)]">{vendorName}</p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--gold)] transition-colors" />
        </div>
      </div>
    </button>
  )
}
