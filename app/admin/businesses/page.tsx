/**
 * Admin Business Accounts Page
 * List and manage all business accounts
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BusinessAccountsTable } from './components/business-accounts-table';
import { AdminLayout } from '@/components/layout/admin-layout';
import { AnimatedPage } from '@/components/layout/animated-page';

export const metadata: Metadata = {
  title: 'Business Accounts | Admin Portal',
  description: 'Manage B2B business accounts',
};

export default async function AdminBusinessAccountsPage() {
  const supabase = await createClient();

  // Get all business accounts
  const { data: businessAccounts } = await supabase
    .from('business_accounts')
    .select(
      `
      id,
      business_name,
      business_email,
      business_phone,
      contact_person_name,
      subdomain,
      custom_domain,
      custom_domain_verified,
      wallet_balance,
      status,
      created_at
    `
    )
    .order('created_at', { ascending: false });

  // Get booking counts for each business
  const { data: bookingCounts } = await supabase.rpc('get_business_booking_counts');

  // Merge booking counts with business accounts
  const accountsWithCounts = (businessAccounts || []).map((account) => {
    const counts = bookingCounts?.find((c: any) => c.business_account_id === account.id);
    return {
      ...account,
      total_bookings: counts?.total_bookings || 0,
    };
  });

  return (
    <AdminLayout>
      <AnimatedPage>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Business Accounts</h1>
              <p className="text-muted-foreground">Manage B2B business accounts</p>
            </div>
          </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountsWithCounts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accountsWithCounts.filter((a) => a.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verified Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accountsWithCounts.filter((a) => a.custom_domain_verified).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accountsWithCounts.reduce((sum, a) => sum + a.total_bookings, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

          {/* Business Accounts Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Business Accounts</CardTitle>
              <CardDescription>View and manage business accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessAccountsTable accounts={accountsWithCounts} />
            </CardContent>
          </Card>
        </div>
      </AnimatedPage>
    </AdminLayout>
  );
}
