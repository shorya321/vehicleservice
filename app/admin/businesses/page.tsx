/**
 * Admin Business Accounts Page
 * List and manage all business accounts with filters and pagination
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BusinessAccountsTableWrapper } from './components/business-accounts-table-wrapper';
import { ClientFilters } from './components/client-filters';
import { AnimatedPage } from '@/components/layout/animated-page';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Building2, Clock, CheckCircle, Car } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Business Accounts | Admin Portal',
  description: 'Manage B2B business accounts',
};

interface SearchParams {
  search?: string;
  status?: string;
  domainVerified?: string;
  page?: string;
}

interface AdminBusinessAccountsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminBusinessAccountsPage({ searchParams }: AdminBusinessAccountsPageProps) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  // Parse search params
  const search = resolvedSearchParams.search || '';
  const status = resolvedSearchParams.status || '';
  const domainVerified = resolvedSearchParams.domainVerified || '';
  const page = parseInt(resolvedSearchParams.page || '1', 10);
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
          <div className="grid gap-4 md:grid-cols-4">
            <AnimatedCard delay={0.1}>
              <Card className="admin-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Total Accounts</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{totalCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">All business accounts</p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.2}>
              <Card className="admin-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Pending Approval</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                      <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">{pendingCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{pendingCount > 0 ? 'Action needed' : 'No pending'}</p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.3}>
              <Card className="admin-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Active Accounts</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">{activeCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Currently active</p>
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard delay={0.4}>
              <Card className="admin-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Total Bookings</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20">
                      <Car className="h-4 w-4 text-sky-500" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-violet-400">{totalBookings}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Across all accounts</p>
                </CardContent>
              </Card>
            </AnimatedCard>
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
  );
}
