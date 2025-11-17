"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { LocationFiltersComponent } from "./location-filters"
import { LocationFilters } from "@/lib/types/location"

interface ClientFiltersProps {
  initialFilters: LocationFilters
  countries?: string[]
}

export function ClientFilters({ initialFilters, countries }: ClientFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFiltersChange = (filters: LocationFilters) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update search params
    if (filters.search) {
      params.set("search", filters.search)
    } else {
      params.delete("search")
    }

    if (filters.type && filters.type !== "all") {
      params.set("type", filters.type)
    } else {
      params.delete("type")
    }

    if (filters.status && filters.status !== "all") {
      params.set("status", filters.status)
    } else {
      params.delete("status")
    }

    if (filters.page) {
      params.set("page", filters.page.toString())
    } else {
      params.delete("page")
    }

    // Advanced filters
    if (filters.allowPickup !== undefined && filters.allowPickup !== null) {
      params.set("allowPickup", filters.allowPickup.toString())
    } else {
      params.delete("allowPickup")
    }

    if (filters.allowDropoff !== undefined && filters.allowDropoff !== null) {
      params.set("allowDropoff", filters.allowDropoff.toString())
    } else {
      params.delete("allowDropoff")
    }

    if (filters.country && filters.country !== "all") {
      params.set("country", filters.country)
    } else {
      params.delete("country")
    }

    // Navigate with new params
    router.push(`/admin/locations?${params.toString()}`)
  }

  return (
    <LocationFiltersComponent 
      filters={initialFilters} 
      onFiltersChange={handleFiltersChange}
      countries={countries}
    />
  )
}