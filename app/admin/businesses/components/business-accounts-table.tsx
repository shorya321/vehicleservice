'use client';

/**
 * Business Accounts Table Component
 * Display business accounts in admin portal with selection and actions
 */

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Building2, MoreHorizontal, CheckCircle, XCircle, AlertTriangle, PauseCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { toast } from 'sonner';
import {
  quickApproveBusinessAction,
  quickRejectBusinessAction,
  quickSuspendBusinessAction,
  quickReactivateBusinessAction,
} from '../actions';

interface BusinessAccount {
  id: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  contact_person_name: string;
  subdomain: string;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  wallet_balance: number;
  status: string;
  total_bookings: number;
  created_at: string;
}

interface BusinessAccountsTableProps {
  accounts: BusinessAccount[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; variant: any }> = {
    pending: { label: 'Pending Approval', variant: 'default' },
    active: { label: 'Active', variant: 'success' },
    suspended: { label: 'Suspended', variant: 'destructive' },
    inactive: { label: 'Inactive', variant: 'secondary' },
    rejected: { label: 'Rejected', variant: 'destructive' },
  };

  const config = statusConfig[status] || { label: status, variant: 'outline' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

type QuickAction = 'approve' | 'reject' | 'suspend' | 'reactivate' | null;

export function BusinessAccountsTable({ accounts, selectedIds, onSelectionChange }: BusinessAccountsTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    action: QuickAction;
    businessId: string;
    businessName: string;
  } | null>(null);

  const isAllSelected = accounts.length > 0 && selectedIds.length === accounts.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < accounts.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(accounts.map((a) => a.id));
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleQuickAction = async () => {
    if (!pendingAction) return;

    const { action, businessId, businessName } = pendingAction;
    setActionLoading(businessId);

    try {
      let result;

      switch (action) {
        case 'approve':
          result = await quickApproveBusinessAction(businessId);
          break;
        case 'reject':
          result = await quickRejectBusinessAction(businessId);
          break;
        case 'suspend':
          result = await quickSuspendBusinessAction(businessId);
          break;
        case 'reactivate':
          result = await quickReactivateBusinessAction(businessId);
          break;
      }

      if (result?.success) {
        toast.success('Success', {
          description: `${businessName} has been ${action}d`,
        });
      } else {
        toast.error('Failed', {
          description: result?.error || `Failed to ${action} business`,
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setActionLoading(null);
      setPendingAction(null);
    }
  };

  const getAvailableActions = (status: string): QuickAction[] => {
    switch (status) {
      case 'pending':
        return ['approve', 'reject'];
      case 'active':
        return ['suspend'];
      case 'suspended':
        return ['reactivate'];
      default:
        return [];
    }
  };

  const getActionConfig = (action: QuickAction) => {
    switch (action) {
      case 'approve':
        return {
          label: 'Approve',
          icon: CheckCircle,
          className: 'text-green-600',
          title: 'Approve Business',
          description: 'This will activate the business account and allow them to login.',
        };
      case 'reject':
        return {
          label: 'Reject',
          icon: XCircle,
          className: 'text-red-600',
          title: 'Reject Business',
          description: 'This will reject the business application. They will not be able to login.',
        };
      case 'suspend':
        return {
          label: 'Suspend',
          icon: PauseCircle,
          className: 'text-orange-600',
          title: 'Suspend Business',
          description: 'This will suspend the business account. They will lose access immediately.',
        };
      case 'reactivate':
        return {
          label: 'Reactivate',
          icon: CheckCircle,
          className: 'text-blue-600',
          title: 'Reactivate Business',
          description: 'This will reactivate the suspended business account.',
        };
      default:
        return null;
    }
  };

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No business accounts yet</h3>
        <p className="text-sm text-muted-foreground">
          Business accounts will appear here once registered
        </p>
      </div>
    );
  }

  const currentActionConfig = pendingAction ? getActionConfig(pendingAction.action) : null;

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className={isSomeSelected ? 'data-[state=checked]:bg-muted' : ''}
                />
              </TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => {
              const availableActions = getAvailableActions(account.status);
              const isSelected = selectedIds.includes(account.id);
              const isLoading = actionLoading === account.id;

              return (
                <TableRow key={account.id} className={isSelected ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectRow(account.id)}
                      aria-label={`Select ${account.business_name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{account.business_name}</p>
                      <p className="text-xs text-muted-foreground">{account.subdomain}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{account.contact_person_name}</p>
                      <p className="text-xs text-muted-foreground">{account.business_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {account.custom_domain ? (
                      <div>
                        <p className="text-sm">{account.custom_domain}</p>
                        {account.custom_domain_verified && (
                          <Badge variant="outline" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(account.wallet_balance)}
                  </TableCell>
                  <TableCell>{account.total_bookings}</TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(account.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isLoading}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* View Details - Always Available */}
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/businesses/${account.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>

                        {/* Status-specific Quick Actions */}
                        {availableActions.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                            {availableActions.map((action) => {
                              const config = getActionConfig(action);
                              if (!config) return null;

                              return (
                                <DropdownMenuItem
                                  key={action}
                                  onClick={() =>
                                    setPendingAction({
                                      action,
                                      businessId: account.id,
                                      businessName: account.business_name,
                                    })
                                  }
                                >
                                  <config.icon className={`mr-2 h-4 w-4 ${config.className}`} />
                                  {config.label}
                                </DropdownMenuItem>
                              );
                            })}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      {currentActionConfig && pendingAction && (
        <AlertDialog open={!!pendingAction} onOpenChange={() => setPendingAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <currentActionConfig.icon className="h-5 w-5" />
                {currentActionConfig.title}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {currentActionConfig.description}
                <br />
                <br />
                <strong>Business: {pendingAction.businessName}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleQuickAction}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
