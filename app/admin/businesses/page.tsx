/**
 * Admin Business Accounts Page
 * List and manage all business accounts with filters and pagination
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BusinessAccountsTableWrapper } from './components/business-accounts-table-wrapper';
import { ClientFilters } from './components/client-filters';
import { AdminLayout } from '@/components/layout/admin-layout';
import { AnimatedPage } from '@/components/layout/animated-page';

export const metadata: Metadata = {
  title: 'Business Accounts | Admin Portal',
  description: 'Manage B2B business accounts',
};

// Force dynamic rendering for real-time data
export const dynamic = 'force-dynamic';

interface SearchParams {
  search?: string;
  status?: string;
  domainVerified?: string;
  page?: string;
}

interface AdminBusinessAccountsPageProps {
  searchParams: SearchParams;
}

export default async function AdminBusinessAccountsPage({ searchParams }: AdminBusinessAccountsPageProps) {
  const supabase = await createClient();

  // Parse search params
  const search = searchParams.search || '';
  const status = searchParams.status || '';
  const domainVerified = searchParams.domainVerified || '';
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 10;
  const offset = (page - 1) * limit;

  // Build query with filters
  let query = supabase
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
    `,
      { count: 'exact' }
    );

  // Apply filters
  if (search) {
    query = query.or(
      `business_name.ilike.%${search}%,business_email.ilike.%${search}%,subdomain.ilike.%${search}%`
    );
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (domainVerified === 'true') {
    query = query.eq('custom_domain_verified', true);
  } else if (domainVerified === 'false') {
    query = query.eq('custom_domain_verified', false);
  }

  // Execute query with pagination
  const { data: businessAccounts, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

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

  // Get stats for all accounts (not paginated)
  const { data: allAccounts } = await supabase.from('business_accounts').select('status');

  const totalCount = allAccounts?.length || 0;
  const pendingCount = allAccounts?.filter((a) => a.status === 'pending').length || 0;
  const activeCount = allAccounts?.filter((a) => a.status === 'active').length || 0;
  const totalBookings = accountsWithCounts.reduce((sum, a) => sum + a.total_bookings, 0);

  const totalPages = Math.ceil((count || 0) / limit);

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
                <div className="text-2xl font-bold">{totalCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
                  {pendingCount > 0 && (
                    <span className="text-xs font-medium text-amber-600">Action needed</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBookings}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientFilters />
            </CardContent>
          </Card>

          {/* Business Accounts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Business Accounts</CardTitle>
              <CardDescription>
                Showing {accountsWithCounts.length} of {count || 0} business{' '}
                {(count || 0) === 1 ? 'account' : 'accounts'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessAccountsTableWrapper
                accounts={accountsWithCounts}
                currentPage={page}
                totalPages={totalPages}
              />
            </CardContent>
          </Card>
        </div>
      </AnimatedPage>
    </AdminLayout>
  );
}
