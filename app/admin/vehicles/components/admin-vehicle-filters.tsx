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
import { AdminVehicleFilters } from "../actions"
import { getVehicleCategories, getVehicleTypesByCategory } from "@/app/vendor/vehicles/actions"
import { VehicleType } from "@/lib/types/vehicle"
import { Filter, X, ChevronDown, Users, Layers } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { VehicleCategory } from "@/lib/types/vehicle-category"
import { toast } from "sonner"

interface AdminVehicleFiltersProps {
  filters: AdminVehicleFilters
  onFiltersChange: (filters: AdminVehicleFilters) => void
  vendors: Array<{
    id: string
    business_name: string
    business_email: string
  }>
}

export function AdminVehicleFiltersComponent({ filters, onFiltersChange, vendors }: AdminVehicleFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || "")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [seats, setSeats] = useState(filters.seats?.toString() || "")
  const [categories, setCategories] = useState<VehicleCategory[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [loadingVehicleTypes, setLoadingVehicleTypes] = useState(false)

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

  // Load vehicle types when category changes
  useEffect(() => {
    async function loadVehicleTypes() {
      if (!filters.categoryId || filters.categoryId === 'all') {
        setVehicleTypes([])
        return
      }

      setLoadingVehicleTypes(true)
      try {
        const types = await getVehicleTypesByCategory(filters.categoryId)
        setVehicleTypes(types)
      } catch (error) {
        console.error("Failed to load vehicle types:", error)
      } finally {
        setLoadingVehicleTypes(false)
      }
    }
    loadVehicleTypes()
  }, [filters.categoryId])

  const handleSearchSubmit = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 })
  }

  const handleVendorChange = (vendorId: string) => {
    onFiltersChange({ ...filters, vendorId: vendorId as any, page: 1 })
  }

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: status as any, page: 1 })
  }

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({ ...filters, categoryId: categoryId as any, vehicleTypeId: 'all', page: 1 })
  }

  const handleVehicleTypeChange = (vehicleTypeId: string) => {
    onFiltersChange({ ...filters, vehicleTypeId: vehicleTypeId as any, page: 1 })
  }

  const handleFuelTypeChange = (fuelType: string) => {
    onFiltersChange({ ...filters, fuelType: fuelType as any, page: 1 })
  }

  const handleTransmissionChange = (transmission: string) => {
    onFiltersChange({ ...filters, transmission: transmission as any, page: 1 })
  }

  const handleClearFilters = () => {
    setLocalSearch("")
    setSeats("")
    onFiltersChange({ 
      page: 1, 
      limit: filters.limit || 10,
      vendorId: 'all',
      status: 'all',
      categoryId: 'all',
      vehicleTypeId: 'all',
      fuelType: 'all',
      transmission: 'all'
    })
  }

  const handleApplyAdvancedFilters = () => {
    const newFilters: AdminVehicleFilters = { ...filters, page: 1 }
    
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
    filters.vendorId && filters.vendorId !== "all" ? filters.vendorId : null,
    filters.status && filters.status !== "all" ? filters.status : null,
    filters.categoryId && filters.categoryId !== "all" ? filters.categoryId : null,
    filters.vehicleTypeId && filters.vehicleTypeId !== "all" ? filters.vehicleTypeId : null,
    filters.fuelType && filters.fuelType !== "all" ? filters.fuelType : null,
    filters.transmission && filters.transmission !== "all" ? filters.transmission : null,
    filters.seats !== undefined,
  ].filter(Boolean).length

  const hasActiveFilters = activeFilterCount > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          placeholder="Search by make, model, or registration..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onSearch={handleSearchSubmit}
          className="max-w-sm"
        />
        
        <Select value={filters.vendorId || "all"} onValueChange={handleVendorChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All vendors</SelectItem>
            {vendors.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.id}>
                {vendor.business_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        {filters.categoryId && filters.categoryId !== 'all' && (
          <Select value={filters.vehicleTypeId || "all"} onValueChange={handleVehicleTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={loadingVehicleTypes ? "Loading types..." : "All vehicle types"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vehicle types</SelectItem>
              {vehicleTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name} ({type.passenger_capacity}p)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
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
              {filters.seats !== undefined && (
                <Badge variant="secondary" className="ml-2 h-5 px-1">
                  1
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