import Link from 'next/link'
import { AlertCircle, ArrowRight, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { bookingDayKey, bookingToday, formatBookingDate, formatBookingTime } from '@/lib/utils/timezone'
import type { PickupItem, VendorState } from '@/lib/dashboard/upcoming-pickups'

interface UpcomingPickupsCardProps {
  items: PickupItem[]
  total: number
  withoutVendor: number
  error: string | null
}

const VENDOR_BADGE: Record<VendorState, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  accepted: { label: 'Vendor accepted', variant: 'success' },
  awaiting: { label: 'Awaiting vendor', variant: 'warning' },
  none: { label: 'No vendor', variant: 'destructive' },
}

const DAY_MS = 24 * 60 * 60 * 1000

/** "Today" or "Tomorrow" in the operating timezone; the window never reaches further. */
function dayLabel(pickupAt: string): string {
  const day = bookingDayKey(pickupAt)
  if (day === bookingToday()) return 'Today'
  if (day === bookingDayKey(new Date(Date.now() + DAY_MS))) return 'Tomorrow'
  return formatBookingDate(pickupAt, 'dd MMM')
}

function summaryLine(total: number, withoutVendor: number): string {
  const trips = `${total} ${total === 1 ? 'trip' : 'trips'}`
  return withoutVendor > 0 ? `Next 24 hours · ${trips} · ${withoutVendor} without a vendor` : `Next 24 hours · ${trips}`
}

export function UpcomingPickupsCard({ items, total, withoutVendor, error }: UpcomingPickupsCardProps) {
  return (
    <Card className="admin-card-hover admin-card-untinted">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
        <div>
          <CardTitle className="text-base font-semibold">Upcoming Pickups</CardTitle>
          <CardDescription className="mt-0.5">{summaryLine(total, withoutVendor)}</CardDescription>
        </div>
        <Link
          href="/admin/bookings?timeframe=upcoming"
          className="flex items-center gap-1.5 text-sm text-primary hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg transition-colors"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-2">
        {error ? (
          <div className="flex items-center gap-3 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Could not load upcoming pickups. Refresh to try again.
          </div>
        ) : items.length === 0 ? (
          <div className="p-3">
            <EmptyState
              icon={Clock}
              title="No Pickups Soon"
              description="No trips are picking up in the next 24 hours."
            />
          </div>
        ) : (
          <ul className="flex flex-col">
            {items.map((item) => {
              const badge = VENDOR_BADGE[item.vendor]
              return (
                <li key={item.id}>
                  <Link
                    href={`/admin/bookings/${item.id}`}
                    className="group grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{formatBookingTime(item.pickupAt)}</span>
                      <span className="text-xs text-muted-foreground">{dayLabel(item.pickupAt)}</span>
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.route}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {item.who} · {item.source === 'business' ? 'Business' : 'Customer'}
                      </span>
                    </span>
                    <Badge variant={badge.variant} className="text-xs whitespace-nowrap">
                      {badge.label}
                    </Badge>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
