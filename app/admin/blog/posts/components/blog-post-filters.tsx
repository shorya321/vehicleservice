'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { useEffect, useState, useTransition } from "react"

interface BlogPostFiltersProps {
  categories: { id: string; name: string; slug: string }[]
}

export function BlogPostFilters({ categories }: BlogPostFiltersProps) {
  const router = useRouter()
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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchValue), 500)
    return () => clearTimeout(timer)
  }, [searchValue])

  useEffect(() => {
    const currentSearch = searchParams.get('search') || ''
    if (debouncedSearch !== currentSearch) {
      const params = new URLSearchParams(searchParams.toString())
      if (debouncedSearch) {
        params.set('search', debouncedSearch)
      } else {
        params.delete('search')
      }
      params.delete('page')
      startTransition(() => {
        router.push(`?${params.toString()}`)
      })
    }
  }, [debouncedSearch, searchParams, router, startTransition])

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    router.push('/admin/blog/posts')
  }

  const hasActiveFilters =
    searchParams.has('search') ||
    searchParams.has('categoryId') ||
    searchParams.has('status')

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search blog posts..."
          className="pl-9"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <Select
        value={searchParams.get('categoryId') || 'all'}
        onValueChange={(value) => updateFilter('categoryId', value)}
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('status') || 'all'}
        onValueChange={(value) => updateFilter('status', value)}
      >
        <SelectTrigger className="w-full md:w-[160px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearFilters}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
