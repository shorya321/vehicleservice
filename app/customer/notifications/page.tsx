import { Suspense } from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CustomerLayout } from '@/components/layout/customer-layout';
import { NotificationsContent } from './components/notifications-content';

export const metadata = {
  title: 'Notifications - Customer Portal',
  description: 'View your notifications',
};

export default async function CustomerNotificationsPage() {
  const supabase = createServerComponentClient({ cookies });

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <CustomerLayout user={{ email: user.email, profile }}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading notifications...</p>
            </div>
          </div>
        }
      >
        <NotificationsContent />
      </Suspense>
    </CustomerLayout>
  );
}
