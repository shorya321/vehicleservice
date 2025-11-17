"use client"

import { useState } from "react"
import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { LocationFilters, LocationType, LocationStatus } from "@/lib/types/location"
import { Filter, X, ChevronDown, MapPin, Navigation } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"

interface LocationFiltersProps {
  filters: LocationFilters
  onFiltersChange: (filters: LocationFilters) => void
  countries?: string[]
}

export function LocationFiltersComponent({ filters, onFiltersChange, countries = [] }: LocationFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || "")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [allowPickup, setAllowPickup] = useState<boolean | null>(filters.allowPickup ?? null)
  const [allowDropoff, setAllowDropoff] = useState<boolean | null>(filters.allowDropoff ?? null)
  const [country, setCountry] = useState<string>(filters.country || 'all')

  const handleSearchSubmit = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 })
  }

  const handleTypeChange = (type: string) => {
    onFiltersChange({ ...filters, type: type as LocationType | "all", page: 1 })
  }

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: status as LocationStatus | "all", page: 1 })
  }

  const handleClearFilters = () => {
    setLocalSearch("")
    setAllowPickup(null)
    setAllowDropoff(null)
    setCountry('all')
    onFiltersChange({ 
      page: 1, 
      limit: filters.limit || 10,
      type: 'all',
      status: 'all',
      country: 'all'
    })
  }

  const handleApplyAdvancedFilters = () => {
    const newFilters: LocationFilters = { ...filters, page: 1 }
    
    if (allowPickup !== null) {
      newFilters.allowPickup = allowPickup
    } else {
      delete newFilters.allowPickup
    }
    
    if (allowDropoff !== null) {
      newFilters.allowDropoff = allowDropoff
    } else {
      delete newFilters.allowDropoff
    }
    
    if (country && country !== 'all') {
      newFilters.country = country
    } else {
      newFilters.country = 'all'
    }
    
    onFiltersChange(newFilters)
    setAdvancedOpen(false)
  }

  const activeFilterCount = [
    filters.search,
    filters.type && filters.type !== "all" ? filters.type : null,
    filters.status && filters.status !== "all" ? filters.status : null,
    filters.allowPickup !== undefined && filters.allowPickup !== null,
    filters.allowDropoff !== undefined && filters.allowDropoff !== null,
    filters.country && filters.country !== "all" ? filters.country : null,
  ].filter(Boolean).length

  const hasActiveFilters = activeFilterCount > 0

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        <SearchInput
          placeholder="Search by name, city, or address..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onSearch={handleSearchSubmit}
          className="max-w-sm"
        />
        
        <Select value={filters.type || "all"} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="airport">Airport</SelectItem>
            <SelectItem value="city">City</SelectItem>
            <SelectItem value="hotel">Hotel</SelectItem>
            <SelectItem value="station">Station</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
              {activeFilterCount > 3 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1">
                  {activeFilterCount - 3}
                </Badge>
              )}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm">Advanced Filters</h4>
                <p className="text-xs text-muted-foreground">
                  Filter locations by additional criteria
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="allow-pickup" className="text-sm">
                      Allow Pickup
                    </Label>
                  </div>
                  <Select
                    value={allowPickup === null ? "all" : allowPickup ? "yes" : "no"}
                    onValueChange={(value) => 
                      setAllowPickup(value === "all" ? null : value === "yes")
                    }
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="allow-dropoff" className="text-sm">
                      Allow Dropoff
                    </Label>
                  </div>
                  <Select
                    value={allowDropoff === null ? "all" : allowDropoff ? "yes" : "no"}
                    onValueChange={(value) => 
                      setAllowDropoff(value === "all" ? null : value === "yes")
                    }
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {countries.length > 0 && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="country" className="text-sm">
                      Country
                    </Label>
                    <Select
                      value={country}
                      onValueChange={setCountry}
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {countries.map((countryCode) => (
                          <SelectItem key={countryCode} value={countryCode}>
                            {countryCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAllowPickup(null)
                    setAllowDropoff(null)
                    setCountry('all')
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