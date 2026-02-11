'use client';

/**
 * Transactions Content Component
 * Main client component for transaction management with filtering, search, and export
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionFilters } from './transaction-filters';
import { TransactionsList } from './transactions-list';
import { TransactionsStats } from './transactions-stats';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CurrencyCode } from '@/lib/utils/currency-converter';

interface Transaction {
  id: string;
  created_at: string;
  transaction_type: string;
  description: string;
  amount: number;
  currency: string;
  balance_after: number;
  reference_id: string | null;
  stripe_payment_intent_id: string | null;
  created_by: string | null;
  original_amount: number | null;
  original_currency: string | null;
  exchange_rate: number | null;
}

interface TransactionFiltersState {
  transaction_type?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  currency?: string;
  search?: string;
  page: number;
  limit: number;
}

interface TransactionsContentProps {
  businessAccountId: string;
  currency: CurrencyCode;
  businessName: string;
}

export function TransactionsContent({
  businessAccountId,
  currency,
  businessName,
}: TransactionsContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState<TransactionFiltersState>({
    page: 1,
    limit: 50,
  });

  const [showStats, setShowStats] = useState(true);

  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);

      // Build query params
      const params = new URLSearchParams();
      params.set('page', String(filters.page));
      params.set('limit', String(filters.limit));

      if (filters.transaction_type) params.set('transaction_type', filters.transaction_type);
      if (filters.start_date) params.set('start_date', filters.start_date);
      if (filters.end_date) params.set('end_date', filters.end_date);
      if (filters.min_amount !== undefined) params.set('min_amount', String(filters.min_amount));
      if (filters.max_amount !== undefined) params.set('max_amount', String(filters.max_amount));
      if (filters.currency) params.set('currency', filters.currency);
      if (filters.search) params.set('search', filters.search);

      const response = await fetch(`/api/business/wallet/transactions?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load transactions');
      }

      // Unwrap the { data } wrapper from apiSuccess()
      const { data } = result;
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Load transactions
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleFilterChange = (newFilters: Partial<TransactionFiltersState>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleExport = async () => {
    try {
      toast.info('Preparing export...');

      // Build query params
      const params = new URLSearchParams();

      if (filters.transaction_type) params.set('transaction_types', filters.transaction_type);
      if (filters.start_date) params.set('start_date', filters.start_date);
      if (filters.end_date) params.set('end_date', filters.end_date);
      if (filters.currency) params.set('currency', filters.currency);
      params.set('limit', '10000'); // Max export limit

      const response = await fetch(`/api/business/wallet/transactions/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to export transactions');
      }

      // Get the CSV content
      const blob = await response.blob();

      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'transactions.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Transactions exported successfully');
    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast.error('Failed to export transactions');
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      {showStats && (
        <TransactionsStats
          businessAccountId={businessAccountId}
          filters={filters}
          onClose={() => setShowStats(false)}
        />
      )}

      {/* Filters and Controls */}
      <TransactionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        defaultCurrency={currency}
      />

      {/* Transactions List */}
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Transaction History
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {pagination.total} transactions found
            {filters.search && ` matching "${filters.search}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <TransactionsList
              transactions={transactions}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
