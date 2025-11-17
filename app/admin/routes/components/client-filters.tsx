"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { RouteFiltersComponent } from "./route-filters-improved"
import { RouteFilters } from "@/lib/types/route"

interface ClientFiltersProps {
  initialFilters: RouteFilters
}

export function ClientFilters({ initialFilters }: ClientFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFiltersChange = (filters: RouteFilters) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update search params
    if (filters.search) {
      params.set("search", filters.search)
    } else {
      params.delete("search")
    }

    if (filters.isActive !== undefined && filters.isActive !== 'all') {
      params.set("isActive", filters.isActive.toString())
    } else {
      params.delete("isActive")
    }

    if (filters.isPopular !== undefined && filters.isPopular !== 'all') {
      params.set("isPopular", filters.isPopular.toString())
    } else {
      params.delete("isPopular")
    }

    if (filters.page) {
      params.set("page", filters.page.toString())
    } else {
      params.delete("page")
    }

    // Advanced filters
    if (filters.originLocationId && filters.originLocationId !== "all") {
      params.set("originLocationId", filters.originLocationId)
    } else {
      params.delete("originLocationId")
    }

    if (filters.destinationLocationId && filters.destinationLocationId !== "all") {
      params.set("destinationLocationId", filters.destinationLocationId)
    } else {
      params.delete("destinationLocationId")
    }

    // Navigate with new params
    router.push(`/admin/routes?${params.toString()}`)
  }

  return (
    <RouteFiltersComponent 
      filters={initialFilters} 
      onFiltersChange={handleFiltersChange}
    />
  )
}