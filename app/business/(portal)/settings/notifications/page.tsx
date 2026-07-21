/**
 * Business Notification Preferences Settings Page
 *
 * These are the BUSINESS's wallet alert preferences (low balance threshold,
 * spending limit warnings, monthly statements) stored on
 * business_accounts.notification_preferences - not a member's own inbox.
 * Owner only. A staff member's own notifications live at /business/notifications.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBusinessMember } from '@/lib/business/member-scope';
import { NotificationPreferencesContent } from './components/notification-preferences-content';

export const metadata: Metadata = {
  title: 'Wallet Alerts | Business Portal',
  description: 'Configure wallet notification preferences',
};

export default async function NotificationPreferencesPage() {
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

  if (member.role !== 'owner') {
    redirect('/business/dashboard');
  }

  return <NotificationPreferencesContent />;
}
