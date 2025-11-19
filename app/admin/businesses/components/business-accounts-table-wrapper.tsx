'use client';

/**
 * Business Accounts Table Wrapper
 * Manages selection state, pagination, and CSV export
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessAccountsTable } from './business-accounts-table';
import { BulkActionsBar } from './bulk-actions-bar';

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

interface BusinessAccountsTableWrapperProps {
  accounts: BusinessAccount[];
  currentPage: number;
  totalPages: number;
}

export function BusinessAccountsTableWrapper({
  accounts,
  currentPage,
  totalPages,
}: BusinessAccountsTableWrapperProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    router.push(`/admin/businesses?${params.toString()}`);
  };

  const handleExportCsv = () => {
    // Get selected businesses
    const selectedBusinesses = accounts.filter((account) => selectedIds.includes(account.id));

    // Create CSV header
    const headers = [
      'Business Name',
      'Email',
      'Phone',
      'Contact Person',
      'Subdomain',
      'Custom Domain',
      'Domain Verified',
      'Wallet Balance',
      'Status',
      'Total Bookings',
      'Created At',
    ];

    // Create CSV rows
    const rows = selectedBusinesses.map((account) => [
      account.business_name,
      account.business_email,
      account.business_phone,
      account.contact_person_name,
      account.subdomain,
      account.custom_domain || 'N/A',
      account.custom_domain_verified ? 'Yes' : 'No',
      account.wallet_balance.toString(),
      account.status,
      account.total_bookings.toString(),
      new Date(account.created_at).toLocaleDateString(),
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `business-accounts-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          onExportCsv={handleExportCsv}
        />
      )}

      {/* Table */}
      <BusinessAccountsTable
        accounts={accounts}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
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
