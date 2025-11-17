"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { CategoryFiltersComponent } from "./category-filters"
import { CategoryFilters } from "../actions"

export function ClientFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filters: CategoryFilters = {
    search: searchParams.get('search') || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    sortBy: (searchParams.get('sortBy') as any) || 'sort_order',
    sortOrder: (searchParams.get('sortOrder') as any) || 'asc',
  }

  const handleFiltersChange = (newFilters: CategoryFilters) => {
    const params = new URLSearchParams()
    
    if (newFilters.search) params.set('search', newFilters.search)
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString())
    if (newFilters.sortBy && newFilters.sortBy !== 'sort_order') params.set('sortBy', newFilters.sortBy)
    if (newFilters.sortOrder && newFilters.sortOrder !== 'asc') params.set('sortOrder', newFilters.sortOrder)
    
    const queryString = params.toString()
    router.push(queryString ? `?${queryString}` : '/admin/vehicle-categories')
  }

  return <CategoryFiltersComponent filters={filters} onFiltersChange={handleFiltersChange} />
}