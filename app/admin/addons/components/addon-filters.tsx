'use client'

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { useCallback, useEffect, useState, useTransition } from "react"

interface AddonFiltersProps {
  categories: string[]
}

export function AddonFilters({ categories }: AddonFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const urlSearch = searchParams.get('search') || ''
  const [searchValue, setSearchValue] = useState(urlSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(searchValue)
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch)

  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch)
    setSearchValue(urlSearch)
    setDebouncedSearch(urlSearch)
  }

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString())

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'all') {
          newSearchParams.delete(key)
        } else {
          newSearchParams.set(key, value)
        }
      })

      // Reset to page 1 when filters change
      if (!params.page) {
        newSearchParams.delete('page')
      }

      return newSearchParams.toString()
    },
    [searchParams]
  )

  // Debounce: update debouncedSearch 500ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchValue), 500)
    return () => clearTimeout(timer)
  }, [searchValue])

  // Push to router when debounced value changes
  useEffect(() => {
    const currentSearch = searchParams.get('search') || ''
    if (debouncedSearch !== currentSearch) {
      startTransition(() => {
        router.push(`${pathname}?${createQueryString({ search: debouncedSearch || null })}`)
      })
    }
  }, [debouncedSearch, searchParams, router, pathname, createQueryString, startTransition])

  const handleFilterChange = (key: string, value: string | null) => {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ [key]: value })}`)
    })
  }

  const handleClearFilters = () => {
    startTransition(() => {
      router.push(pathname)
    })
  }

  const hasFilters = searchParams.toString() !== ''

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search addons..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select
          value={searchParams.get('category') || 'all'}
          onValueChange={(value) => handleFilterChange('category', value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('isActive') || 'all'}
          onValueChange={(value) => handleFilterChange('isActive', value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearFilters}
            title="Clear filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
