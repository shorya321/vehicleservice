import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ClipboardPlus, Plus } from 'lucide-react'

import { AnimatedCard } from '@/components/ui/animated-card'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { requireVendor } from '@/lib/auth/user-actions'
import { createClient } from '@/lib/supabase/server'
import type {
  DirectBookingFilters,
  DirectBookingPaymentStatus,
  DirectBookingStatus,
} from '@/lib/vendor/direct-bookings/schema'
import { getDirectBookingStats, getDirectBookings } from './actions'
import { ClientFilters } from './components/client-filters'
import { DirectBookingsTable } from './components/direct-bookings-table'

export const metadata: Metadata = {
  title: 'Direct Bookings - Vendor Portal',
  description: 'Record and manage bookings taken directly from customers',
}

interface DirectBookingsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    paymentStatus?: string
    from?: string
    to?: string
    page?: string
  }>
}

const STAT_CARDS = [
  { key: 'total', label: 'Total', accent: 'text-sky-400' },
  { key: 'today', label: 'Today', accent: 'text-emerald-400' },
  { key: 'pending', label: 'Pending', accent: 'text-amber-400' },
  { key: 'unpaid', label: 'Unpaid', accent: 'text-rose-400' },
] as const

export default async function VendorDirectBookingsPage({
  searchParams,
}: DirectBookingsPageProps) {
  const user = await requireVendor()
  const supabase = await createClient()

  const params = await searchParams

  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .single()

  if (!vendorApplication || vendorApplication.status !== 'approved') {
    redirect('/vendor/profile')
  }

  const filters: DirectBookingFilters = {
    search: params.search,
    status: (params.status as DirectBookingStatus) || 'all',
    paymentStatus: (params.paymentStatus as DirectBookingPaymentStatus) || 'all',
    from: params.from,
    to: params.to,
    page: params.page ? parseInt(params.page) : 1,
    limit: 10,
  }

  const [{ bookings, total, page, totalPages }, stats] = await Promise.all([
    getDirectBookings(vendorApplication.id, filters),
    getDirectBookingStats(vendorApplication.id),
  ])

  const hasFilters =
    !!filters.search ||
    filters.status !== 'all' ||
    filters.paymentStatus !== 'all' ||
    !!filters.from ||
    !!filters.to

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Direct Bookings</h1>
          <p className="text-muted-foreground">
            Bookings you took directly from customers — kept separate from your
            platform bookings
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/vendor/direct-bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Direct Booking
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {STAT_CARDS.map((card, index) => (
          <AnimatedCard key={card.key} delay={0.1 * (index + 1)}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                    <ClipboardPlus className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span
                    className={`text-2xl sm:text-3xl font-bold tracking-tight ${card.accent}`}
                  >
                    {stats[card.key]}
                  </span>
                </div>
              </CardContent>
            </Card>
          </AnimatedCard>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Direct Bookings</CardTitle>
          <CardDescription>
            Offline and phone bookings recorded by your team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClientFilters initialFilters={filters} />

          {bookings.length > 0 ? (
            <>
              <DirectBookingsTable bookings={bookings} />

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * filters.limit! + 1} to{' '}
                    {Math.min(page * filters.limit!, total)} of {total} bookings
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} asChild>
                      <Link
                        href={{
                          pathname: '/vendor/direct-bookings',
                          query: { ...params, page: page - 1 },
                        }}
                      >
                        Previous
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      asChild
                    >
                      <Link
                        href={{
                          pathname: '/vendor/direct-bookings',
                          query: { ...params, page: page + 1 },
                        }}
                      >
                        Next
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <ClipboardPlus className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No direct bookings found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasFilters
                  ? 'Try adjusting your filters'
                  : 'Record your first offline booking to see it here'}
              </p>
              {!hasFilters && (
                <div className="mt-6">
                  <Button asChild size="sm">
                    <Link href="/vendor/direct-bookings/new">
                      <Plus className="mr-2 h-4 w-4" />
                      New Direct Booking
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
