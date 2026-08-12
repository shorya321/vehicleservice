/**
 * Admin Business Wallet Page
 * Allows admins to view and manage business wallet
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WalletManagementClient } from '../components/wallet-management-client';

export const metadata: Metadata = {
  title: 'Business Wallet Management | Admin',
  description: 'View and manage business wallet balance, limits, and transactions',
};

interface BusinessWalletPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BusinessWalletPage({ params }: BusinessWalletPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Wallet Management</h1>
        <p className="text-muted-foreground">
          View and manage business wallet balance, limits, and transactions
        </p>
      </div>

      {/* Client Component */}
      <WalletManagementClient businessId={id} />
    </div>
  );
}
