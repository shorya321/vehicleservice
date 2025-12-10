'use client';

/**
 * Transaction History Component
 * Premium timeline-style transaction list with color-coded accents
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Receipt, RefreshCw, Settings } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  formatCurrency,
  formatTransactionAmount,
  getTransactionTypeLabel,
} from '@/lib/business/wallet-operations';
import { staggerContainer, staggerItem } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'credit_added' | 'booking_deduction' | 'refund' | 'admin_adjustment';
  description: string | null;
  balance_after: number;
  created_at: string;
  created_by?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

// Get transaction icon based on type
function getTransactionIcon(type: string, isCredit: boolean) {
  switch (type) {
    case 'refund':
      return <RefreshCw className="h-4 w-4" />;
    case 'admin_adjustment':
      return <Settings className="h-4 w-4" />;
    default:
      return isCredit ? (
        <ArrowUp className="h-4 w-4" />
      ) : (
        <ArrowDown className="h-4 w-4" />
      );
  }
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center mb-4">
          <Receipt className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No transactions yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your wallet transaction history will appear here
        </p>
      </div>
    );
  }

  const TransactionRow = ({ transaction, index }: { transaction: Transaction; index: number }) => {
    const isCredit = transaction.amount > 0;
    const relativeTime = formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true });
    const fullDate = format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a');

    const content = (
      <div
        className={cn(
          'relative',
          // Timeline accent border
          isCredit ? 'border-l-2 border-l-emerald-500' : 'border-l-2 border-l-red-500',
          // Row styling
          'rounded-lg py-3 pr-3 pl-3',
          'transition-all duration-300',
          'hover:bg-muted/50',
          'group'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon with colored background */}
            <div
              className={cn(
                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
                'transition-transform duration-300',
                'group-hover:scale-105',
                isCredit
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              )}
            >
              {getTransactionIcon(transaction.transaction_type, isCredit)}
            </div>

            {/* Transaction Details */}
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">
                {getTransactionTypeLabel(transaction.transaction_type)}
              </p>
              {transaction.description && (
                <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-none">
                  {transaction.description}
                </p>
              )}
              {/* Time with tooltip for full date */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground/70 mt-0.5 cursor-help">
                      {relativeTime}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-popover border-border text-popover-foreground"
                  >
                    {fullDate}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Amount Display */}
          <div className="text-right flex-shrink-0 ml-4">
            <p
              className={cn(
                'text-base font-semibold tabular-nums',
                isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {isCredit ? '+' : ''}{formatTransactionAmount(transaction.amount)}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatCurrency(transaction.balance_after)}
            </p>
          </div>
        </div>
      </div>
    );

    if (prefersReducedMotion) {
      return <div className="border-b border-border last:border-0">{content}</div>;
    }

    return (
      <motion.div
        variants={staggerItem}
        className="border-b border-border last:border-0"
        custom={index}
      >
        {content}
      </motion.div>
    );
  };

  if (prefersReducedMotion) {
    return (
      <div className="space-y-0">
        {transactions.map((transaction, index) => (
          <TransactionRow key={transaction.id} transaction={transaction} index={index} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-0"
    >
      {transactions.map((transaction, index) => (
        <TransactionRow key={transaction.id} transaction={transaction} index={index} />
      ))}
    </motion.div>
  );
}
