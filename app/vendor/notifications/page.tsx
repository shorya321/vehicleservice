import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { VendorLayout } from '@/components/layout/vendor-layout';
import { AnimatedPage } from '@/components/layout/animated-page';
import { NotificationsContent } from './components/notifications-content';

export const metadata = {
  title: 'Notifications | Vendor Portal',
  description: 'View and manage your notifications',
};

export default async function VendorNotificationsPage() {
  const supabase = await createClient();

  // Check if user is authenticated and is vendor
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has vendor role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'vendor') {
    redirect('/unauthorized');
  }

  // Get vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('business_name')
    .eq('user_id', user.id)
    .single();

  return (
    <VendorLayout
      user={{
        email: profile.email,
        profile: { full_name: profile.full_name }
      }}
      vendorApplication={vendorApplication || undefined}
    >
      <AnimatedPage>
        <Suspense fallback={<NotificationsContentSkeleton />}>
          <NotificationsContent />
        </Suspense>
      </AnimatedPage>
    </VendorLayout>
  );
}

function NotificationsContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="h-10 w-full bg-muted animate-pulse rounded" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 w-full bg-muted animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}
