'use client'

import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RATING_OPTIONS, SORT_OPTIONS } from '@/lib/reviews/filter-options'

interface ReviewFiltersProps {
  search: string
  rating?: number
  sortBy: string
}

/**
 * Search, rating and sort for /reviews. The dropdowns navigate as soon as a
 * value is picked; the search submits on Enter. Every change goes back to
 * page 1, so a narrower list never opens on an empty later page.
 */
export function ReviewFilters({ search, rating, sortBy }: ReviewFiltersProps) {
  const router = useRouter()

  const go = (next: { search?: string; rating?: string; sortBy?: string }): void => {
    const params = new URLSearchParams()
    const s = (next.search ?? search).trim()
    const r = next.rating ?? (rating ? String(rating) : 'all')
    const sort = next.sortBy ?? sortBy
    if (s) params.set('search', s)
    if (r !== 'all') params.set('rating', r)
    if (sort !== 'newest') params.set('sortBy', sort)
    const query = params.toString()
    router.push(query ? `/reviews?${query}` : '/reviews', { scroll: false })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <form
        role="search"
        className="relative md:col-span-2"
        onSubmit={(event) => {
          event.preventDefault()
          const value = new FormData(event.currentTarget).get('search')
          go({ search: typeof value === 'string' ? value : '' })
        }}
      >
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]"
          aria-hidden="true"
        />
        <Input
          type="search"
          name="search"
          aria-label="Search reviews"
          placeholder="Search reviews"
          defaultValue={search}
          className="pl-10 bg-[rgba(var(--void-rgb),0.3)] border-[var(--graphite)] focus:border-[var(--gold)] text-[var(--text-primary)]"
        />
      </form>

      <Select defaultValue={rating ? String(rating) : 'all'} onValueChange={(value) => go({ rating: value })}>
        <SelectTrigger aria-label="Filter by rating" className="bg-[rgba(var(--void-rgb),0.3)] border-[var(--graphite)]">
          <SelectValue placeholder="All Ratings" />
        </SelectTrigger>
        <SelectContent>
          {RATING_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={sortBy} onValueChange={(value) => go({ sortBy: value })}>
        <SelectTrigger aria-label="Sort reviews" className="bg-[rgba(var(--void-rgb),0.3)] border-[var(--graphite)]">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
