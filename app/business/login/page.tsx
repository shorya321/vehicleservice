/**
 * Business Account Login Page
 * Public page for business authentication
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginPageContent } from './components/login-page-content';
import '@/app/business/globals.css';

export const metadata: Metadata = {
  title: 'Business Login | Vehicle Transfer Service',
  description: 'Sign in to your business account',
};

export default async function BusinessLoginPage() {
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

  return <LoginPageContent />;
}
