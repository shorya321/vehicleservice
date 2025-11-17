'use client';

/**
 * Transaction History Component
 * Displays wallet transaction history
 */

import { ArrowDown, ArrowUp, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import {
  formatCurrency,
  formatTransactionAmount,
  getTransactionTypeLabel,
  getTransactionTypeColor,
} from '@/lib/business/wallet-operations';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'credit_added' | 'booking_deduction' | 'refund' | 'admin_adjustment';
  description: string;
  balance_after: number;
  created_at: string;
  created_by: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
        <p className="text-sm text-muted-foreground">
          Your wallet transaction history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const isCredit = transaction.amount > 0;

        return (
          <div
            key={transaction.id}
            className="flex items-center justify-between border-b pb-4 last:border-0"
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isCredit ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                }`}
              >
                {isCredit ? (
                  <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>

              {/* Details */}
              <div>
                <p className="font-medium">{getTransactionTypeLabel(transaction.transaction_type)}</p>
                <p className="text-sm text-muted-foreground">{transaction.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className={`font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                {formatTransactionAmount(transaction.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                Balance: {formatCurrency(transaction.balance_after)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
