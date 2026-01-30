'use client';

/**
 * Transactions Statistics Component
 * Displays comprehensive transaction statistics
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Activity, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/currency-converter';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/business/animation/hooks';

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
  const prefersReducedMotion = useReducedMotion();

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
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      return currencies[0] || 'AED';
    }
    return 'AED';
  };

  const currency = filters.currency || getDefaultCurrency();

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Transaction Statistics
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Overview of your wallet activity
              {(filters.start_date || filters.end_date) && ' for selected period'}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Main Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Transactions - Gold */}
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { y: -2 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-xl bg-muted border border-border p-4 card-hover hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Transactions</p>
                <p className="text-2xl font-bold text-primary">
                  {statistics.total_transactions}
                </p>
              </div>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"
              >
                <Activity className="h-5 w-5 text-primary" />
              </motion.div>
            </div>
          </motion.div>

          {/* Total Credits - Green */}
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { y: -2 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-xl bg-muted border border-border p-4 card-hover hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Credits</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(statistics.total_credits, currency)}
                </p>
              </div>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"
              >
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </motion.div>
            </div>
          </motion.div>

          {/* Total Debits - Red */}
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { y: -2 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-xl bg-muted border border-border p-4 card-hover hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Debits</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(statistics.total_debits, currency)}
                </p>
              </div>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center"
              >
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </motion.div>
            </div>
          </motion.div>

          {/* Net Amount */}
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { y: -2 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-xl bg-muted border border-border p-4 card-hover hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Amount</p>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    statistics.net_amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {formatCurrency(statistics.net_amount, currency)}
                </p>
              </div>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center"
              >
                <DollarSign className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { y: -2 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-xl bg-muted border border-border p-4 card-hover hover:shadow-md transition-all"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Average Transaction</p>
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(statistics.average_transaction, currency)}
            </p>
          </motion.div>

          <motion.div
            whileHover={prefersReducedMotion ? undefined : { y: -2 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-xl bg-muted border border-border p-4 card-hover hover:shadow-md transition-all"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Largest Credit</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(statistics.largest_credit, currency)}
            </p>
          </motion.div>

          <motion.div
            whileHover={prefersReducedMotion ? undefined : { y: -2 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-xl bg-muted border border-border p-4 card-hover hover:shadow-md transition-all"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Largest Debit</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(statistics.largest_debit, currency)}
            </p>
          </motion.div>
        </div>

        {/* Breakdown by Type */}
        {statistics.by_type && Object.keys(statistics.by_type).length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Breakdown by Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(statistics.by_type).map(([type, data]) => (
                <motion.div
                  key={type}
                  whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="rounded-xl bg-muted border border-border p-3 card-hover hover:shadow-md transition-all"
                >
                  <p className="text-xs text-muted-foreground capitalize">
                    {type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {data.count}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(data.total_amount, currency)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Breakdown by Currency */}
        {statistics.by_currency && Object.keys(statistics.by_currency).length > 1 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Breakdown by Currency
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(statistics.by_currency).map(([curr, data]) => (
                <motion.div
                  key={curr}
                  whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="rounded-xl bg-muted border border-border p-3 card-hover hover:shadow-md transition-all"
                >
                  <p className="text-xs text-muted-foreground">{curr}</p>
                  <p className="text-lg font-bold text-foreground">
                    {data.count} transactions
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(data.total_amount, curr)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
