'use client';

/**
 * Bulk Actions Bar for Business Accounts
 * Shows when businesses are selected, allows bulk operations
 */

import { useState } from 'react';
import { X, ChevronDown, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  bulkApproveBusinessesAction,
  bulkSuspendBusinessesAction,
  bulkReactivateBusinessesAction,
} from '../actions';

interface BulkActionsBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onExportCsv: () => void;
}

type BulkAction = 'approve' | 'suspend' | 'reactivate' | null;

export function BulkActionsBar({ selectedIds, onClearSelection, onExportCsv }: BulkActionsBarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction>(null);

  const handleBulkAction = async (action: BulkAction) => {
    if (!action) return;

    setIsLoading(true);
    try {
      let result;

      switch (action) {
        case 'approve':
          result = await bulkApproveBusinessesAction(selectedIds);
          break;
        case 'suspend':
          result = await bulkSuspendBusinessesAction(selectedIds);
          break;
        case 'reactivate':
          result = await bulkReactivateBusinessesAction(selectedIds);
          break;
      }

      if (result?.success) {
        toast.success('Success', {
          description: `${selectedIds.length} business${selectedIds.length > 1 ? 'es' : ''} ${action}d successfully`,
        });
        onClearSelection();
      } else {
        toast.error('Failed', {
          description: result?.error || `Failed to ${action} businesses`,
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsLoading(false);
      setPendingAction(null);
    }
  };

  const getActionConfig = (action: BulkAction) => {
    switch (action) {
      case 'approve':
        return {
          title: 'Approve Businesses',
          description: `Are you sure you want to approve ${selectedIds.length} business${selectedIds.length > 1 ? 'es' : ''}? This will activate their accounts.`,
          icon: CheckCircle,
          variant: 'default' as const,
        };
      case 'suspend':
        return {
          title: 'Suspend Businesses',
          description: `Are you sure you want to suspend ${selectedIds.length} business${selectedIds.length > 1 ? 'es' : ''}? They will lose access to their accounts.`,
          icon: AlertTriangle,
          variant: 'destructive' as const,
        };
      case 'reactivate':
        return {
          title: 'Reactivate Businesses',
          description: `Are you sure you want to reactivate ${selectedIds.length} suspended business${selectedIds.length > 1 ? 'es' : ''}?`,
          icon: CheckCircle,
          variant: 'default' as const,
        };
      default:
        return null;
    }
  };

  const actionConfig = pendingAction ? getActionConfig(pendingAction) : null;

  return (
    <>
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium">
            {selectedIds.length} business{selectedIds.length > 1 ? 'es' : ''} selected
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                Bulk Actions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPendingAction('approve')}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                Approve All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPendingAction('suspend')}>
                <AlertTriangle className="mr-2 h-4 w-4 text-orange-600" />
                Suspend All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPendingAction('reactivate')}>
                <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                Reactivate All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onExportCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {actionConfig && (
        <AlertDialog open={!!pendingAction} onOpenChange={() => setPendingAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <actionConfig.icon className="h-5 w-5" />
                {actionConfig.title}
              </AlertDialogTitle>
              <AlertDialogDescription>{actionConfig.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleBulkAction(pendingAction)}
                className={actionConfig.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
