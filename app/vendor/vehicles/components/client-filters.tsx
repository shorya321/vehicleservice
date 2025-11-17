"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { VehicleFiltersComponent } from "./vehicle-filters"
import { VehicleFilters } from "../actions"

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

    // Advanced filters
    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      params.set("minPrice", filters.minPrice.toString())
    } else {
      params.delete("minPrice")
    }

    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      params.set("maxPrice", filters.maxPrice.toString())
    } else {
      params.delete("maxPrice")
    }

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