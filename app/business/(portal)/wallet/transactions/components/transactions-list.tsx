'use client';

/**
 * Transactions List Component
 * Displays transactions in a table with pagination
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, ArrowUpCircle, ArrowDownCircle, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency-converter';
import { format } from 'date-fns';

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
  const getTransactionTypeBadge = (type: string) => {
    const types = {
      credit_added: { variant: 'default' as const, label: 'Credit Added', icon: ArrowUpCircle },
      booking_deduction: { variant: 'destructive' as const, label: 'Deduction', icon: ArrowDownCircle },
      refund: { variant: 'default' as const, label: 'Refund', icon: ArrowUpCircle },
      admin_adjustment: { variant: 'secondary' as const, label: 'Adjustment', icon: Receipt },
    };

    const config = types[type as keyof typeof types] || {
      variant: 'outline' as const,
      label: type,
      icon: Receipt,
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1.5">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No transactions found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Transactions Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Balance After</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
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
                    <p className="truncate">{transaction.description}</p>
                    {transaction.stripe_payment_intent_id && (
                      <p className="text-xs text-muted-foreground font-mono truncate mt-1">
                        {transaction.stripe_payment_intent_id}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={`font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.amount > 0 ? '+' : ''}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(transaction.balance_after, transaction.currency)}
                </TableCell>
                <TableCell>
                  {transaction.reference_id && (
                    <span className="text-xs font-mono">{transaction.reference_id.slice(0, 8)}...</span>
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
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
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
