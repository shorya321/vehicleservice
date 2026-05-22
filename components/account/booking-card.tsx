"use client"

import { memo, useMemo } from "react"
import { Calendar, Clock, Car, ChevronRight, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { formatPrice } from "@/lib/currency/format"
import { useCurrency } from '@/lib/currency/context'
import type { BookingListItem } from "./types"

interface BookingCardProps {
  booking: BookingListItem
  onClick: () => void
}

const STATUS_CONFIG: Record<string, { style: string; icon: typeof Clock }> = {
  confirmed: { style: "bg-[var(--status-confirmed-bg)] text-[var(--status-confirmed-text)] border-[var(--status-confirmed-border)]", icon: CheckCircle2 },
  completed: { style: "bg-[var(--status-completed-bg)] text-[var(--status-completed-text)] border-[var(--status-completed-border)]", icon: CheckCircle2 },
  cancelled: { style: "bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled-text)] border-[var(--status-cancelled-border)]", icon: XCircle },
  pending: { style: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)] border-[var(--status-pending-border)]", icon: Clock },
}

const PAYMENT_CONFIG: Record<string, { style: string; icon: typeof Clock }> = {
  completed: { style: "bg-[var(--status-completed-bg)] text-[var(--status-completed-text)] border-[var(--status-completed-border)]", icon: CheckCircle2 },
  processing: { style: "bg-[var(--status-processing-bg)] text-[var(--status-processing-text)] border-[var(--status-processing-border)]", icon: Clock },
  failed: { style: "bg-[var(--status-failed-bg)] text-[var(--status-failed-text)] border-[var(--status-failed-border)]", icon: AlertCircle },
  refunded: { style: "bg-[var(--status-refunded-bg)] text-[var(--status-refunded-text)] border-[var(--status-refunded-border)]", icon: AlertCircle },
}

export const BookingCard = memo(function BookingCard({ booking, onClick }: BookingCardProps) {
  const { currentCurrency, exchangeRates } = useCurrency()

  const { formattedDate, formattedTime } = useMemo(() => {
    const d = new Date(booking.pickup_datetime)
    return {
      formattedDate: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      formattedTime: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    }
  }, [booking.pickup_datetime])

  const formattedPrice = useMemo(
    () => formatPrice(booking.total_price, currentCurrency, exchangeRates),
    [booking.total_price, currentCurrency, exchangeRates]
  )

  const assignment = booking.booking_assignments?.[0]
  const vendorName = assignment?.vendor?.business_name

  const bookingStatusConfig = STATUS_CONFIG[booking.booking_status] || STATUS_CONFIG.pending
  const BookingStatusIcon = bookingStatusConfig.icon
  const paymentConfig = PAYMENT_CONFIG[booking.payment_status] || PAYMENT_CONFIG.processing
  const PaymentIcon = paymentConfig.icon

  const dateIconColor = booking.booking_status === "cancelled"
    ? "text-[var(--text-muted)]"
    : booking.booking_status === "completed"
      ? "text-[var(--status-completed-text)]"
      : "text-[var(--status-confirmed-text)]"

  return (
    <button
      onClick={onClick}
      className="w-full account-item-card text-left group"
      aria-label={`View booking ${booking.booking_number}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Left: Route Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-mono text-[var(--gold-text)]">#{booking.booking_number}</span>
            <span aria-label={`Booking status: ${booking.booking_status}`} className={`px-2 py-0.5 text-xs font-medium rounded border inline-flex items-center gap-1 ${bookingStatusConfig.style}`}>
              <BookingStatusIcon className="w-3 h-3" />
              {booking.booking_status}
            </span>
            <span aria-label={`Payment: ${booking.payment_status}`} className={`px-2 py-0.5 text-xs font-medium rounded border inline-flex items-center gap-1 ${paymentConfig.style}`}>
              <PaymentIcon className="w-3 h-3" />
              {booking.payment_status}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-[var(--status-completed-bg)] flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                <div className="w-2 h-2 rounded-full bg-[var(--status-completed-text)]" />
              </div>
              <p className="text-sm text-[var(--text-primary)] truncate">{booking.pickup_address}</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-[var(--status-cancelled-bg)] flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                <div className="w-2 h-2 rounded-full bg-[var(--error-text)]" />
              </div>
              <p className="text-sm text-[var(--text-primary)] truncate">{booking.dropoff_address}</p>
            </div>
          </div>
        </div>

        {/* Middle: Date/Time & Vehicle */}
        <div className="flex lg:flex-col items-center lg:items-end gap-4 lg:gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] tabular-nums">
            <Calendar className={`w-4 h-4 ${dateIconColor}`} />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] tabular-nums">
            <Clock className={`w-4 h-4 ${dateIconColor}`} />
            <span>{formattedTime}</span>
          </div>
          {booking.vehicle_type && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Car className="w-4 h-4 text-[var(--gold-text)]" />
              <span>{booking.vehicle_type.name}</span>
            </div>
          )}
        </div>

        {/* Right: Price & Arrow */}
        <div className="flex items-center justify-between lg:justify-end gap-4">
          <div className="text-right">
            <p className="text-lg font-semibold text-[var(--gold-text)]">
              {formattedPrice}
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
})
