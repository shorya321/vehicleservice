'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SearchStatusFiltersProps {
  /** Placeholder and accessible label for the search box. */
  searchPlaceholder: string
  searchLabel: string
}

/**
 * Search box plus an Active / Inactive select, kept in the URL as `search` and
 * `status`. Changing either resets to page 1; other query params are kept.
 */
export function SearchStatusFilters({ searchPlaceholder, searchLabel }: SearchStatusFiltersProps): React.JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const urlSearch = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? 'all'

  const [searchValue, setSearchValue] = useState(urlSearch)
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch)

  // Follow the URL when it changes from outside (back button, Clear All).
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch)
    setSearchValue(urlSearch)
  }

  const pushParams = (changes: Record<string, string | undefined>): void => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete('page')
    const query = params.toString()
    router.push(`${pathname}${query ? `?${query}` : ''}`)
  }

  // Debounce: push the search 500ms after typing stops.
  useEffect(() => {
    const trimmed = searchValue.trim()
    if (trimmed === urlSearch) return
    const timer = setTimeout(() => pushParams({ search: trimmed || undefined }), 500)
    return () => clearTimeout(timer)
    // pushParams is rebuilt every render; the values it reads are listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, urlSearch])

  const hasActiveFilters = urlSearch !== '' || status !== 'all'

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={searchLabel}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={status}
          onValueChange={(value) => pushParams({ status: value === 'all' ? undefined : value })}
        >
          <SelectTrigger aria-label="Filter by status" className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchValue('')
            pushParams({ search: undefined, status: undefined })
          }}
        >
          <X className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      )}
    </div>
  )
}
