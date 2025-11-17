'use client';

/**
 * Admin Wallet Overview Component
 * Displays wallet balance, status, limits, and recent transactions
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Settings,
  History,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency-converter';
import { format } from 'date-fns';
import { AdjustWalletModal } from './adjust-wallet-modal';
import { FreezeWalletModal } from './freeze-wallet-modal';
import { SpendingLimitsModal } from './spending-limits-modal';
import { AuditLogModal } from './audit-log-modal';

interface WalletData {
  business: {
    id: string;
    name: string;
    created_at: string;
  };
  wallet: {
    balance: number;
    currency: string;
    frozen: boolean;
    frozen_at: string | null;
    frozen_reason: string | null;
    frozen_by: {
      id: string;
      name: string;
      email: string;
      frozen_at: string;
    } | null;
  };
  spending_limits: {
    enabled: boolean;
    max_transaction_amount: number | null;
    max_daily_spend: number | null;
    max_monthly_spend: number | null;
    current_spending: {
      daily: number;
      monthly: number;
      daily_remaining: number | null;
      monthly_remaining: number | null;
    } | null;
  };
  recent_transactions: Array<{
    id: string;
    created_at: string;
    transaction_type: string;
    description: string;
    amount: number;
    currency: string;
    balance_after: number;
  }>;
  statistics_30_days: {
    total_transactions: number;
    total_credits: number;
    total_debits: number;
    net_amount: number;
  } | null;
}

interface WalletOverviewProps {
  businessId: string;
  initialData: WalletData;
  onRefresh: () => void;
}

export function WalletOverview({ businessId, initialData, onRefresh }: WalletOverviewProps) {
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const { business, wallet, spending_limits, recent_transactions, statistics_30_days } = initialData;

  return (
    <div className="space-y-6">
      {/* Wallet Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Balance Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(wallet.balance, wallet.currency)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={wallet.frozen ? 'destructive' : 'default'}
                  className="mt-2"
                >
                  {wallet.frozen ? (
                    <>
                      <Lock className="mr-1 h-3 w-3" />
                      Frozen
                    </>
                  ) : (
                    <>
                      <Unlock className="mr-1 h-3 w-3" />
                      Active
                    </>
                  )}
                </Badge>
              </div>
              {wallet.frozen ? (
                <AlertTriangle className="h-8 w-8 text-destructive" />
              ) : (
                <Unlock className="h-8 w-8 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* 30-Day Credits */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">30-Day Credits</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics_30_days
                    ? formatCurrency(statistics_30_days.total_credits, wallet.currency)
                    : '$0.00'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* 30-Day Debits */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">30-Day Debits</p>
                <p className="text-2xl font-bold text-red-600">
                  {statistics_30_days
                    ? formatCurrency(statistics_30_days.total_debits, wallet.currency)
                    : '$0.00'}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Frozen Status Alert */}
      {wallet.frozen && wallet.frozen_by && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <Lock className="mr-2 h-5 w-5" />
              Wallet Frozen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Frozen by:</span> {wallet.frozen_by.name} (
              {wallet.frozen_by.email})
            </p>
            <p className="text-sm">
              <span className="font-medium">Frozen at:</span>{' '}
              {format(new Date(wallet.frozen_by.frozen_at), 'PPpp')}
            </p>
            {wallet.frozen_reason && (
              <p className="text-sm">
                <span className="font-medium">Reason:</span> {wallet.frozen_reason}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Spending Limits */}
      {spending_limits.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Spending Limits
            </CardTitle>
            <CardDescription>Active spending restrictions for this account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Per Transaction Limit */}
              {spending_limits.max_transaction_amount && (
                <div>
                  <p className="text-sm text-muted-foreground">Max Per Transaction</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(spending_limits.max_transaction_amount, wallet.currency)}
                  </p>
                </div>
              )}

              {/* Daily Limit */}
              {spending_limits.max_daily_spend && (
                <div>
                  <p className="text-sm text-muted-foreground">Daily Limit</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(spending_limits.max_daily_spend, wallet.currency)}
                  </p>
                  {spending_limits.current_spending && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Used: {formatCurrency(spending_limits.current_spending.daily, wallet.currency)} |
                      Remaining:{' '}
                      {formatCurrency(
                        spending_limits.current_spending.daily_remaining || 0,
                        wallet.currency
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* Monthly Limit */}
              {spending_limits.max_monthly_spend && (
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Limit</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(spending_limits.max_monthly_spend, wallet.currency)}
                  </p>
                  {spending_limits.current_spending && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Used:{' '}
                      {formatCurrency(spending_limits.current_spending.monthly, wallet.currency)} |
                      Remaining:{' '}
                      {formatCurrency(
                        spending_limits.current_spending.monthly_remaining || 0,
                        wallet.currency
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Actions</CardTitle>
          <CardDescription>Manage wallet balance, status, and limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowAdjustModal(true)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Adjust Balance
            </Button>

            {wallet.frozen ? (
              <Button variant="outline" onClick={() => setShowFreezeModal(true)}>
                <Unlock className="mr-2 h-4 w-4" />
                Unfreeze Wallet
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => setShowFreezeModal(true)}>
                <Lock className="mr-2 h-4 w-4" />
                Freeze Wallet
              </Button>
            )}

            <Button variant="outline" onClick={() => setShowLimitsModal(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Configure Limits
            </Button>

            <Button variant="outline" onClick={() => setShowAuditModal(true)}>
              <History className="mr-2 h-4 w-4" />
              View Audit Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Last 10 wallet transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {recent_transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No transactions found</p>
          ) : (
            <div className="space-y-3">
              {recent_transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(transaction.created_at), 'PPp')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Balance: {formatCurrency(transaction.balance_after, transaction.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AdjustWalletModal
        open={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        businessId={businessId}
        businessName={business.name}
        currentBalance={wallet.balance}
        currency={wallet.currency}
        onSuccess={() => {
          setShowAdjustModal(false);
          onRefresh();
        }}
      />

      <FreezeWalletModal
        open={showFreezeModal}
        onClose={() => setShowFreezeModal(false)}
        businessId={businessId}
        businessName={business.name}
        isFrozen={wallet.frozen}
        onSuccess={() => {
          setShowFreezeModal(false);
          onRefresh();
        }}
      />

      <SpendingLimitsModal
        open={showLimitsModal}
        onClose={() => setShowLimitsModal(false)}
        businessId={businessId}
        businessName={business.name}
        currentLimits={spending_limits}
        currency={wallet.currency}
        onSuccess={() => {
          setShowLimitsModal(false);
          onRefresh();
        }}
      />

      <AuditLogModal
        open={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        businessId={businessId}
        businessName={business.name}
      />
    </div>
  );
}
