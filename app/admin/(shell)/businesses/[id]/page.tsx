/**
 * Admin Business Account Details Page
 * View and manage specific business account
 */

import { getBookingTimezone } from '@/lib/utils/timezone'
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { AdjustCreditsButton } from './components/adjust-credits-button';
import { UpdateStatusButton } from './components/update-status-button';
import { ApproveButton } from './components/approve-button';
import { RejectButton } from './components/reject-button';
import { AnimatedPage } from '@/components/layout/animated-page';
import { DeleteBusinessButton } from './components/delete-business-button';
import { CustomPagination } from '@/components/ui/custom-pagination';

export const metadata: Metadata = {
  title: 'Business Account Details | Admin Portal',
  description: 'View and manage business account',
};

interface BusinessDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    txPage?: string;
  }>;
}

const TX_PAGE_SIZE = 10;

export default async function AdminBusinessDetailsPage({
  params,
  searchParams,
}: BusinessDetailsPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  // Parse the transactions page from the URL (own param so it never collides
  // with a future `page` param on this route)
  const parsedTxPage = parseInt(resolvedSearchParams.txPage || '1', 10);
  const txPage = Number.isNaN(parsedTxPage) || parsedTxPage < 1 ? 1 : parsedTxPage;
  const txOffset = (txPage - 1) * TX_PAGE_SIZE;

  // Get business account details
  const { data: businessAccount, error } = await supabase
    .from('business_accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !businessAccount) {
    notFound();
  }

  // Get business users
  const { data: businessUsers } = await supabase
    .from('business_users')
    .select('id, role, is_active, created_at')
    .eq('business_account_id', id);

  // Get recent bookings
  const { data: recentBookings } = await supabase
    .from('business_bookings')
    .select('id, booking_number, customer_name, booking_status, total_price, created_at')
    .eq('business_account_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get transactions for the current page
  const { data: recentTransactions, count: txCount } = await supabase
    .from('wallet_transactions')
    .select('id, amount, transaction_type, description, balance_after, created_at', {
      count: 'exact',
    })
    .eq('business_account_id', id)
    .order('created_at', { ascending: false })
    .range(txOffset, txOffset + TX_PAGE_SIZE - 1);

  const txTotal = txCount || 0;
  const txTotalPages = Math.ceil(txTotal / TX_PAGE_SIZE);

  // Exact booking count for the delete confirmation. Deriving it from
  // recentBookings would cap it at the query's limit and understate what the
  // delete actually destroys.
  const { count: bookingCount } = await supabase
    .from('business_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('business_account_id', id);

  return (
      <AnimatedPage>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/businesses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{businessAccount.business_name}</h1>
            <p className="text-muted-foreground">{businessAccount.business_email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Show Approve/Reject buttons for pending businesses */}
          {businessAccount.status === 'pending' && (
            <>
              <ApproveButton
                businessId={businessAccount.id}
                businessName={businessAccount.business_name}
              />
              <RejectButton
                businessId={businessAccount.id}
                businessName={businessAccount.business_name}
              />
            </>
          )}
          {/* General status update button (for manual overrides) */}
          <UpdateStatusButton
            businessId={businessAccount.id}
            currentStatus={businessAccount.status}
          />
          <AdjustCreditsButton
            businessId={businessAccount.id}
            businessName={businessAccount.business_name}
            currentBalance={businessAccount.wallet_balance}
          />
          <DeleteBusinessButton
            businessId={businessAccount.id}
            businessName={businessAccount.business_name}
            hasCustomDomain={!!businessAccount.custom_domain}
            bookingCount={bookingCount ?? 0}
          />
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={
                  businessAccount.status === 'active'
                    ? 'success'
                    : businessAccount.status === 'pending'
                    ? 'default'
                    : 'destructive'
                }
              >
                {businessAccount.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact Person</p>
              <p className="font-medium">{businessAccount.contact_person_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{businessAccount.business_phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(businessAccount.created_at).toLocaleString(undefined, { timeZone: getBookingTimezone() })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Domain Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Subdomain</p>
              <p className="font-medium">{businessAccount.subdomain}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Custom Domain</p>
              {businessAccount.custom_domain ? (
                <div className="flex items-center gap-2">
                  <p className="font-medium">{businessAccount.custom_domain}</p>
                  {businessAccount.custom_domain_verified && (
                    <Badge variant="outline">Verified</Badge>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Not configured</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            {formatCurrency(businessAccount.wallet_balance)}
          </div>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Latest 10 bookings from this business</CardDescription>
        </CardHeader>
        <CardContent>
          {!recentBookings || recentBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings yet</p>
          ) : (
            <div className="space-y-2">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{(booking as any).trip_number || booking.booking_number}</p>
                    <p className="text-sm text-muted-foreground">{booking.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(booking.total_price)}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {booking.booking_status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            {!recentTransactions || recentTransactions.length === 0
              ? 'Wallet transactions'
              : `Showing ${txOffset + 1}-${txOffset + recentTransactions.length} of ${txTotal} transactions`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!recentTransactions || recentTransactions.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {txPage > 1 ? 'No transactions on this page' : 'No transactions yet'}
              </p>
              {txPage > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/businesses/${id}`}>Back to first page</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium capitalize">{tx.transaction_type.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString(undefined, { timeZone: getBookingTimezone() })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {tx.amount >= 0 ? '+' : ''}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Balance: {formatCurrency(tx.balance_after)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {txTotalPages > 1 && (
            <div className="pt-4">
              <CustomPagination
                currentPage={txPage}
                totalPages={txTotalPages}
                paramName="txPage"
              />
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </AnimatedPage>
  );
}
