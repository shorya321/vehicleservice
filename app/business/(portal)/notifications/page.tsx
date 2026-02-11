/**
 * Business Notifications Page
 * View all notifications for business users
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NotificationsContent } from './components/notifications-content';

export const metadata: Metadata = {
  title: 'Notifications | Business Portal',
  description: 'View your business notifications',
};

export default async function BusinessNotificationsPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/business/login');
  }

  // Verify user is a business user
  const { data: businessUser } = await supabase
    .from('business_users')
    .select('id, business_account_id')
    .eq('auth_user_id', user.id)
    .single();

  if (!businessUser) {
    redirect('/business/login');
  }

  return <NotificationsContent />;
}
