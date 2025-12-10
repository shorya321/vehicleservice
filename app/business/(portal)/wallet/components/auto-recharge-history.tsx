'use client';

/**
 * Auto-Recharge History Component
 * Displays auto-recharge attempts with filtering and statistics
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/business/(portal)/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, History, TrendingUp, CheckCircle2, XCircle, Clock, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency-converter';
import { format } from 'date-fns';
import { staggerContainer, staggerItem } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';

interface AutoRechargeAttempt {
  id: string;
  trigger_balance: number;
  requested_amount: number;
  actual_recharged_amount?: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  error_message?: string;
  retry_count: number;
  created_at: string;
  processed_at?: string;
  stripe_payment_intent_id?: string;
}

interface Statistics {
  total: number;
  succeeded: number;
  failed: number;
  pending: number;
  processing: number;
  currentMonthTotal: number;
  currentMonthCount: number;
}

export function AutoRechargeHistory() {
  const prefersReducedMotion = useReducedMotion();
  const [isLoading, setIsLoading] = useState(true);
  const [attempts, setAttempts] = useState<AutoRechargeAttempt[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [statusFilter]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      params.set('limit', '50');

      const response = await fetch(`/api/business/wallet/auto-recharge/history?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load history');
      }

      // API wraps response in { data: { attempts, statistics } }
      const { attempts, statistics } = result.data;
      setAttempts(attempts || []);
      setStatistics(statistics || null);
    } catch (error) {
      console.error('Error loading auto-recharge history:', error);
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (attemptId: string) => {
    try {
      setCancellingId(attemptId);

      const response = await fetch('/api/business/wallet/auto-recharge/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel attempt');
      }

      toast.success('Auto-recharge attempt cancelled');
      loadHistory();
    } catch (error) {
      console.error('Error cancelling attempt:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel attempt');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: AutoRechargeAttempt['status']) => {
    const variants = {
      succeeded: { className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', icon: CheckCircle2, text: 'Succeeded' },
      failed: { className: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: XCircle, text: 'Failed' },
      pending: { className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', icon: Clock, text: 'Pending' },
      processing: { className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400', icon: Loader2, text: 'Processing' },
      cancelled: { className: 'bg-muted text-muted-foreground', icon: Ban, text: 'Cancelled' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge
        variant="outline"
        className={cn('gap-1.5 border-0', config.className)}
      >
        <Icon className={cn('h-3 w-3', status === 'processing' && 'animate-spin')} />
        {config.text}
      </Badge>
    );
  };

  // Mini stat card for statistics row - Matching Bookings Page Pattern
  const MiniStatCard = ({
    label,
    value,
    accentColorClass = 'border-l-primary text-primary',
    subtext,
    icon: Icon,
  }: {
    label: string;
    value: string | number;
    accentColorClass?: string;
    subtext?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }) => {
    const [borderClass, textClass] = accentColorClass.split(' ');
    // Derive background color from border class for icon container
    const bgClass = borderClass
      .replace('border-l-', 'bg-')
      .replace('-500', '-500/10')
      .replace('-primary', '-primary/10');
    const darkBgClass = borderClass
      .replace('border-l-', 'dark:bg-')
      .replace('-500', '-500/20')
      .replace('-primary', '-primary/20');
    // Derive dark mode text color
    const darkTextClass = textClass
      .replace('-600', '-400')
      .replace('text-primary', 'text-primary');

    return (
      <div
        className={cn(
          'group relative overflow-hidden rounded-xl bg-card p-5',
          'border-l-4 border border-border',
          borderClass,
          'shadow-sm hover:shadow-md transition-all duration-200'
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              {label}
            </p>
            <p className={cn('text-3xl font-bold tracking-tight', textClass, `dark:${darkTextClass}`)}>
              {value}
            </p>
            {subtext && (
              <p className="text-xs text-muted-foreground mt-2">{subtext}</p>
            )}
          </div>
          {Icon && (
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-full', bgClass, darkBgClass)}>
              <Icon className={cn('h-5 w-5', textClass, `dark:${darkTextClass}`)} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const AttemptRow = ({ attempt }: { attempt: AutoRechargeAttempt }) => {
    const content = (
      <div
        className={cn(
          'flex items-center justify-between',
          'rounded-xl p-4',
          'bg-muted',
          'border border-border',
          'transition-all duration-200',
          'hover:bg-primary/5 hover:border-primary/20'
        )}
      >
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            {getStatusBadge(attempt.status)}
            <span className="font-semibold text-foreground">
              {attempt.actual_recharged_amount
                ? formatCurrency(attempt.actual_recharged_amount, attempt.currency)
                : formatCurrency(attempt.requested_amount, attempt.currency)}
            </span>
            {attempt.retry_count > 0 && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                Retry {attempt.retry_count}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            <span>
              Triggered at: {formatCurrency(attempt.trigger_balance, attempt.currency)}
            </span>
            <span className="mx-2 text-muted-foreground/50">•</span>
            <span>{format(new Date(attempt.created_at), 'MMM d, yyyy h:mm a')}</span>
          </div>
          {attempt.error_message && (
            <p className="text-sm text-red-600 dark:text-red-400">{attempt.error_message}</p>
          )}
          {attempt.stripe_payment_intent_id && (
            <p className="text-xs text-muted-foreground font-mono truncate">
              {attempt.stripe_payment_intent_id}
            </p>
          )}
        </div>

        {/* Cancel button for pending/processing attempts */}
        {(attempt.status === 'pending' || attempt.status === 'processing') && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={cancellingId === attempt.id}
                className="ml-4 flex-shrink-0 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10"
              >
                {cancellingId === attempt.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Cancel'
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">
                  Cancel Auto-Recharge?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will cancel the pending auto-recharge attempt. Your wallet will not be
                  recharged.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                  Keep It
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleCancel(attempt.id)}
                  className="bg-red-600 text-white hover:bg-red-600/90"
                >
                  Cancel Recharge
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );

    if (prefersReducedMotion) {
      return content;
    }

    return <motion.div variants={staggerItem}>{content}</motion.div>;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStatCard
            label="This Month"
            value={formatCurrency(statistics.currentMonthTotal, 'USD')}
            subtext={`${statistics.currentMonthCount} recharges`}
            accentColorClass="border-l-primary text-primary"
            icon={TrendingUp}
          />
          <MiniStatCard
            label="Succeeded"
            value={statistics.succeeded}
            accentColorClass="border-l-emerald-500 text-emerald-600"
            icon={CheckCircle2}
          />
          <MiniStatCard
            label="Failed"
            value={statistics.failed}
            accentColorClass="border-l-red-500 text-red-600"
            icon={XCircle}
          />
          <MiniStatCard
            label="Pending"
            value={statistics.pending + statistics.processing}
            icon={Clock}
            accentColorClass="border-l-border text-muted-foreground"
          />
        </div>
      )}

      {/* History Card */}
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <History className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              Recharge History
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-muted border-border focus:border-primary focus:ring-primary/20 text-foreground">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-foreground focus:bg-primary/10 focus:text-foreground">All Statuses</SelectItem>
                <SelectItem value="succeeded" className="text-foreground focus:bg-primary/10 focus:text-foreground">Succeeded</SelectItem>
                <SelectItem value="failed" className="text-foreground focus:bg-primary/10 focus:text-foreground">Failed</SelectItem>
                <SelectItem value="pending" className="text-foreground focus:bg-primary/10 focus:text-foreground">Pending</SelectItem>
                <SelectItem value="processing" className="text-foreground focus:bg-primary/10 focus:text-foreground">Processing</SelectItem>
                <SelectItem value="cancelled" className="text-foreground focus:bg-primary/10 focus:text-foreground">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            View all automatic wallet recharge attempts
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center mb-4">
                <History className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground">No auto-recharge attempts found</p>
            </div>
          ) : prefersReducedMotion ? (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <AttemptRow key={attempt.id} attempt={attempt} />
              ))}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {attempts.map((attempt) => (
                <AttemptRow key={attempt.id} attempt={attempt} />
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
