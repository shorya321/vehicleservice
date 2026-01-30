'use client';

/**
 * Audit Log Modal Component
 * Displays admin wallet action history with filtering
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/currency-converter';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  business_account_id: string;
  business_name: string;
  admin_user_id: string;
  admin_email: string;
  action_type: string;
  amount: number | null;
  currency: string;
  reason: string;
  previous_balance: number;
  new_balance: number;
  metadata: Record<string, any>;
  created_at: string;
}

interface AuditLogModalProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
}

export function AuditLogModal({
  open,
  onClose,
  businessId,
  businessName,
}: AuditLogModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    has_more: false,
  });

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionType, setActionType] = useState('all');

  const loadAuditLog = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('limit', String(pagination.limit));
      params.set('offset', String(pagination.offset));

      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      if (actionType !== 'all') params.set('action_types', actionType);

      const response = await fetch(
        `/api/admin/businesses/${businessId}/wallet/audit?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load audit log');
      }

      setAuditLogs(data.data.audit_logs || []);
      setPagination(prev => ({
        ...prev,
        total: data.data.pagination.total,
        has_more: data.data.pagination.has_more,
      }));
    } catch (error) {
      console.error('Error loading audit log:', error);
      toast.error('Failed to load audit log');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, pagination.limit, pagination.offset, startDate, endDate, actionType]);

  useEffect(() => {
    if (open) {
      loadAuditLog();
    }
  }, [open, pagination.offset, startDate, endDate, actionType, loadAuditLog]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setActionType('all');
    setPagination({ ...pagination, offset: 0 });
  };

  const handlePreviousPage = () => {
    setPagination({
      ...pagination,
      offset: Math.max(0, pagination.offset - pagination.limit),
    });
  };

  const handleNextPage = () => {
    if (pagination.has_more) {
      setPagination({
        ...pagination,
        offset: pagination.offset + pagination.limit,
      });
    }
  };

  const getActionBadge = (actionType: string) => {
    const types: Record<string, { variant: any; label: string }> = {
      manual_credit: { variant: 'default', label: 'Manual Credit' },
      manual_debit: { variant: 'destructive', label: 'Manual Debit' },
      freeze_wallet: { variant: 'destructive', label: 'Wallet Frozen' },
      unfreeze_wallet: { variant: 'default', label: 'Wallet Unfrozen' },
      set_spending_limits: { variant: 'secondary', label: 'Limits Set' },
      remove_spending_limits: { variant: 'outline', label: 'Limits Removed' },
      override_limit: { variant: 'secondary', label: 'Limit Override' },
    };

    const config = types[actionType] || { variant: 'outline' as const, label: actionType };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <History className="mr-2 h-5 w-5" />
            Wallet Audit Log
          </DialogTitle>
          <DialogDescription>
            Admin action history for {businessName}&apos;s wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label htmlFor="startDate" className="text-xs">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex-1 min-w-[200px] space-y-2">
              <Label htmlFor="endDate" className="text-xs">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex-1 min-w-[200px] space-y-2">
              <Label htmlFor="actionType" className="text-xs">
                Action Type
              </Label>
              <Select value={actionType} onValueChange={setActionType} disabled={isLoading}>
                <SelectTrigger id="actionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="manual_credit">Manual Credit</SelectItem>
                  <SelectItem value="manual_debit">Manual Debit</SelectItem>
                  <SelectItem value="freeze_wallet">Freeze Wallet</SelectItem>
                  <SelectItem value="unfreeze_wallet">Unfreeze Wallet</SelectItem>
                  <SelectItem value="set_spending_limits">Set Limits</SelectItem>
                  <SelectItem value="remove_spending_limits">Remove Limits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(startDate || endDate || actionType !== 'all') && (
              <Button variant="outline" size="sm" onClick={handleClearFilters} disabled={isLoading}>
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Audit Log List */}
          <div className="border rounded-lg max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No audit log entries found</p>
              </div>
            ) : (
              <div className="divide-y">
                {auditLogs.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-muted/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getActionBadge(entry.action_type)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.created_at), 'PPp')}
                        </span>
                      </div>
                      {entry.amount !== null && (
                        <span
                          className={`text-sm font-bold ${
                            entry.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {entry.amount > 0 ? '+' : ''}
                          {formatCurrency(entry.amount, entry.currency)}
                        </span>
                      )}
                    </div>

                    <p className="text-sm mb-2">{entry.reason}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>By: {entry.admin_email}</span>
                      {entry.amount !== null && (
                        <>
                          <span>|</span>
                          <span>
                            Balance: {formatCurrency(entry.previous_balance, entry.currency)} →{' '}
                            {formatCurrency(entry.new_balance, entry.currency)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex items-center justify-between px-2">
              <div className="text-sm text-muted-foreground">
                Showing {pagination.offset + 1} to{' '}
                {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
                {pagination.total} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={pagination.offset === 0 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!pagination.has_more || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
