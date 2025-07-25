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
import { CategoryFilters } from "../actions"
import { X, ArrowUpDown } from "lucide-react"

interface CategoryFiltersProps {
  filters: CategoryFilters
  onFiltersChange: (filters: CategoryFilters) => void
}

export function CategoryFiltersComponent({ filters, onFiltersChange }: CategoryFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || "")

  const handleSearchSubmit = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 })
  }

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [any, any]
    onFiltersChange({ ...filters, sortBy, sortOrder, page: 1 })
  }

  const handleClearFilters = () => {
    setLocalSearch("")
    onFiltersChange({ 
      page: 1, 
      limit: filters.limit || 10,
    })
  }

  const currentSort = `${filters.sortBy || 'sort_order'}-${filters.sortOrder || 'asc'}`
  const hasActiveFilters = !!filters.search

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        <SearchInput
          placeholder="Search by name or description..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onSearch={handleSearchSubmit}
          className="max-w-sm"
        />
        
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="sort_order-asc">Sort Order (Low-High)</SelectItem>
            <SelectItem value="sort_order-desc">Sort Order (High-Low)</SelectItem>
            <SelectItem value="created_at-desc">Newest First</SelectItem>
            <SelectItem value="created_at-asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>

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