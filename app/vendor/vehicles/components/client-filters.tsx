"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { VehicleFiltersComponent } from "./vehicle-filters"
import type { VehicleFilters } from "@/lib/types/vehicle"

interface ClientFiltersProps {
  initialFilters: VehicleFilters
}

export function ClientFilters({ initialFilters }: ClientFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFiltersChange = (filters: VehicleFilters) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update search params
    if (filters.search) {
      params.set("search", filters.search)
    } else {
      params.delete("search")
    }

    if (filters.categoryId && filters.categoryId !== "all") {
      params.set("categoryId", filters.categoryId)
    } else {
      params.delete("categoryId")
    }

    if (filters.status && filters.status !== "all") {
      params.set("status", filters.status)
    } else {
      params.delete("status")
    }

    if (filters.fuelType && filters.fuelType !== "all") {
      params.set("fuelType", filters.fuelType)
    } else {
      params.delete("fuelType")
    }

    if (filters.transmission && filters.transmission !== "all") {
      params.set("transmission", filters.transmission)
    } else {
      params.delete("transmission")
    }

    if (filters.page) {
      params.set("page", filters.page.toString())
    } else {
      params.delete("page")
    }

    // Advanced filters. Price was removed: vehicles carry no rate (fares
    // come from zone pricing), so a stale minPrice/maxPrice param is dropped.
    params.delete("minPrice")
    params.delete("maxPrice")

    if (filters.seats !== undefined && filters.seats > 0) {
      params.set("seats", filters.seats.toString())
    } else {
      params.delete("seats")
    }

    // Navigate with new params
    router.push(`/vendor/vehicles?${params.toString()}`)
  }

  return (
    <VehicleFiltersComponent 
      filters={initialFilters} 
      onFiltersChange={handleFiltersChange} 
    />
  )
}