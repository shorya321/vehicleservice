"use client"

import { useEffect, useState } from "react"
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
import {
  LocationPicker,
  type LocationPickerInitialValue,
} from "@/components/locations/location-picker"

interface RouteFiltersProps {
  filters: RouteFilters
  onFiltersChange: (filters: RouteFilters) => void
}

const ALL = 'all'

export function RouteFiltersComponent({ filters, onFiltersChange }: RouteFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || "")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [originLocationId, setOriginLocationId] = useState<string>(filters.originLocationId || ALL)
  const [destinationLocationId, setDestinationLocationId] = useState<string>(filters.destinationLocationId || ALL)

  // Filters arrive from the URL as bare ids, so the display names have to be
  // resolved separately. At most two rows, versus the ~1000-row (silently
  // truncated) location dump this component used to load on every mount.
  const [originInitial, setOriginInitial] = useState<LocationPickerInitialValue | null>(null)
  const [destinationInitial, setDestinationInitial] = useState<LocationPickerInitialValue | null>(null)
  const [namesReady, setNamesReady] = useState(false)

  useEffect(() => {
    const originId = filters.originLocationId && filters.originLocationId !== ALL
      ? filters.originLocationId
      : null
    const destinationId = filters.destinationLocationId && filters.destinationLocationId !== ALL
      ? filters.destinationLocationId
      : null

    if (!originId && !destinationId) {
      setOriginInitial(null)
      setDestinationInitial(null)
      setNamesReady(true)
      return
    }

    let cancelled = false

    const resolveNames = async () => {
      try {
        const supabase = createClient()
        const ids = [originId, destinationId].filter((id): id is string => !!id)
        const { data, error } = await supabase
          .from('locations')
          .select('id, name')
          .in('id', ids)

        if (cancelled) return

        if (error) {
          console.error('Failed to resolve filter location names:', error)
        }

        const namesById = new Map((data || []).map((row) => [row.id, row.name]))
        const originName = originId ? namesById.get(originId) : undefined
        const destinationName = destinationId ? namesById.get(destinationId) : undefined

        setOriginInitial(originId && originName ? { id: originId, name: originName } : null)
        setDestinationInitial(
          destinationId && destinationName ? { id: destinationId, name: destinationName } : null
        )
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to resolve filter location names:', error)
        }
      } finally {
        if (!cancelled) {
          setNamesReady(true)
        }
      }
    }

    setNamesReady(false)
    resolveNames()

    return () => {
      cancelled = true
    }
  }, [filters.originLocationId, filters.destinationLocationId])

  const handleSearchSubmit = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 })
  }

  const handleActiveChange = (isActive: string) => {
    onFiltersChange({ 
      ...filters, 
      isActive: isActive === ALL ? ALL : isActive === 'true' ? true : false, 
      page: 1 
    })
  }

  const handlePopularChange = (isPopular: string) => {
    onFiltersChange({ 
      ...filters, 
      isPopular: isPopular === ALL ? ALL : isPopular === 'true' ? true : false, 
      page: 1 
    })
  }

  const resetLocationFilters = () => {
    setOriginLocationId(ALL)
    setDestinationLocationId(ALL)
    setOriginInitial(null)
    setDestinationInitial(null)
  }

  const handleClearFilters = () => {
    setLocalSearch("")
    resetLocationFilters()
    onFiltersChange({ 
      page: 1, 
      limit: filters.limit || 10,
      isActive: ALL,
      isPopular: ALL
    })
  }

  const handleApplyAdvancedFilters = () => {
    const newFilters: RouteFilters = { ...filters, page: 1 }
    
    if (originLocationId && originLocationId !== ALL) {
      newFilters.originLocationId = originLocationId
    } else {
      delete newFilters.originLocationId
    }
    
    if (destinationLocationId && destinationLocationId !== ALL) {
      newFilters.destinationLocationId = destinationLocationId
    } else {
      delete newFilters.destinationLocationId
    }
    
    onFiltersChange(newFilters)
    setAdvancedOpen(false)
  }

  const activeFilterCount = [
    filters.search,
    filters.isActive && filters.isActive !== ALL ? filters.isActive : null,
    filters.isPopular && filters.isPopular !== ALL ? filters.isPopular : null,
    filters.originLocationId && filters.originLocationId !== ALL ? filters.originLocationId : null,
    filters.destinationLocationId && filters.destinationLocationId !== ALL ? filters.destinationLocationId : null,
  ].filter(Boolean).length

  const hasActiveFilters = activeFilterCount > 0

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        <SearchInput
          placeholder="Search routes..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onSearch={handleSearchSubmit}
          className="max-w-sm"
        />
        
        <Select 
          value={filters.isActive === true ? 'true' : filters.isActive === false ? 'false' : ALL} 
          onValueChange={handleActiveChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.isPopular === true ? 'true' : filters.isPopular === false ? 'false' : ALL} 
          onValueChange={handlePopularChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All routes</SelectItem>
            <SelectItem value="true">Popular</SelectItem>
            <SelectItem value="false">Regular</SelectItem>
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
          <PopoverContent
            className="w-80"
            align="end"
            // Without this the origin field is autofocused on open, which pops
            // its suggestion list straight over the Reset/Apply buttons.
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm">Advanced Filters</h4>
                <p className="text-xs text-muted-foreground">
                  Search for an origin and destination to filter routes
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="origin-location-filter" className="text-sm">
                      Origin Location
                    </Label>
                  </div>
                  {namesReady ? (
                    <LocationPicker
                      id="origin-location-filter"
                      value={originLocationId === ALL ? null : originLocationId}
                      initialLocation={originInitial}
                      onChange={(id, name) => {
                        setOriginLocationId(id ?? ALL)
                        setOriginInitial(id && name ? { id, name } : null)
                      }}
                      placeholder="All locations"
                      ariaLabel="Filter by origin location"
                    />
                  ) : (
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="destination-location-filter" className="text-sm">
                      Destination Location
                    </Label>
                  </div>
                  {namesReady ? (
                    <LocationPicker
                      id="destination-location-filter"
                      value={destinationLocationId === ALL ? null : destinationLocationId}
                      initialLocation={destinationInitial}
                      onChange={(id, name) => {
                        setDestinationLocationId(id ?? ALL)
                        setDestinationInitial(id && name ? { id, name } : null)
                      }}
                      placeholder="All locations"
                      ariaLabel="Filter by destination location"
                    />
                  ) : (
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetLocationFilters}
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
