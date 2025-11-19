'use client';

/**
 * Business Filters Component
 * Search and filter business accounts
 */

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export interface BusinessFilters {
  search?: string;
  status?: string;
  domainVerified?: string;
  page?: number;
  limit?: number;
}

interface BusinessFiltersProps {
  filters: BusinessFilters;
  onFiltersChange: (filters: BusinessFilters) => void;
}

export function BusinessFilters({ filters, onFiltersChange }: BusinessFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value === 'all' ? undefined : value, page: 1 });
  };

  const handleDomainVerifiedChange = (value: string) => {
    onFiltersChange({
      ...filters,
      domainVerified: value === 'all' ? undefined : value,
      page: 1,
    });
  };

  const handleClearAll = () => {
    onFiltersChange({ page: 1, limit: filters.limit });
  };

  const handleResetAdvanced = () => {
    onFiltersChange({
      search: filters.search,
      status: filters.status,
      page: 1,
      limit: filters.limit,
    });
  };

  // Count active filters
  const activeFilterCount = [
    filters.search,
    filters.status && filters.status !== 'all' ? filters.status : null,
    filters.domainVerified !== undefined,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;
  const hasAdvancedFilters = filters.domainVerified !== undefined;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or subdomain..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Advanced
              {hasAdvancedFilters && (
                <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                  {hasAdvancedFilters ? 1 : 0}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Advanced Filters</h4>
                {hasAdvancedFilters && (
                  <Button variant="ghost" size="sm" onClick={handleResetAdvanced}>
                    Reset
                  </Button>
                )}
              </div>

              {/* Domain Verified Filter */}
              <div className="space-y-2">
                <Label>Custom Domain Verified</Label>
                <Select
                  value={filters.domainVerified || 'all'}
                  onValueChange={handleDomainVerifiedChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Verified</SelectItem>
                    <SelectItem value="false">Not Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Clear All Button */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleClearAll}>
          <X className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      )}
    </div>
  );
}
