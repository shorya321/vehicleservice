'use client';

/**
 * Transactions List Component
 * Displays transactions in a table with pagination
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, ArrowUpCircle, ArrowDownCircle, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency-converter';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
}

interface TransactionsListProps {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export function TransactionsList({ transactions, pagination, onPageChange }: TransactionsListProps) {
  // Transaction type badges with semantic colors
  const getTransactionTypeBadge = (type: string) => {
    const types = {
      credit_added: { className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', label: 'Credit Added', icon: ArrowUpCircle },
      booking_deduction: { className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30', label: 'Deduction', icon: ArrowDownCircle },
      refund: { className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', label: 'Refund', icon: ArrowUpCircle },
      admin_adjustment: { className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30', label: 'Adjustment', icon: Receipt },
    };

    const config = types[type as keyof typeof types] || {
      className: 'bg-muted text-muted-foreground border-border',
      label: type,
      icon: Receipt,
    };
    const Icon = config.icon;

    return (
      <Badge className={cn('gap-1.5 border', config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center mb-4">
          <Receipt className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-foreground font-medium">No transactions found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Transactions Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Date & Time</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Description</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider text-right">Amount</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider text-right">Balance After</TableHead>
              <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className="border-border hover:bg-muted/50 transition-colors duration-200">
                <TableCell className="font-medium text-foreground">
                  <div className="flex flex-col">
                    <span>{format(new Date(transaction.created_at), 'MMM d, yyyy')}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(transaction.created_at), 'h:mm a')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{getTransactionTypeBadge(transaction.transaction_type)}</TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <p className="truncate text-muted-foreground">{transaction.description}</p>
                    {transaction.stripe_payment_intent_id && (
                      <p className="text-xs text-muted-foreground/60 font-mono truncate mt-1">
                        {transaction.stripe_payment_intent_id}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      'font-semibold',
                      transaction.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {transaction.amount > 0 ? '+' : ''}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium text-muted-foreground">
                  {formatCurrency(transaction.balance_after, transaction.currency)}
                </TableCell>
                <TableCell>
                  {transaction.reference_id && (
                    <span className="text-xs font-mono text-muted-foreground">{transaction.reference_id.slice(0, 8)}...</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
            transactions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-medium text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground disabled:opacity-30"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
