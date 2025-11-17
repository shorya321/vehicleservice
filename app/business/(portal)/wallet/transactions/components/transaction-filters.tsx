'use client';

/**
 * Transaction Filters Component
 * Advanced filtering UI for transactions
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Filter, X, Search } from 'lucide-react';
import { getCurrencyOptions, type CurrencyCode } from '@/lib/utils/currency-converter';

interface TransactionFiltersProps {
  filters: {
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
    min_amount?: number;
    max_amount?: number;
    currency?: string;
    search?: string;
  };
  onFilterChange: (filters: any) => void;
  onExport: () => void;
  defaultCurrency: CurrencyCode;
}

export function TransactionFilters({
  filters,
  onFilterChange,
  onExport,
  defaultCurrency,
}: TransactionFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {};
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const handleSearchChange = (value: string) => {
    const newFilters = { ...localFilters, search: value || undefined };
    setLocalFilters(newFilters);
    // Debounced search would be better, but for now apply immediately
    onFilterChange(newFilters);
  };

  const hasActiveFilters =
    localFilters.transaction_type ||
    localFilters.start_date ||
    localFilters.end_date ||
    localFilters.min_amount !== undefined ||
    localFilters.max_amount !== undefined ||
    localFilters.currency;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filters</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Descriptions</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search transaction descriptions..."
              value={localFilters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={localFilters.transaction_type || 'all'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  transaction_type: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="credit_added">Credit Added</SelectItem>
                <SelectItem value="booking_deduction">Booking Deduction</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="admin_adjustment">Admin Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={localFilters.start_date || ''}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  start_date: e.target.value || undefined,
                })
              }
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={localFilters.end_date || ''}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  end_date: e.target.value || undefined,
                })
              }
            />
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={localFilters.currency || 'all'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  currency: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="All currencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                {getCurrencyOptions().map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.code} - {option.name} ({option.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </Button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {/* Min Amount */}
            <div className="space-y-2">
              <Label htmlFor="minAmount">Minimum Amount</Label>
              <Input
                id="minAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={localFilters.min_amount || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    min_amount: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>

            {/* Max Amount */}
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Maximum Amount</Label>
              <Input
                id="maxAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={localFilters.max_amount || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    max_amount: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>
        )}

        {/* Apply Button */}
        {hasActiveFilters && (
          <Button onClick={handleApply} className="w-full">
            Apply Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
