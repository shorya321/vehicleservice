'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Route } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { toBookingTz } from '@/lib/utils/timezone'
import { legLabel, tripTypeLabel } from '@/lib/trips/display'
import type { AdminTripGroup } from '@/lib/trips/admin-types'

interface TripGroupCardProps {
  group: AdminTripGroup
  /** The journey this page is showing. */
  currentBookingId: string
}

/**
 * Round trip or multi-city: every journey of the trip, how the one payment was
 * split across them, and anything owed back for a cancelled journey. Each
 * journey is its own booking with its own vendor, so each links to its own page.
 */
export function TripGroupCard({ group, currentBookingId }: TripGroupCardProps) {
  const refundsDue = group.legs.reduce((sum, leg) => sum + (leg.refund_due ?? 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Route className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>{tripTypeLabel({ trip_type: group.trip_type })} {group.group_number}</CardTitle>
              <CardDescription>
                {group.leg_count} journeys paid together. Assign a vendor to each journey.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline">{group.payment_status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-3">
          {group.legs.map((leg) => {
            const isCurrent = leg.id === currentBookingId
            const label = legLabel({ trip_type: group.trip_type, leg_index: leg.leg_index }, group.leg_count)
            return (
              <li
                key={leg.id}
                className={`rounded-lg border p-3 ${isCurrent ? 'border-primary bg-primary/5' : ''}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{label}</span>
                    {isCurrent ? (
                      <Badge variant="secondary">This booking</Badge>
                    ) : (
                      <Link href={`/admin/bookings/${leg.id}`} className="text-sm text-primary hover:underline">
                        {leg.trip_number || leg.booking_number}
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{leg.booking_status}</Badge>
                    <Badge variant={leg.assignment_status ? 'secondary' : 'destructive'}>
                      {leg.vendor_name ? `${leg.vendor_name} (${leg.assignment_status})` : 'No vendor'}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm">
                  {leg.pickup_address} to {leg.dropoff_address}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(toBookingTz(leg.pickup_datetime), 'PPP p')} · {formatCurrency(leg.total_price)}
                  {leg.discount_amount > 0 ? ` (after ${formatCurrency(leg.discount_amount)} discount)` : ''}
                </p>
                {leg.refund_due !== null && (
                  <p className="mt-1 text-sm font-medium text-amber-600">
                    Refund due {formatCurrency(leg.refund_due)}. Issue it manually in Stripe.
                  </p>
                )}
              </li>
            )
          })}
        </ol>

        <Separator />

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Fares</dt>
            <dd>{formatCurrency(group.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Discount ({group.discount_percent}%)</dt>
            <dd>{formatCurrency(group.discount_amount)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Charged</dt>
            <dd className="font-semibold">{formatCurrency(group.total_price)}</dd>
          </div>
          {refundsDue > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Refunds due</dt>
              <dd className="font-semibold text-amber-600">{formatCurrency(refundsDue)}</dd>
            </div>
          )}
          {group.stripe_payment_intent_id && (
            <div className="flex justify-between gap-4 sm:col-span-2">
              <dt className="text-muted-foreground">Stripe payment</dt>
              <dd className="font-mono text-xs">{group.stripe_payment_intent_id}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  )
}
