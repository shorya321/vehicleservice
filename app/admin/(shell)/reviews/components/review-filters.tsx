'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Star } from 'lucide-react'
import { useCallback, useState, useEffect } from 'react'
import { useDebounce } from '@/lib/hooks/use-debounce'

export function ReviewFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(search, 500)

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    // Reset to page 1 when filters change
    params.set('page', '1')

    router.push(`/admin/reviews?${params.toString()}`)
  }, [router, searchParams])

  // Update search when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== searchParams.get('search')) {
      updateFilter('search', debouncedSearch)
    }
  }, [debouncedSearch, updateFilter, searchParams])

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search reviews..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={searchParams.get('status') || 'all'}
        onValueChange={(value) => updateFilter('status', value)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      {/* Rating Range Filter */}
      <Select
        value={searchParams.get('ratingRange') || 'all'}
        onValueChange={(value) => updateFilter('ratingRange', value)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Ratings" />
        </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 fill-luxury-gold text-luxury-gold" />
                5 Stars Only
              </div>
            </SelectItem>
            <SelectItem value="4-5">
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 fill-luxury-gold text-luxury-gold" />
                4-5 Stars
              </div>
            </SelectItem>
            <SelectItem value="1-3">
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 text-muted-foreground" />
                1-3 Stars
              </div>
            </SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select
        value={searchParams.get('sortBy') || 'newest'}
        onValueChange={(value) => updateFilter('sortBy', value)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
