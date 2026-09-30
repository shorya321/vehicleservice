/**
 * Business Bookings List Page
 * View all bookings for the business account
 *
 * Design System: Premium B2B experience with refined luxury aesthetic
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Plus, CalendarCheck } from 'lucide-react';
import { getBusinessMember, restrictedToOwnBookings } from '@/lib/business/member-scope';
import type { QuotationBookingLink } from '@/lib/business/bookings/group-quotation-bookings';
import { BookingsPageContent } from './components/bookings-page-content';

export const metadata: Metadata = {
  title: 'Bookings | Business Portal',
  description: 'View and manage your transfer bookings',
};

export default async function BusinessBookingsPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/business/login');
  }

  // Get business account
  const member = await getBusinessMember(supabase, user.id);

  if (!member) {
    redirect('/business/login');
  }

  // Staff only ever see the bookings they created themselves. The same scope
  // has to be applied to the header counts below, or the totals contradict the
  // list they are sitting above.
  const ownBookingsOnly = restrictedToOwnBookings(member.role);

  // Get bookings
  let bookingsQuery = supabase
    .from('business_bookings')
    .select(
      `
      id,
      booking_number,
      trip_number,
      customer_name,
      customer_email,
      pickup_datetime,
      booking_status,
      total_price,
      wallet_deduction_amount,
      from_locations:from_location_id (name, city),
      to_locations:to_location_id (name, city),
      vehicle_types (name),
      created_at
    `
    )
    .eq('business_account_id', member.businessAccountId);

  if (ownBookingsOnly) {
    bookingsQuery = bookingsQuery.eq('created_by_user_id', member.id);
  }

  const { data: bookings } = await bookingsQuery.order('created_at', { ascending: false });

  // Get stats for header
  let totalQuery = supabase
    .from('business_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('business_account_id', member.businessAccountId);

  if (ownBookingsOnly) {
    totalQuery = totalQuery.eq('created_by_user_id', member.id);
  }

  const { count: totalCount } = await totalQuery;

  let pendingQuery = supabase
    .from('business_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('business_account_id', member.businessAccountId)
    .eq('booking_status', 'pending');

  if (ownBookingsOnly) {
    pendingQuery = pendingQuery.eq('created_by_user_id', member.id);
  }

  const { count: pendingCount } = await pendingQuery;

  // Which of these bookings were converted from a quotation, and from which one.
  // Those bookings are held by an ON DELETE RESTRICT foreign key and can never be
  // deleted, so the list disables the action rather than letting the click fail at
  // the API. The quotation id and trip order also let the list show every booking
  // of one quotation together as a single group.
  //
  // Read with the admin client on purpose. The only RLS policy on
  // business_quotation_items is creator-scoped (owner, or the quotation's own
  // creator), so a staff member would see nothing here and would be shown a Delete
  // button that cannot work. The filter is the ids already loaded for this tenant,
  // and the projection adds only the quotation number, which the booking already
  // carries as its reference_number, so nothing new about the quotation leaks.
  const loadedIds = (bookings || []).map((b) => b.id);
  let quotationLinks: QuotationBookingLink[] = [];

  if (loadedIds.length > 0) {
    const { data: linkRows, error: quotationLinkError } = await createAdminClient()
      .from('business_quotation_items')
      .select('converted_booking_id, quotation_id, sort_order, quotation:business_quotations!bqi_quotation_fk (quotation_number)')
      .in('converted_booking_id', loadedIds);

    if (quotationLinkError) {
      // Not fatal: the API refuses the delete anyway, and after the ordering fix
      // that refusal no longer emails anyone. The list just shows ungrouped rows.
      console.error('Failed to read quotation links for bookings list:', quotationLinkError);
    } else {
      quotationLinks = (linkRows || []).flatMap((q) =>
        q.converted_booking_id
          ? [
              {
                bookingId: q.converted_booking_id,
                quotationId: q.quotation_id,
                quotationNumber: q.quotation?.quotation_number ?? null,
                sortOrder: q.sort_order,
              },
            ]
          : []
      );
    }
  }

  return (
    <BookingsPageContent
      bookings={bookings || []}
      totalCount={totalCount || 0}
      pendingCount={pendingCount || 0}
      quotationBookingIds={quotationLinks.map((l) => l.bookingId)}
      quotationLinks={quotationLinks}
    />
  );
}
