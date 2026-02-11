import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AnimatedPage } from '@/components/layout/animated-page';
import { NotificationsContent } from './components/notifications-content';

export const metadata = {
  title: 'Notifications | Admin Dashboard',
  description: 'View and manage your notifications',
};

export default async function NotificationsPage() {
  const supabase = await createClient();

  // Check if user is authenticated and is admin
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  // Check if user has admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
      <AnimatedPage>
        <Suspense fallback={<NotificationsContentSkeleton />}>
          <NotificationsContent />
        </Suspense>
      </AnimatedPage>
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
