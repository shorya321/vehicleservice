'use client';

/**
 * Business Accounts Table Component
 * Display business accounts in admin portal
 */

import Link from 'next/link';
import { Eye, Building2 } from 'lucide-react';
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
import { formatCurrency } from '@/lib/business/wallet-operations';

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
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; variant: any }> = {
    active: { label: 'Active', variant: 'success' },
    suspended: { label: 'Suspended', variant: 'destructive' },
    inactive: { label: 'Inactive', variant: 'secondary' },
  };

  const config = statusConfig[status] || { label: status, variant: 'outline' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function BusinessAccountsTable({ accounts }: BusinessAccountsTableProps) {
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
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
          {accounts.map((account) => (
            <TableRow key={account.id}>
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
                  day: 'numeric'
                })}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/businesses/${account.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
