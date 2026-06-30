/**
 * Business Account Signup Page
 * Public page for new business registration
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SignupPageContent } from './components/signup-page-content';
import '@/app/business/globals.css';

export const metadata: Metadata = {
  title: 'Business Signup | Vehicle Transfer Service',
  description: 'Create a business account to manage transfer bookings for your customers',
};

export default async function BusinessSignupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: businessUser } = await supabase
      .from('business_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (businessUser) {
      redirect('/business/dashboard');
    }
  }

  return <SignupPageContent />;
}
