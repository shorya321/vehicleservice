'use client';

/**
 * Transaction Filters Component
 * Advanced filtering UI for transactions
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Filter, X, Search } from 'lucide-react';
import { getCurrencyOptions, type CurrencyCode } from '@/lib/utils/currency-converter';
import { cn } from '@/lib/utils';

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

  // Input styling with semantic colors
  const inputStyles = cn(
    'bg-muted border-border',
    'focus:border-primary focus:ring-primary/20',
    'text-foreground placeholder:text-muted-foreground'
  );

  const selectTriggerStyles = cn(
    'bg-muted border-border',
    'focus:border-primary focus:ring-primary/20',
    'text-foreground'
  );

  const selectContentStyles = 'bg-popover border-border';
  const selectItemStyles = 'text-foreground focus:bg-primary/10 focus:text-foreground';

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <CardTitle className="text-foreground">Filters</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10"
              >
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
          <Label htmlFor="search" className="text-muted-foreground">Search Descriptions</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              id="search"
              placeholder="Search transaction descriptions..."
              value={localFilters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={cn(inputStyles, 'pl-10')}
            />
          </div>
        </div>

        {/* Quick Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-muted-foreground">Transaction Type</Label>
            <Select
              value={localFilters.transaction_type || 'all'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  transaction_type: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger id="type" className={selectTriggerStyles}>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent className={selectContentStyles}>
                <SelectItem value="all" className={selectItemStyles}>All Types</SelectItem>
                <SelectItem value="credit_added" className={selectItemStyles}>Credit Added</SelectItem>
                <SelectItem value="booking_deduction" className={selectItemStyles}>Booking Deduction</SelectItem>
                <SelectItem value="refund" className={selectItemStyles}>Refund</SelectItem>
                <SelectItem value="admin_adjustment" className={selectItemStyles}>Admin Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-muted-foreground">Start Date</Label>
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
              className={inputStyles}
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-muted-foreground">End Date</Label>
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
              className={inputStyles}
            />
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-muted-foreground">Currency</Label>
            <Select
              value={localFilters.currency || 'all'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  currency: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger id="currency" className={selectTriggerStyles}>
                <SelectValue placeholder="All currencies" />
              </SelectTrigger>
              <SelectContent className={selectContentStyles}>
                <SelectItem value="all" className={selectItemStyles}>All Currencies</SelectItem>
                {getCurrencyOptions().map((option) => (
                  <SelectItem key={option.code} value={option.code} className={selectItemStyles}>
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
          className="w-full text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </Button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            {/* Min Amount */}
            <div className="space-y-2">
              <Label htmlFor="minAmount" className="text-muted-foreground">Minimum Amount</Label>
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
                className={inputStyles}
              />
            </div>

            {/* Max Amount */}
            <div className="space-y-2">
              <Label htmlFor="maxAmount" className="text-muted-foreground">Maximum Amount</Label>
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
                className={inputStyles}
              />
            </div>
          </div>
        )}

        {/* Apply Button */}
        {hasActiveFilters && (
          <Button
            onClick={handleApply}
            className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
          >
            Apply Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
