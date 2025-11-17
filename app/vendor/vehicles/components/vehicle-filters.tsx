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
import { VehicleFilters, getVehicleCategories } from "../actions"
import { Filter, X, ChevronDown, DollarSign, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { VehicleCategory } from "@/lib/types/vehicle-category"
import { toast } from "sonner"

interface VehicleFiltersProps {
  filters: VehicleFilters
  onFiltersChange: (filters: VehicleFilters) => void
}

export function VehicleFiltersComponent({ filters, onFiltersChange }: VehicleFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || "")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() || "")
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() || "")
  const [seats, setSeats] = useState(filters.seats?.toString() || "")
  const [categories, setCategories] = useState<VehicleCategory[]>([])

  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await getVehicleCategories()
        if (result.data) {
          setCategories(result.data)
        }
      } catch (error) {
        toast.error("Failed to load vehicle categories")
      }
    }
    loadCategories()
  }, [])

  const handleSearchSubmit = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 })
  }

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: status as any, page: 1 })
  }

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({ ...filters, categoryId: categoryId as any, page: 1 })
  }

  const handleFuelTypeChange = (fuelType: string) => {
    onFiltersChange({ ...filters, fuelType: fuelType as any, page: 1 })
  }

  const handleTransmissionChange = (transmission: string) => {
    onFiltersChange({ ...filters, transmission: transmission as any, page: 1 })
  }

  const handleClearFilters = () => {
    setLocalSearch("")
    setMinPrice("")
    setMaxPrice("")
    setSeats("")
    onFiltersChange({ 
      page: 1, 
      limit: filters.limit || 10,
      status: 'all',
      categoryId: 'all',
      fuelType: 'all',
      transmission: 'all'
    })
  }

  const handleApplyAdvancedFilters = () => {
    const newFilters: VehicleFilters = { ...filters, page: 1 }
    
    if (minPrice && !isNaN(parseFloat(minPrice))) {
      newFilters.minPrice = parseFloat(minPrice)
    } else {
      delete newFilters.minPrice
    }
    
    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
      newFilters.maxPrice = parseFloat(maxPrice)
    } else {
      delete newFilters.maxPrice
    }
    
    if (seats && !isNaN(parseInt(seats))) {
      newFilters.seats = parseInt(seats)
    } else {
      delete newFilters.seats
    }
    
    onFiltersChange(newFilters)
    setAdvancedOpen(false)
  }

  const activeFilterCount = [
    filters.search,
    filters.status && filters.status !== "all" ? filters.status : null,
    filters.categoryId && filters.categoryId !== "all" ? filters.categoryId : null,
    filters.fuelType && filters.fuelType !== "all" ? filters.fuelType : null,
    filters.transmission && filters.transmission !== "all" ? filters.transmission : null,
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
    filters.seats !== undefined,
  ].filter(Boolean).length

  const hasActiveFilters = activeFilterCount > 0

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        <SearchInput
          placeholder="Search by make, model, or registration..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onSearch={handleSearchSubmit}
          className="max-w-sm"
        />
        
        <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.categoryId || "all"} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.fuelType || "all"} onValueChange={handleFuelTypeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All fuel types</SelectItem>
            <SelectItem value="petrol">Petrol</SelectItem>
            <SelectItem value="diesel">Diesel</SelectItem>
            <SelectItem value="electric">Electric</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.transmission || "all"} onValueChange={handleTransmissionChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All transmissions</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="automatic">Automatic</SelectItem>
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
              {(filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.seats !== undefined) && (
                <Badge variant="secondary" className="ml-2 h-5 px-1">
                  {[filters.minPrice !== undefined, filters.maxPrice !== undefined, filters.seats !== undefined].filter(Boolean).length}
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
                  Filter vehicles by additional criteria
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm">Price Range (AED/day)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="h-8"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="seats" className="text-sm">
                      Number of Seats
                    </Label>
                  </div>
                  <Input
                    id="seats"
                    type="number"
                    placeholder="e.g., 5"
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    min="1"
                    max="20"
                    className="h-8"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMinPrice("")
                    setMaxPrice("")
                    setSeats("")
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