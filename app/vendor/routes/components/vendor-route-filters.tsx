"use client"

import { useState, useEffect } from "react"
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
import { RouteFilters } from "@/lib/types/route"
import { Filter, X, ChevronDown, MapPin, Navigation } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Location } from "@/lib/types/location"

interface VendorRouteFiltersProps {
  filters: RouteFilters
  onFiltersChange: (filters: RouteFilters) => void
  activeTab: 'my-routes' | 'available-routes'
}

export function VendorRouteFilters({ filters, onFiltersChange, activeTab }: VendorRouteFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || "")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [originLocationId, setOriginLocationId] = useState<string>(filters.originLocationId || 'all')
  const [destinationLocationId, setDestinationLocationId] = useState<string>(filters.destinationLocationId || 'all')
  const [locations, setLocations] = useState<Location[]>([])

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (data) {
      setLocations(data)
    }
  }

  const handleSearchSubmit = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 })
  }

  const handleActiveChange = (isActive: string) => {
    onFiltersChange({ 
      ...filters, 
      isActive: isActive === 'all' ? 'all' : isActive === 'true' ? true : false, 
      page: 1 
    })
  }

  const handlePopularChange = (isPopular: string) => {
    onFiltersChange({ 
      ...filters, 
      isPopular: isPopular === 'all' ? 'all' : isPopular === 'true' ? true : false, 
      page: 1 
    })
  }

  const handleSharedChange = (isShared: string) => {
    onFiltersChange({ 
      ...filters, 
      isShared: isShared === 'all' ? 'all' : isShared === 'true' ? true : false, 
      page: 1 
    })
  }

  const handleClearFilters = () => {
    setLocalSearch("")
    setOriginLocationId('all')
    setDestinationLocationId('all')
    onFiltersChange({ 
      page: 1, 
      limit: filters.limit || 10,
      isActive: 'all',
      isPopular: 'all',
      isShared: 'all'
    })
  }

  const handleApplyAdvancedFilters = () => {
    const newFilters: RouteFilters = { ...filters, page: 1 }
    
    if (originLocationId && originLocationId !== 'all') {
      newFilters.originLocationId = originLocationId
    } else {
      delete newFilters.originLocationId
    }
    
    if (destinationLocationId && destinationLocationId !== 'all') {
      newFilters.destinationLocationId = destinationLocationId
    } else {
      delete newFilters.destinationLocationId
    }
    
    onFiltersChange(newFilters)
    setAdvancedOpen(false)
  }

  const activeFilterCount = [
    filters.search,
    filters.isActive && filters.isActive !== 'all' ? filters.isActive : null,
    filters.isPopular && filters.isPopular !== 'all' ? filters.isPopular : null,
    filters.isShared && filters.isShared !== 'all' ? filters.isShared : null,
    filters.originLocationId && filters.originLocationId !== 'all' ? filters.originLocationId : null,
    filters.destinationLocationId && filters.destinationLocationId !== 'all' ? filters.destinationLocationId : null,
  ].filter(Boolean).length

  const hasActiveFilters = activeFilterCount > 0

  const pickupLocations = locations.filter(loc => loc.allow_pickup !== false)
  const dropoffLocations = locations.filter(loc => loc.allow_dropoff !== false)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4 flex-wrap">
        <SearchInput
          placeholder="Search routes..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onSearch={handleSearchSubmit}
          className="max-w-sm"
        />
        
        <Select 
          value={filters.isActive === true ? 'true' : filters.isActive === false ? 'false' : 'all'} 
          onValueChange={handleActiveChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.isPopular === true ? 'true' : filters.isPopular === false ? 'false' : 'all'} 
          onValueChange={handlePopularChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All routes</SelectItem>
            <SelectItem value="true">Popular</SelectItem>
            <SelectItem value="false">Regular</SelectItem>
          </SelectContent>
        </Select>

        {activeTab === 'my-routes' && (
          <Select 
            value={filters.isShared === true ? 'true' : filters.isShared === false ? 'false' : 'all'} 
            onValueChange={handleSharedChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visibility</SelectItem>
              <SelectItem value="true">Shared</SelectItem>
              <SelectItem value="false">Private</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3"
            >
              <Filter className="mr-2 h-4 w-4" />
              Advanced
              {(activeFilterCount > (activeTab === 'my-routes' ? 4 : 3)) && (
                <Badge variant="secondary" className="ml-2 h-5 px-1">
                  {activeFilterCount - (activeTab === 'my-routes' ? 4 : 3)}
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
                  Filter routes by origin and destination
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="origin" className="text-sm">
                      Origin Location
                    </Label>
                  </div>
                  <Select
                    value={originLocationId}
                    onValueChange={setOriginLocationId}
                  >
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {pickupLocations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="destination" className="text-sm">
                      Destination Location
                    </Label>
                  </div>
                  <Select
                    value={destinationLocationId}
                    onValueChange={setDestinationLocationId}
                  >
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {dropoffLocations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
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
                    setOriginLocationId('all')
                    setDestinationLocationId('all')
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