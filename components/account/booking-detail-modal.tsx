"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { X, MapPin, Calendar, Clock, Users, Briefcase, Car, Phone, Mail, Building2, CreditCard, Loader2, AlertTriangle, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { getBookingDetails, cancelBooking } from "@/app/account/booking-actions"
import { toast } from "sonner"
import { formatPrice } from "@/lib/currency/format"
import { useCurrency } from '@/lib/currency/context'

const DT_LONG: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }
const DT_SHORT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
const DT_DATE: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric", year: "numeric" }
const DT_TIME: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }

function formatDT(dateStr: string, opts: Intl.DateTimeFormatOptions = DT_LONG) {
  return new Date(dateStr).toLocaleDateString("en-US", opts)
}

interface BookingDetailModalProps {
  bookingId: string
  onClose: () => void
  onRefresh: () => void
}

export function BookingDetailModal({ bookingId, onClose, onRefresh }: BookingDetailModalProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const [booking, setBooking] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    async function fetchBooking() {
      const result = await getBookingDetails(bookingId)
      if (result.error) {
        toast.error(result.error)
        onClose()
      } else {
        setBooking(result.data)
      }
      setIsLoading(false)
    }
    fetchBooking()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId])

  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    panel.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return }
      if (e.key !== "Tab") return

      const focusable = panel!.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose])

  const handleCancel = async () => {
    setIsCancelling(true)
    const result = await cancelBooking(bookingId)
    setIsCancelling(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Booking cancelled successfully")
      onRefresh()
      onClose()
    }
  }

  const [now] = useState(() => Date.now())
  const canCancel = useMemo(() => booking &&
    (booking.booking_status === "confirmed" || booking.booking_status === "pending") &&
    new Date(booking.pickup_datetime).getTime() - now > 24 * 60 * 60 * 1000,
    [booking?.booking_status, booking?.pickup_datetime, now]
  )

  const { formattedDate, formattedTime } = useMemo(() => {
    if (!booking?.pickup_datetime) return { formattedDate: "", formattedTime: "" }
    const d = new Date(booking.pickup_datetime)
    return {
      formattedDate: d.toLocaleDateString("en-US", DT_DATE),
      formattedTime: d.toLocaleTimeString("en-US", DT_TIME),
    }
  }, [booking?.pickup_datetime])

  const formattedBaseFare = useMemo(
    () => booking ? formatPrice(booking.base_price ?? booking.total_price, currentCurrency, exchangeRates) : "",
    [booking?.base_price, booking?.total_price, currentCurrency, exchangeRates]
  )
  const formattedTotal = useMemo(
    () => booking ? formatPrice(booking.total_price ?? 0, currentCurrency, exchangeRates) : "",
    [booking?.total_price, currentCurrency, exchangeRates]
  )

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-bg)] account-overlay-enter" role="status" aria-label="Loading booking details">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
        <span className="sr-only">Loading booking details</span>
      </div>
    )
  }

  if (!booking) return null

  const assignment = booking.booking_assignments?.[0]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-[var(--overlay-bg)] account-overlay-enter !mt-0" onClick={showCancelConfirm ? undefined : onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-detail-title"
        aria-describedby="booking-detail-number"
        tabIndex={-1}
        className="w-full max-w-lg h-full bg-[var(--black-rich)] border-l border-[var(--border-default)] overflow-y-auto account-panel-enter outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--black-rich)] border-b border-[var(--border-subtle)] p-4 flex items-center justify-between">
          <div>
            <h2 id="booking-detail-title" className="text-lg font-medium text-[var(--text-primary)]">Booking Details</h2>
            <p id="booking-detail-number" className="text-sm text-[var(--gold-text)] font-mono">#{booking.trip_number || booking.booking_number}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--charcoal)] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[var(--gold)] focus-visible:outline-offset-2" aria-label="Close booking details">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="p-4 pb-8 space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={booking.booking_status} type="booking" />
            <StatusBadge status={booking.payment_status} type="payment" />
          </div>

          {/* Booking Timeline */}
          <div className="text-xs text-[var(--text-muted)] space-y-1">
            <p>Booked: {formatDT(booking.created_at)}</p>
            {booking.paid_at && <p>Paid: {formatDT(booking.paid_at)}</p>}
          </div>

          {/* Cancellation Info */}
          {booking.booking_status === "cancelled" && (
            <div className="p-3 rounded-lg bg-[var(--status-cancelled-bg)] border border-[var(--status-cancelled-border)]">
              <p className="text-xs text-[var(--error-text)] mb-1">Booking Cancelled</p>
              {booking.cancelled_at && (
                <p className="text-xs text-[var(--text-muted)]">
                  {formatDT(booking.cancelled_at)}
                </p>
              )}
              {booking.cancellation_reason && (
                <p className="text-sm text-[var(--text-primary)] mt-2">{booking.cancellation_reason}</p>
              )}
            </div>
          )}

          {/* Journey Details */}
          <Section title="Journey Details" icon={<MapPin className="w-4 h-4" />}>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--status-completed-bg)] flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[var(--status-completed-text)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Pickup</p>
                  <p className="text-sm text-[var(--text-primary)]">{booking.pickup_address}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--status-cancelled-bg)] flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[var(--error-text)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Dropoff</p>
                  <p className="text-sm text-[var(--text-primary)]">{booking.dropoff_address}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <InfoItem icon={<Calendar className="w-4 h-4" />} label="Date" value={formattedDate} />
                <InfoItem icon={<Clock className="w-4 h-4" />} label="Time" value={formattedTime} />
                <InfoItem icon={<Users className="w-4 h-4" />} label="Passengers" value={booking.passenger_count} />
                <InfoItem icon={<Briefcase className="w-4 h-4" />} label="Luggage" value={booking.luggage_count ?? "—"} />
              </div>
            </div>
          </Section>

          {/* Vehicle & Provider */}
          {(booking.vehicle_type || assignment) && (
            <Section title="Service Provider" icon={<Car className="w-4 h-4" />}>
              <div className="space-y-3">
                {booking.vehicle_type && (
                  <InfoItem icon={<Car className="w-4 h-4" />} label="Vehicle Type" value={booking.vehicle_type.name} />
                )}
                {assignment?.vendor && (
                  <InfoItem icon={<Building2 className="w-4 h-4" />} label="Vendor" value={assignment.vendor.business_name} />
                )}
                {assignment?.vendor?.business_phone && (
                  <InfoItem
                    icon={<Phone className="w-4 h-4" />}
                    label="Vendor Phone"
                    value={
                      <a href={`tel:${assignment.vendor.business_phone}`} className="text-[var(--gold-text)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--gold)] focus-visible:outline-offset-2 rounded-sm">
                        {assignment.vendor.business_phone}
                      </a>
                    }
                  />
                )}
                {assignment?.vendor?.business_email && (
                  <InfoItem
                    icon={<Mail className="w-4 h-4" />}
                    label="Vendor Email"
                    value={
                      <a href={`mailto:${assignment.vendor.business_email}`} className="text-[var(--gold-text)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--gold)] focus-visible:outline-offset-2 rounded-sm">
                        {assignment.vendor.business_email}
                      </a>
                    }
                  />
                )}
                {assignment?.driver && (
                  <InfoItem icon={<Users className="w-4 h-4" />} label="Driver" value={`${assignment.driver.first_name} ${assignment.driver.last_name}`} />
                )}
                {assignment?.driver?.phone && (
                  <InfoItem
                    icon={<Phone className="w-4 h-4" />}
                    label="Driver Phone"
                    value={
                      <a href={`tel:${assignment.driver.phone}`} className="text-[var(--gold-text)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--gold)] focus-visible:outline-offset-2 rounded-sm">
                        {assignment.driver.phone}
                      </a>
                    }
                  />
                )}
                {assignment?.vehicle && (
                  <InfoItem icon={<Car className="w-4 h-4" />} label="Vehicle" value={`${assignment.vehicle.make} ${assignment.vehicle.model} ${assignment.vehicle.year}`} />
                )}
                {assignment?.vehicle?.registration_number && (
                  <InfoItem icon={<Car className="w-4 h-4" />} label="Registration" value={assignment.vehicle.registration_number} />
                )}

                {/* Assignment Timeline */}
                {assignment && (assignment.assigned_at || assignment.accepted_at || assignment.completed_at) && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                    <p className="text-xs text-[var(--text-muted)] mb-2">Assignment Timeline</p>
                    <div className="space-y-2 text-xs">
                      {assignment.assigned_at && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[var(--status-pending-text)]" />
                          <span className="text-[var(--text-muted)]">Assigned: {formatDT(assignment.assigned_at, DT_SHORT)}</span>
                        </div>
                      )}
                      {assignment.accepted_at && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[var(--status-completed-text)]" />
                          <span className="text-[var(--text-muted)]">Accepted: {formatDT(assignment.accepted_at, DT_SHORT)}</span>
                        </div>
                      )}
                      {assignment.completed_at && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[var(--status-confirmed-text)]" />
                          <span className="text-[var(--text-muted)]">Completed: {formatDT(assignment.completed_at, DT_SHORT)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Special Requests */}
          {booking.customer_notes && (
            <Section title="Special Requests" icon={<FileText className="w-4 h-4" />}>
              <p className="text-sm text-[var(--text-primary)]">{booking.customer_notes}</p>
            </Section>
          )}

          {/* Payment Summary */}
          <Section title="Payment Summary" icon={<CreditCard className="w-4 h-4" />}>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Base fare</span>
                <span className="text-[var(--text-primary)] tabular-nums">{formattedBaseFare}</span>
              </div>
              {booking.booking_amenities?.map((amenity: any) => (
                <div key={amenity.id} className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{amenity.addon?.name}{amenity.quantity > 1 ? ` x${amenity.quantity}` : ''}</span>
                  <span className="text-[var(--text-primary)] tabular-nums">{formatPrice(amenity.price || 0, currentCurrency, exchangeRates)}</span>
                </div>
              ))}
              <div className="border-t border-[var(--border-subtle)] pt-2 mt-2 flex justify-between">
                <span className="font-medium text-[var(--text-primary)]">Total</span>
                <span className="font-semibold text-[var(--gold-text)] tabular-nums">{formattedTotal}</span>
              </div>
            </div>
          </Section>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border-subtle)]">
            {canCancel && !showCancelConfirm && (
              <button onClick={() => setShowCancelConfirm(true)} className="btn bg-[var(--status-cancelled-bg)] hover:opacity-80 text-[var(--error-text)] border border-[var(--status-cancelled-border)]">
                Cancel Booking
              </button>
            )}

            {showCancelConfirm && (
              <div role="alert" className="p-4 rounded-lg bg-[var(--status-cancelled-bg)] border border-[var(--status-cancelled-border)]">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-[var(--error-text)] flex-shrink-0" />
                  <p className="text-sm text-[var(--error-text)]">Are you sure you want to cancel this booking?</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowCancelConfirm(false)} className="flex-1 btn btn-secondary">
                    No, Keep It
                  </button>
                  <button onClick={handleCancel} disabled={isCancelling} className="flex-1 btn bg-[var(--error-text)] hover:opacity-90 text-[var(--bone)]">
                    {isCancelling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Cancelling...</span>
                      </>
                    ) : "Yes, Cancel"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="pt-6 border-t border-[var(--border-subtle)]">
      <h3 className="text-sm font-medium text-[var(--gold-text)] mb-4 flex items-center gap-2">{icon}{title}</h3>
      {children}
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--text-muted)]">{icon}</span>
      <span className="text-xs text-[var(--text-muted)]">{label}:</span>
      <span className="text-[0.9375rem] text-[var(--text-primary)] tabular-nums">{value}</span>
    </div>
  )
}

const BOOKING_STATUS_CONFIG: Record<string, { style: string; icon: typeof Clock }> = {
  confirmed: { style: "bg-[var(--status-confirmed-bg)] text-[var(--status-confirmed-text)] border-[var(--status-confirmed-border)]", icon: CheckCircle2 },
  completed: { style: "bg-[var(--status-completed-bg)] text-[var(--status-completed-text)] border-[var(--status-completed-border)]", icon: CheckCircle2 },
  cancelled: { style: "bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled-text)] border-[var(--status-cancelled-border)]", icon: XCircle },
  pending: { style: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)] border-[var(--status-pending-border)]", icon: Clock },
}
const PAYMENT_STATUS_CONFIG: Record<string, { style: string; icon: typeof Clock }> = {
  completed: { style: "bg-[var(--status-completed-bg)] text-[var(--status-completed-text)] border-[var(--status-completed-border)]", icon: CheckCircle2 },
  processing: { style: "bg-[var(--status-processing-bg)] text-[var(--status-processing-text)] border-[var(--status-processing-border)]", icon: Clock },
  failed: { style: "bg-[var(--status-failed-bg)] text-[var(--status-failed-text)] border-[var(--status-failed-border)]", icon: AlertCircle },
  refunded: { style: "bg-[var(--status-refunded-bg)] text-[var(--status-refunded-text)] border-[var(--status-refunded-border)]", icon: AlertCircle },
}
const FALLBACK_STATUS = { style: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)] border-[var(--status-pending-border)]", icon: Clock }

function StatusBadge({ status, type }: { status: string; type: "booking" | "payment" }) {
  const config = type === "booking" ? BOOKING_STATUS_CONFIG : PAYMENT_STATUS_CONFIG
  const resolved = config[status] ?? FALLBACK_STATUS
  const Icon = resolved.icon
  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-sm border inline-flex items-center gap-1.5 uppercase ${resolved.style}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  )
}
