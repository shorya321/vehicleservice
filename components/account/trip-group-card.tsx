"use client"

import { memo, useMemo } from "react"
import { formatPrice } from "@/lib/currency/format"
import { useCurrency } from "@/lib/currency/context"
import { PAYMENT_LABEL, STATUS_LABEL, titleCase } from "./booking-card"
import { TripJourneyList, tripSummary, tripTotal } from "./trip-journeys"
import type { BookingListItem } from "./types"

interface TripGroupCardProps {
  trip: BookingListItem
  journeys: BookingListItem[]
}

/**
 * An upcoming round trip or multi-city order as one card. It was paid as one booking, so it is
 * listed as one; each journey inside opens its own page, where it can be cancelled on its own.
 */
export const TripGroupCard = memo(function TripGroupCard({ trip, journeys }: TripGroupCardProps) {
  const { currentCurrency, exchangeRates } = useCurrency()

  const formattedPrice = useMemo(
    () => formatPrice(tripTotal(journeys), currentCurrency, exchangeRates),
    [journeys, currentCurrency, exchangeRates]
  )

  const statuses = new Set(journeys.map((journey) => journey.booking_status))
  const allCancelled = statuses.size === 1 && statuses.has("cancelled")
  // One chip when every journey agrees. When they differ, each journey line says so itself.
  const statusLabel =
    statuses.size === 1 ? STATUS_LABEL[trip.booking_status] ?? titleCase(trip.booking_status) : null

  // The order is paid once, so every journey carries the same payment status.
  const paymentLabel = trip.payment_status ? PAYMENT_LABEL[trip.payment_status] ?? null : null
  const paymentNeedsAction = trip.payment_status === "failed" || trip.payment_status === "pending"

  const vendors = new Set(
    journeys.map((journey) => journey.booking_assignments?.[0]?.vendor?.business_name).filter(Boolean)
  )
  const vendorName = vendors.size === 1 ? Array.from(vendors)[0] : null
  const legCount = trip.booking_group?.leg_count ?? journeys.length

  return (
    <div className="account-item-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="account-ref">{trip.booking_group?.group_number}</span>
            {statusLabel && (
              <span className={`account-chip ${allCancelled ? "account-chip-alert" : ""}`}>{statusLabel}</span>
            )}
            {paymentLabel && (
              <span className={`account-chip ${paymentNeedsAction ? "account-chip-alert" : ""}`}>
                {paymentLabel}
              </span>
            )}
          </div>
          <p className="text-[0.75rem] leading-snug text-[var(--text-muted)]">
            {tripSummary(trip, journeys)}
            {trip.vehicle_type?.name ? ` · ${trip.vehicle_type.name}` : ""}
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-col items-start gap-1 sm:items-end sm:text-right">
          <span className="t-price">{formattedPrice}</span>
          {vendorName && <span className="text-xs text-[var(--text-muted)]">{vendorName}</span>}
        </div>
      </div>

      <div className="mt-4">
        <TripJourneyList journeys={journeys} legCount={legCount} />
      </div>
    </div>
  )
})
