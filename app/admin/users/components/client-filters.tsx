"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { UserFiltersComponent } from "./user-filters"
import { UserFilters } from "@/lib/types/user"

interface ClientFiltersProps {
  initialFilters: UserFilters
}

export function ClientFilters({ initialFilters }: ClientFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFiltersChange = (filters: UserFilters) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update search params
    if (filters.search) {
      params.set("search", filters.search)
    } else {
      params.delete("search")
    }

    if (filters.role && filters.role !== "all") {
      params.set("role", filters.role)
    } else {
      params.delete("role")
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
    if ((filters as any).emailVerified !== undefined) {
      params.set("emailVerified", (filters as any).emailVerified.toString())
    } else {
      params.delete("emailVerified")
    }

    if ((filters as any).twoFactorEnabled !== undefined) {
      params.set("twoFactorEnabled", (filters as any).twoFactorEnabled.toString())
    } else {
      params.delete("twoFactorEnabled")
    }

    if ((filters as any).hasSignedIn !== undefined) {
      params.set("hasSignedIn", (filters as any).hasSignedIn.toString())
    } else {
      params.delete("hasSignedIn")
    }

    // Navigate with new params
    router.push(`/admin/users?${params.toString()}`)
  }

  return (
    <UserFiltersComponent 
      filters={initialFilters} 
      onFiltersChange={handleFiltersChange} 
    />
  )
}