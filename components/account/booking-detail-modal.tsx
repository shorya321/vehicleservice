"use client"

import { useState, useEffect } from "react"
import { X, MapPin, Calendar, Clock, Users, Briefcase, Car, Phone, Mail, Building2, CreditCard, Printer, Download, Loader2, AlertTriangle, FileText } from "lucide-react"
import { getBookingDetails, cancelBooking } from "@/app/account/booking-actions"
import { toast } from "sonner"
import { formatPrice } from "@/lib/currency/format"
import { useCurrency } from '@/lib/currency/context'

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
  }, [bookingId, onClose])

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
  const canCancel = booking &&
    (booking.booking_status === "confirmed" || booking.booking_status === "pending") &&
    new Date(booking.pickup_datetime).getTime() - now > 24 * 60 * 60 * 1000

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!booking) return null

  const pickupDate = new Date(booking.pickup_datetime)
  const assignment = booking.booking_assignments?.[0]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/80" onClick={onClose}>
      <div
        className="w-full max-w-lg h-full bg-[var(--black-rich)] border-l border-[var(--gold)]/20 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--black-rich)] border-b border-[var(--gold)]/10 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">Booking Details</h2>
            <p className="text-sm text-[var(--gold)] font-mono">#{booking.booking_number}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--charcoal)] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={booking.booking_status} type="booking" />
            <StatusBadge status={booking.payment_status} type="payment" />
          </div>

          {/* Booking Timeline */}
          <div className="text-xs text-[var(--text-muted)] space-y-1">
            <p>Booked: {new Date(booking.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            {booking.paid_at && <p>Paid: {new Date(booking.paid_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
          </div>

          {/* Cancellation Info */}
          {booking.booking_status === "cancelled" && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400 mb-1">Booking Cancelled</p>
              {booking.cancelled_at && (
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(booking.cancelled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Pickup</p>
                  <p className="text-sm text-[var(--text-primary)]">{booking.pickup_address}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Dropoff</p>
                  <p className="text-sm text-[var(--text-primary)]">{booking.dropoff_address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <InfoItem icon={<Calendar className="w-4 h-4" />} label="Date" value={pickupDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} />
                <InfoItem icon={<Clock className="w-4 h-4" />} label="Time" value={pickupDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} />
                <InfoItem icon={<Users className="w-4 h-4" />} label="Passengers" value={booking.passengers} />
                <InfoItem icon={<Briefcase className="w-4 h-4" />} label="Luggage" value={booking.luggage} />
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
                      <a href={`tel:${assignment.vendor.business_phone}`} className="text-[var(--gold)] hover:underline">
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
                      <a href={`mailto:${assignment.vendor.business_email}`} className="text-[var(--gold)] hover:underline">
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
                      <a href={`tel:${assignment.driver.phone}`} className="text-[var(--gold)] hover:underline">
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
                  <div className="mt-4 pt-4 border-t border-[var(--gold)]/10">
                    <p className="text-xs text-[var(--text-muted)] mb-2">Assignment Timeline</p>
                    <div className="space-y-2 text-xs">
                      {assignment.assigned_at && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-400" />
                          <span className="text-[var(--text-muted)]">Assigned: {new Date(assignment.assigned_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      )}
                      {assignment.accepted_at && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-[var(--text-muted)]">Accepted: {new Date(assignment.accepted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      )}
                      {assignment.completed_at && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                          <span className="text-[var(--text-muted)]">Completed: {new Date(assignment.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
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
                <span className="text-[var(--text-primary)]">{formatPrice(booking.base_price || booking.total_price, currentCurrency, exchangeRates)}</span>
              </div>
              {booking.booking_amenities?.map((amenity: any) => (
                <div key={amenity.id} className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{amenity.addon?.name}{amenity.quantity > 1 ? ` x${amenity.quantity}` : ''}</span>
                  <span className="text-[var(--text-primary)]">{formatPrice(amenity.price || 0, currentCurrency, exchangeRates)}</span>
                </div>
              ))}
              <div className="border-t border-[var(--gold)]/10 pt-2 mt-2 flex justify-between">
                <span className="font-medium text-[var(--text-primary)]">Total</span>
                <span className="font-semibold text-[var(--gold)]">{formatPrice(booking.total_price || 0, currentCurrency, exchangeRates)}</span>
              </div>
            </div>
          </Section>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-[var(--gold)]/10">
            <div className="flex gap-3">
              <button className="flex-1 btn btn-secondary" onClick={() => window.print()}>
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button className="flex-1 btn btn-secondary">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>

            {canCancel && !showCancelConfirm && (
              <button onClick={() => setShowCancelConfirm(true)} className="btn bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30">
                Cancel Booking
              </button>
            )}

            {showCancelConfirm && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-300">Are you sure you want to cancel this booking?</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowCancelConfirm(false)} className="flex-1 btn btn-secondary">
                    No, Keep It
                  </button>
                  <button onClick={handleCancel} disabled={isCancelling} className="flex-1 btn bg-red-500 hover:bg-red-600 text-white">
                    {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Cancel"}
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
    <div className="luxury-card p-4">
      <h3 className="text-sm font-medium text-[var(--gold)] mb-4 flex items-center gap-2">{icon}{title}</h3>
      {children}
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--text-muted)]">{icon}</span>
      <span className="text-xs text-[var(--text-muted)]">{label}:</span>
      <span className="text-sm text-[var(--text-primary)]">{value}</span>
    </div>
  )
}

function StatusBadge({ status, type }: { status: string; type: "booking" | "payment" }) {
  const styles = type === "booking" ? {
    confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  } : {
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    processing: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    refunded: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  }
  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || styles.pending}`}>
      {status}
    </span>
  )
}
