/**
 * Business Team Page
 * Owners manage the staff members who create bookings on the business's behalf.
 *
 * Design System: Clean shadcn with Gold Accent — the business portal's own system, NOT the
 * public site's luxury palette. Anything imported from @/components/ui must be checked for
 * hard-coded luxury-* classes before use.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBusinessMember } from '@/lib/business/member-scope';
import { TeamPageContent } from './components/team-page-content';

export const metadata: Metadata = {
  title: 'Team | Business Portal',
  description: 'Manage the staff members who can create bookings',
};

export default async function BusinessTeamPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/business/login');
  }

  const member = await getBusinessMember(supabase, user.id);

  if (!member) {
    redirect('/business/login');
  }

  // Staff have no business here. Send them somewhere they can use rather than
  // to the platform-wide /unauthorized page, which breaks the branded portal.
  if (member.role !== 'owner') {
    redirect('/business/dashboard');
  }

  // business_users has no SELECT policy covering other members' rows, so read
  // the roster with the service-role client, scoped to this tenant.
  const adminClient = createAdminClient();

  const { data: members } = await adminClient
    .from('business_users')
    .select('id, email, full_name, role, is_active, created_at')
    .eq('business_account_id', member.businessAccountId)
    .order('created_at', { ascending: true });

  // A member who has created bookings can only be deactivated, never removed,
  // so the roster needs their booking counts to disable the Remove button up
  // front rather than letting the owner discover it through a failed request.
  const { data: bookingRows } = await adminClient
    .from('business_bookings')
    .select('created_by_user_id')
    .eq('business_account_id', member.businessAccountId);

  const bookingCounts = (bookingRows ?? []).reduce<Record<string, number>>((counts, row) => {
    if (!row.created_by_user_id) return counts;
    return { ...counts, [row.created_by_user_id]: (counts[row.created_by_user_id] ?? 0) + 1 };
  }, {});

  return (
    <TeamPageContent
      members={members ?? []}
      currentMemberId={member.id}
      bookingCounts={bookingCounts}
    />
  );
}
