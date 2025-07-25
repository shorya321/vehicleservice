'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"

type VehicleCategory = {
  id: string
  name: string
  slug: string
}

interface VehicleTypeFiltersProps {
  categories: VehicleCategory[]
}

export function VehicleTypeFilters({ categories }: VehicleTypeFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // Reset to first page on filter change
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/admin/vehicle-types')
  }

  const hasActiveFilters = 
    searchParams.has('search') || 
    searchParams.has('categoryId') ||
    searchParams.has('isActive')

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search vehicle types..."
          className="pl-9"
          value={searchParams.get('search') || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
        />
      </div>
      
      <Select
        value={searchParams.get('categoryId') || 'all'}
        onValueChange={(value) => updateFilter('categoryId', value)}
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="All categories" />
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

      <Select
        value={searchParams.get('isActive') || 'all'}
        onValueChange={(value) => updateFilter('isActive', value)}
      >
        <SelectTrigger className="w-full md:w-[150px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="true">Active</SelectItem>
          <SelectItem value="false">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearFilters}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}