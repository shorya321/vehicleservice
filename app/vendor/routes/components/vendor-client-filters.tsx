"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { VendorRouteFilters } from "./vendor-route-filters"
import { RouteFilters } from "@/lib/types/route"

interface VendorClientFiltersProps {
  initialFilters: RouteFilters
  activeTab: 'my-routes' | 'available-routes'
}

export function VendorClientFilters({ initialFilters, activeTab }: VendorClientFiltersProps) {
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

    if (filters.isShared !== undefined && filters.isShared !== 'all') {
      params.set("isShared", filters.isShared.toString())
    } else {
      params.delete("isShared")
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

    // Keep the current tab
    if (params.has("tab")) {
      params.set("tab", params.get("tab")!)
    }

    // Navigate with new params
    router.push(`/vendor/routes?${params.toString()}`)
  }

  return (
    <VendorRouteFilters 
      filters={initialFilters} 
      onFiltersChange={handleFiltersChange}
      activeTab={activeTab}
    />
  )
}