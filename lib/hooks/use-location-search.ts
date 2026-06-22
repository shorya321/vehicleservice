'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPublicClient } from '@/lib/supabase/public-client'
import { useDebounce } from '@/lib/hooks/use-debounce'
import type {
  Location,
  LocationSearchResult,
  GroupedLocationResults,
} from '@/lib/types/location'

const RECENT_SEARCHES_KEY = 'location-recent-searches'
const MAX_RECENT = 5
const MAX_CACHE_SIZE = 20
const SEARCH_TIMEOUT_MS = 8000

interface RecentSearch {
  id: string
  name: string
  address: string | null
  city: string | null
  country_code: string
  slug: string
  country_slug: string
  location_type_id: string
  location_type_icon: string
  location_type_label: string
}

function getRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecentSearch(location: LocationSearchResult | Location): void {
  if (typeof window === 'undefined') return
  try {
    const recent = getRecentSearches()
    const entry: RecentSearch = {
      id: location.id,
      name: location.name,
      address: 'address' in location ? (location as LocationSearchResult).address : null,
      city: location.city ?? null,
      country_code: location.country_code,
      slug: location.slug,
      country_slug: location.country_slug,
      location_type_id: 'location_type_id' in location
        ? (location as LocationSearchResult).location_type_id
        : '',
      location_type_icon: 'location_type_icon' in location
        ? (location as LocationSearchResult).location_type_icon
        : 'map-pin',
      location_type_label: 'location_type_label' in location
        ? (location as LocationSearchResult).location_type_label
        : '',
    }
    const filtered = recent.filter((r) => r.id !== entry.id)
    const updated = [entry, ...filtered].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch {
    // localStorage quota or other issue
  }
}

function groupByType(results: LocationSearchResult[]): GroupedLocationResults[] {
  const groups = new Map<string, GroupedLocationResults>()

  for (const result of results) {
    const label = result.location_type_label
    const existing = groups.get(label)
    if (existing) {
      existing.locations.push(result)
    } else {
      groups.set(label, {
        label,
        icon: result.location_type_icon,
        sortOrder: result.location_type_sort,
        locations: [result],
      })
    }
  }

  return Array.from(groups.values()).sort((a, b) => a.sortOrder - b.sortOrder)
}

export interface UseLocationSearchReturn {
  query: string
  setQuery: (q: string) => void
  groupedResults: GroupedLocationResults[]
  flatResults: LocationSearchResult[]
  popularGroups: GroupedLocationResults[]
  recentSearches: RecentSearch[]
  loading: boolean
  error: boolean
  hasSearched: boolean
  selectLocation: (location: LocationSearchResult) => void
  clearQuery: () => void
}

interface UseLocationSearchOptions {
  debounceMs?: number
}

export function useLocationSearch(
  options: UseLocationSearchOptions = {}
): UseLocationSearchReturn {
  const { debounceMs = 250 } = options

  const [query, setQuery] = useState('')
  const [flatResults, setFlatResults] = useState<LocationSearchResult[]>([])
  const [popularResults, setPopularResults] = useState<LocationSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])

  const debouncedQuery = useDebounce(query, debounceMs)
  const supabase = useMemo(() => createPublicClient(), [])
  const cacheRef = useRef(new Map<string, LocationSearchResult[]>())
  const abortRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const popularFetchedRef = useRef(false)

  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  useEffect(() => {
    if (popularFetchedRef.current) return
    popularFetchedRef.current = true

    const fetchPopular = async () => {
      try {
        const { data } = await supabase.rpc('get_popular_locations')
        if (data && Array.isArray(data)) {
          setPopularResults(data as unknown as LocationSearchResult[])
        }
      } catch {
        // Non-critical — popular locations are optional
      }
    }
    fetchPopular()
  }, [supabase])

  useEffect(() => {
    abortRef.current?.abort()
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (debouncedQuery.length < 2) {
      setFlatResults([])
      setHasSearched(false)
      setError(false)
      setLoading(false)
      return
    }

    const cached = cacheRef.current.get(debouncedQuery.toLowerCase())
    if (cached) {
      setFlatResults(cached)
      setHasSearched(true)
      setError(false)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    abortRef.current = controller

    let retried = false
    let retryScheduled = false

    timeoutRef.current = setTimeout(() => {
      controller.abort()
      setFlatResults([])
      setHasSearched(true)
      setError(true)
      setLoading(false)
    }, SEARCH_TIMEOUT_MS)

    const doSearch = async () => {
      if (controller.signal.aborted) return
      setLoading(true)
      setError(false)

      try {
        const { data, error: rpcError } = await supabase
          .rpc('search_locations', {
            search_query: debouncedQuery,
            result_limit: 20,
          })
          .abortSignal(controller.signal)

        if (controller.signal.aborted) return

        if (rpcError) throw rpcError

        if (timeoutRef.current) clearTimeout(timeoutRef.current)

        const results = (data ?? []) as unknown as LocationSearchResult[]
        setFlatResults(results)
        setHasSearched(true)

        if (results.length > 0) {
          const cache = cacheRef.current
          cache.set(debouncedQuery.toLowerCase(), results)
          if (cache.size > MAX_CACHE_SIZE) {
            const firstKey = cache.keys().next().value
            if (firstKey !== undefined) cache.delete(firstKey)
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return

        if (!retried) {
          retried = true
          retryScheduled = true
          setTimeout(() => {
            retryScheduled = false
            if (!controller.signal.aborted) doSearch()
          }, 2000)
          return
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setFlatResults([])
        setHasSearched(true)
        setError(true)
      } finally {
        if (!retryScheduled) {
          setLoading(false)
        }
      }
    }

    doSearch()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      controller.abort()
    }
  }, [debouncedQuery, supabase])

  const groupedResults = useMemo(() => groupByType(flatResults), [flatResults])
  const popularGroups = useMemo(() => groupByType(popularResults), [popularResults])

  const selectLocation = useCallback((location: LocationSearchResult) => {
    saveRecentSearch(location)
    setRecentSearches(getRecentSearches())
  }, [])

  const clearQuery = useCallback(() => {
    abortRef.current?.abort()
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setQuery('')
    setFlatResults([])
    setHasSearched(false)
    setError(false)
    setLoading(false)
  }, [])

  return {
    query,
    setQuery,
    groupedResults,
    flatResults,
    popularGroups,
    recentSearches,
    loading,
    error,
    hasSearched,
    selectLocation,
    clearQuery,
  }
}
