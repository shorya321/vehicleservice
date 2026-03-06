"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"

interface VendorApplicationsFiltersProps {
  search?: string
  status?: string
}

export function VendorApplicationsFilters({ search, status }: VendorApplicationsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(search ?? "")
  const [debouncedValue, setDebouncedValue] = useState(searchValue)

  // Debounce: update debouncedValue 500ms after searchValue stops changing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(searchValue), 500)
    return () => clearTimeout(timer)
  }, [searchValue])

  // Push to router when debounced value changes
  useEffect(() => {
    const currentSearch = searchParams.get("search") ?? ""
    if (debouncedValue !== currentSearch) {
      const params = new URLSearchParams(searchParams.toString())
      if (debouncedValue) {
        params.set("search", debouncedValue)
      } else {
        params.delete("search")
      }
      params.delete("page")
      startTransition(() => {
        router.push(`/admin/vendor-applications?${params.toString()}`)
      })
    }
  }, [debouncedValue, searchParams, router, startTransition])

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    // Reset to page 1 when filters change
    params.delete('page')
    
    startTransition(() => {
      router.push(`/admin/vendor-applications?${params.toString()}`)
    })
  }, [router, searchParams])

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by business name or email..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <Select
        defaultValue={status || "all"}
        onValueChange={(value) => updateFilter('status', value === 'all' ? '' : value)}
        disabled={isPending}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}