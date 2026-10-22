'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminAction } from '@/lib/auth/admin-action'
import { formatBookingDateTime } from '@/lib/utils/timezone'
import { tripTypeLabel } from '@/lib/trips/display'
import type { TrashedBookingRow } from './types'

interface TrashSummary {
  customer_name?: string
  leg_count?: number
  booking_status?: string
  total_price?: number
  from_quotation?: boolean
}

/**
 * Everything in the trash, newest first. Expired entries are purged first: there is no cron
 * for this, so the list itself is what keeps the 30-day promise.
 */
export async function getTrashedBookings(): Promise<{ rows: TrashedBookingRow[]; error?: string }> {
  const auth = await requireAdminAction()
  if ('error' in auth) return { rows: [], error: auth.error }

  const adminClient = createAdminClient()
  const { error: purgeError } = await adminClient.rpc('purge_trashed_bookings', {})
  if (purgeError) console.error('Failed to purge expired trash:', purgeError)

  const { data, error } = await adminClient
    .from('deleted_bookings')
    .select(
      'id, source, trip_type, trip_label, pickup_datetime, summary, deleted_by_name, deleted_by_role, deleted_at, expires_at, business_accounts(business_name)'
    )
    .order('deleted_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Failed to load the trash:', error)
    return { rows: [], error: 'Failed to load deleted bookings' }
  }

  const rows = (data ?? []).map((row): TrashedBookingRow => {
    const summary = (row.summary ?? {}) as TrashSummary
    return {
      id: row.id,
      source: row.source === 'customer' ? 'customer' : 'business',
      tripLabel: row.trip_label,
      tripType: tripTypeLabel({ trip_type: row.trip_type }),
      customerName: summary.customer_name ?? 'Unknown',
      businessName: row.business_accounts?.business_name ?? null,
      legCount: summary.leg_count ?? 1,
      bookingStatus: summary.booking_status ?? null,
      totalPrice: summary.total_price ?? null,
      fromQuotation: summary.from_quotation === true,
      pickupAt: row.pickup_datetime ? formatBookingDateTime(row.pickup_datetime) : '',
      deletedAt: formatBookingDateTime(row.deleted_at),
      deletedBy: row.deleted_by_name ?? (row.deleted_by_role === 'admin' ? 'Platform admin' : 'Business user'),
      expiresAt: formatBookingDateTime(row.expires_at),
    }
  })

  return { rows }
}

export async function restoreTrashedBooking(trashId: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if ('error' in auth) return { error: auth.error }

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name, email')
    .eq('id', auth.userId)
    .maybeSingle()

  const { error } = await adminClient.rpc('restore_trashed_trip', {
    p_trash_id: trashId,
    p_actor_auth_id: auth.userId,
    p_actor_name: profile?.full_name || profile?.email || 'Platform admin',
    p_actor_role: 'admin',
  })

  if (error) {
    console.error('Failed to restore booking from the trash:', { trashId, error })
    // P0001/P0002 are RAISEs from the restore function, written for people. Anything else
    // (a vehicle type or location deleted since) is reported plainly rather than leaked.
    if (error.code === 'P0001' || error.code === 'P0002') return { error: error.message }
    if (error.code === '23503') {
      return { error: 'Something this booking points to (a location, vehicle type or addon) no longer exists.' }
    }
    return { error: 'Failed to restore booking' }
  }

  revalidatePath('/admin/bookings')
  revalidatePath('/admin/bookings/trash')
  return { success: true }
}

/** Permanently removes one entry, or with no id the whole trash. Admin only. */
export async function purgeTrashedBookings(trashId?: string): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if ('error' in auth) return { error: auth.error }

  const { error } = await createAdminClient().rpc(
    'purge_trashed_bookings',
    trashId ? { p_trash_id: trashId } : { p_all: true }
  )
  if (error) {
    console.error('Failed to purge the trash:', { trashId, error })
    return { error: 'Failed to remove deleted bookings' }
  }

  revalidatePath('/admin/bookings/trash')
  return { success: true }
}
