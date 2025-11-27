'use client';

/**
 * Auto-Recharge History Component
 * Displays auto-recharge attempts with filtering and statistics
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { formatCurrency } from '@/lib/utils/currency-converter';
import { format } from 'date-fns';

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
      succeeded: { variant: 'default' as const, icon: CheckCircle2, text: 'Succeeded' },
      failed: { variant: 'destructive' as const, icon: XCircle, text: 'Failed' },
      pending: { variant: 'secondary' as const, icon: Clock, text: 'Pending' },
      processing: { variant: 'secondary' as const, icon: Loader2, text: 'Processing' },
      cancelled: { variant: 'outline' as const, icon: Ban, text: 'Cancelled' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1.5">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(statistics.currentMonthTotal, 'USD')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statistics.currentMonthCount} recharges
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Succeeded</p>
                <p className="text-2xl font-bold text-[var(--business-success)]">{statistics.succeeded}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-[var(--business-error)]">{statistics.failed}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-[var(--business-warning)]">
                  {statistics.pending + statistics.processing}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <CardTitle>Recharge History</CardTitle>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>View all automatic wallet recharge attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No auto-recharge attempts found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(attempt.status)}
                      <span className="font-medium">
                        {attempt.actual_recharged_amount
                          ? formatCurrency(attempt.actual_recharged_amount, attempt.currency)
                          : formatCurrency(attempt.requested_amount, attempt.currency)}
                      </span>
                      {attempt.retry_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Retry {attempt.retry_count}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>Triggered at balance: {formatCurrency(attempt.trigger_balance, attempt.currency)}</span>
                      <span className="mx-2">•</span>
                      <span>{format(new Date(attempt.created_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    {attempt.error_message && (
                      <p className="text-sm text-destructive">{attempt.error_message}</p>
                    )}
                    {attempt.stripe_payment_intent_id && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {attempt.stripe_payment_intent_id}
                      </p>
                    )}
                  </div>

                  {/* Cancel button for pending/processing attempts */}
                  {(attempt.status === 'pending' || attempt.status === 'processing') && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cancellingId === attempt.id}
                        >
                          {cancellingId === attempt.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Cancel'
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Auto-Recharge?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will cancel the pending auto-recharge attempt. Your wallet will not be
                            recharged.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep It</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleCancel(attempt.id)}>
                            Cancel Recharge
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
