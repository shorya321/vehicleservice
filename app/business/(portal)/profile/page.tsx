/**
 * Business Profile Page
 * A member's own identity: photo, display name, password.
 *
 * Available to owners and staff. Business-level configuration (business name,
 * address, branding, wallet, domain) lives under /business/settings, which is
 * owner-only.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBusinessMember } from '@/lib/business/member-scope';
import { ProfilePageContent } from './components/profile-page-content';

export const metadata: Metadata = {
  title: 'Profile | Business Portal',
  description: 'Manage your name, photo and password',
};

export default async function BusinessProfilePage() {
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

  const [{ data: businessUser }, { data: profile }] = await Promise.all([
    supabase
      .from('business_users')
      .select('full_name, email')
      .eq('auth_user_id', user.id)
      .single(),
    supabase.from('profiles').select('avatar_url, full_name').eq('id', user.id).maybeSingle(),
  ]);

  const displayName = businessUser?.full_name || profile?.full_name || '';

  return (
    <ProfilePageContent
      displayName={displayName}
      email={businessUser?.email || user.email || ''}
      role={member.role}
      avatarUrl={profile?.avatar_url ?? null}
    />
  );
}
