'use client';

/**
 * Transactions Statistics Component
 * Displays comprehensive transaction statistics
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Activity, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/currency-converter';

interface TransactionsStatsProps {
  businessAccountId: string;
  filters: any;
  onClose: () => void;
}

interface Statistics {
  total_transactions: number;
  total_credits: number;
  total_debits: number;
  net_amount: number;
  average_transaction: number;
  largest_credit: number;
  largest_debit: number;
  by_type?: Record<string, { count: number; total_amount: number }>;
  by_currency?: Record<string, { count: number; total_amount: number }>;
}

export function TransactionsStats({ businessAccountId, filters, onClose }: TransactionsStatsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics | null>(null);

  useEffect(() => {
    loadStatistics();
  }, [filters]);

  const loadStatistics = async () => {
    try {
      setIsLoading(true);

      // Build query params
      const params = new URLSearchParams();

      if (filters.start_date) params.set('start_date', filters.start_date);
      if (filters.end_date) params.set('end_date', filters.end_date);
      if (filters.transaction_type) params.set('transaction_types', filters.transaction_type);
      if (filters.min_amount !== undefined) params.set('min_amount', String(filters.min_amount));
      if (filters.max_amount !== undefined) params.set('max_amount', String(filters.max_amount));
      if (filters.currency) params.set('currency', filters.currency);

      const response = await fetch(`/api/business/wallet/transactions/stats?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load statistics');
      }

      setStatistics(data.statistics);
    } catch (error) {
      console.error('Error loading statistics:', error);
      toast.error('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return null;
  }

  const getDefaultCurrency = () => {
    if (statistics.by_currency) {
      const currencies = Object.keys(statistics.by_currency);
      return currencies[0] || 'USD';
    }
    return 'USD';
  };

  const currency = filters.currency || getDefaultCurrency();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction Statistics</CardTitle>
            <CardDescription>
              Overview of your wallet activity
              {(filters.start_date || filters.end_date) && ' for selected period'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Transactions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{statistics.total_transactions}</p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          {/* Total Credits */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(statistics.total_credits, currency)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Total Debits */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Debits</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(statistics.total_debits, currency)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          {/* Net Amount */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Amount</p>
                  <p
                    className={`text-2xl font-bold ${
                      statistics.net_amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(statistics.net_amount, currency)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Average Transaction</p>
              <p className="text-xl font-bold">
                {formatCurrency(statistics.average_transaction, currency)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Largest Credit</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(statistics.largest_credit, currency)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Largest Debit</p>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(statistics.largest_debit, currency)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown by Type */}
        {statistics.by_type && Object.keys(statistics.by_type).length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Breakdown by Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(statistics.by_type).map(([type, data]) => (
                <Card key={type}>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground capitalize">
                      {type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-lg font-bold">{data.count}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(data.total_amount, currency)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Breakdown by Currency */}
        {statistics.by_currency && Object.keys(statistics.by_currency).length > 1 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Breakdown by Currency</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(statistics.by_currency).map(([curr, data]) => (
                <Card key={curr}>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">{curr}</p>
                    <p className="text-lg font-bold">{data.count} transactions</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(data.total_amount, curr)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
