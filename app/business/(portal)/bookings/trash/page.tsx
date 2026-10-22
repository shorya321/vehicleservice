/**
 * Business Bookings Trash
 * Deleted trips stay here for 30 days and the owner can restore them.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBusinessMember } from '@/lib/business/member-scope';
import { formatBookingDateTime } from '@/lib/business/utils/timezone';
import { PageHeader, PageContainer } from '@/components/business/layout';
import { TrashList, type BusinessTrashRow } from './components/trash-list';

export const metadata: Metadata = {
  title: 'Deleted Bookings | Business Portal',
  description: 'Restore bookings deleted in the last 30 days',
};

interface TrashSummary {
  customer_name?: string;
  leg_count?: number;
  booking_status?: string;
}

export default async function BusinessBookingsTrashPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/business/login');

  const member = await getBusinessMember(supabase, user.id);
  if (!member) redirect('/business/login');

  // Restoring brings back a booking someone else may have deleted, so it is the owner's call.
  if (member.role !== 'owner') redirect('/business/bookings');

  // The trash table is service-role only; every read is scoped to this account here.
  const admin = createAdminClient();
  const { error: purgeError } = await admin.rpc('purge_trashed_bookings', {});
  if (purgeError) console.error('Failed to purge expired trash:', purgeError);

  const { data, error } = await admin
    .from('deleted_bookings')
    .select('id, trip_type, trip_label, pickup_datetime, summary, deleted_by_name, deleted_by_role, deleted_at, expires_at')
    .eq('business_account_id', member.businessAccountId)
    .order('deleted_at', { ascending: false })
    .limit(200);

  if (error) console.error('Failed to load the business trash:', error);

  const rows: BusinessTrashRow[] = (data ?? []).map((row) => {
    const summary = (row.summary ?? {}) as TrashSummary;
    return {
      id: row.id,
      tripLabel: row.trip_label,
      tripType: row.trip_type,
      customerName: summary.customer_name ?? 'Unknown',
      legCount: summary.leg_count ?? 1,
      bookingStatus: summary.booking_status ?? null,
      pickupAt: row.pickup_datetime ? formatBookingDateTime(row.pickup_datetime) : '',
      deletedAt: formatBookingDateTime(row.deleted_at),
      deletedBy: row.deleted_by_role === 'admin' ? 'the platform team' : row.deleted_by_name ?? 'a team member',
      // A platform removal is the platform's to undo; the owner is pointed at support instead.
      removedByPlatform: row.deleted_by_role === 'admin',
      expiresAt: formatBookingDateTime(row.expires_at),
    };
  });

  return (
    <PageContainer>
      <PageHeader
        title="Deleted Bookings"
        description="Deleted trips stay here for 30 days. Restoring brings a trip back with the same booking and trip numbers."
        breadcrumbs={[{ label: 'Bookings', href: '/business/bookings' }, { label: 'Trash' }]}
      />
      {error ? (
        <p className="text-sm text-destructive">Failed to load deleted bookings. Please refresh.</p>
      ) : (
        <TrashList rows={rows} />
      )}
    </PageContainer>
  );
}
