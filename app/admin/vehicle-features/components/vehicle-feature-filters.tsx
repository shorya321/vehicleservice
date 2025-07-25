"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VehicleFeatureFilters } from "@/lib/types/vehicle-feature"
import { Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface VehicleFeatureFiltersProps {
  filters: VehicleFeatureFilters
}

const categories = [
  { value: "all", label: "All Categories" },
  { value: "safety", label: "Safety" },
  { value: "comfort", label: "Comfort" },
  { value: "technology", label: "Technology" },
  { value: "entertainment", label: "Entertainment" },
  { value: "convenience", label: "Convenience" },
  { value: "performance", label: "Performance" },
]

export function VehicleFeatureFilters({ filters }: VehicleFeatureFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(filters.search || "")

  const updateFilters = (updates: Partial<VehicleFeatureFilters>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    
    // Reset to page 1 when filters change
    if (Object.keys(updates).some(key => key !== 'page')) {
      params.delete('page')
    }
    
    router.push(`/admin/vehicle-features?${params.toString()}`)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    updateFilters({ search: value })
  }

  const clearFilters = () => {
    setSearch("")
    router.push("/admin/vehicle-features")
  }

  const hasActiveFilters = filters.search || 
    (filters.category && filters.category !== 'all') || 
    (filters.is_active !== undefined && filters.is_active !== 'all')

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search features..."
            value={search}
            onChange={handleSearch}
          />
        </div>
        
        <Select
          value={filters.category || "all"}
          onValueChange={(value) => updateFilters({ category: value })}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.is_active === undefined ? "all" : String(filters.is_active)}
          onValueChange={(value) => updateFilters({ 
            is_active: value === "all" ? undefined : value === "true" 
          })}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="icon"
            onClick={clearFilters}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.search && (
            <Badge variant="secondary">
              Search: {filters.search}
            </Badge>
          )}
          {filters.category && filters.category !== 'all' && (
            <Badge variant="secondary">
              Category: {categories.find(c => c.value === filters.category)?.label}
            </Badge>
          )}
          {filters.is_active !== undefined && (
            <Badge variant="secondary">
              Status: {filters.is_active ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}