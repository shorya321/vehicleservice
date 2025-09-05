'use client'

import { useState } from 'react'
import { SearchInput } from '@/components/ui/search-input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Filter, X, ChevronDown, CalendarIcon, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'

export interface BookingFilters {
  search?: string
  status?: 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
  paymentStatus?: 'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}

interface BookingFiltersProps {
  filters: BookingFilters
  onFiltersChange: (filters: BookingFilters) => void
}

export function BookingFiltersComponent({ filters, onFiltersChange }: BookingFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: filters.dateFrom,
    to: filters.dateTo,
  })
  const [paymentStatus, setPaymentStatus] = useState<string>(filters.paymentStatus || 'all')

  const handleSearchSubmit = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 })
  }

  const handleStatusChange = (status: string) => {
    onFiltersChange({ 
      ...filters, 
      status: status as BookingFilters['status'], 
      page: 1 
    })
  }

  const handleClearFilters = () => {
    setLocalSearch('')
    setDateRange(undefined)
    setPaymentStatus('all')
    onFiltersChange({ 
      page: 1, 
      limit: filters.limit || 10,
      status: 'all',
      paymentStatus: 'all'
    })
  }

  const handleApplyAdvancedFilters = () => {
    const newFilters: BookingFilters = { ...filters, page: 1 }
    
    if (dateRange?.from) {
      newFilters.dateFrom = dateRange.from
    } else {
      delete newFilters.dateFrom
    }
    
    if (dateRange?.to) {
      newFilters.dateTo = dateRange.to
    } else {
      delete newFilters.dateTo
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      newFilters.paymentStatus = paymentStatus as BookingFilters['paymentStatus']
    } else {
      newFilters.paymentStatus = 'all'
    }
    
    onFiltersChange(newFilters)
    setAdvancedOpen(false)
  }

  const activeFilterCount = [
    filters.search,
    filters.status && filters.status !== 'all' ? filters.status : null,
    filters.paymentStatus && filters.paymentStatus !== 'all' ? filters.paymentStatus : null,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length

  const hasActiveFilters = activeFilterCount > 0

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        <SearchInput
          placeholder="Search by booking number or location..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onSearch={handleSearchSubmit}
          className="max-w-sm"
        />
        
        <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3"
            >
              <Filter className="mr-2 h-4 w-4" />
              Advanced
              {activeFilterCount > 2 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1">
                  {activeFilterCount - 2}
                </Badge>
              )}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm">Advanced Filters</h4>
                <p className="text-xs text-muted-foreground">
                  Filter bookings by additional criteria
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Payment Status */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <Label>Payment Status</Label>
                  </div>
                  <Select
                    value={paymentStatus}
                    onValueChange={setPaymentStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateRange(undefined)
                    setPaymentStatus('all')
                  }}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyAdvancedFilters}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2 lg:px-3"
          >
            Clear All
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}