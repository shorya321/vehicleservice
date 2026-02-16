'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'enabled', label: 'Enabled' },
  { value: 'featured', label: 'Featured' },
  { value: 'disabled', label: 'Disabled' },
] as const

export function CurrencyFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentFilter = searchParams.get('filter') || 'all'
  const currentSearch = searchParams.get('search') || ''
  const [searchValue, setSearchValue] = useState(currentSearch)

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      router.push(`/admin/settings/currencies?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== currentSearch) {
        updateParams({ search: searchValue, page: '1' })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue, currentSearch, updateParams])

  const handleFilterChange = (filter: string) => {
    updateParams({ filter: filter === 'all' ? '' : filter, page: '1' })
  }

  const clearSearch = () => {
    setSearchValue('')
    updateParams({ search: '', page: '1' })
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search currencies..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9 pr-8"
        />
        {searchValue && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/50">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={currentFilter === tab.value || (tab.value === 'all' && !currentFilter) ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => handleFilterChange(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
