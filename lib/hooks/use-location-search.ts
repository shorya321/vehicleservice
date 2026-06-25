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
const HARD_TIMEOUT_MS = 15000
const RETRY_TIMEOUT_MS = 3000
const SAFETY_TIMEOUT_MS = 25000

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
  retry: () => void
  clearError: () => void
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
  const [retryTrigger, setRetryTrigger] = useState(0)

  const debouncedQuery = useDebounce(query, debounceMs)
  const supabase = useMemo(() => createPublicClient(), [])
  const cacheRef = useRef(new Map<string, LocationSearchResult[]>())
  const abortRef = useRef<AbortController | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }

    if (debouncedQuery.length < 3) {
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

    let cancelled = false

    const doSearch = async (isRetry = false) => {
      if (cancelled) return

      const controller = new AbortController()
      abortRef.current = controller

      const timeoutMs = isRetry ? RETRY_TIMEOUT_MS : HARD_TIMEOUT_MS
      let signal: AbortSignal
      let timeoutId: ReturnType<typeof setTimeout> | undefined
      if (typeof AbortSignal.any === 'function') {
        signal = AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(timeoutMs),
        ])
      } else {
        signal = controller.signal
        timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      }

      setLoading(true)
      setError(false)

      try {
        const { data, error: rpcError } = await supabase
          .rpc('search_locations', {
            search_query: debouncedQuery,
            result_limit: 20,
          })
          .abortSignal(signal)

        if (cancelled || signal.aborted) return
        if (rpcError) throw rpcError

        const results = (data ?? []) as unknown as LocationSearchResult[]
        setFlatResults(results)
        setHasSearched(true)
        setError(false)

        const cache = cacheRef.current
        cache.set(debouncedQuery.toLowerCase(), results)
        if (cache.size > MAX_CACHE_SIZE) {
          const firstKey = cache.keys().next().value
          if (firstKey !== undefined) cache.delete(firstKey)
        }
      } catch (err: unknown) {
        if (cancelled) return

        if (!isRetry) {
          controller.abort()
          retryTimerRef.current = setTimeout(() => {
            if (!cancelled) doSearch(true)
          }, 1500)
          return
        }

        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('[LocationSearch] search failed:', err.message)
        }

        setFlatResults([])
        setHasSearched(true)
        setError(true)
      } finally {
        if (timeoutId !== undefined) clearTimeout(timeoutId)
        if (isRetry || !retryTimerRef.current) {
          setLoading(false)
        }
      }
    }

    doSearch()

    return () => {
      cancelled = true
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }
      abortRef.current?.abort()
    }
  }, [debouncedQuery, supabase, retryTrigger])

  // Safety net: force-reset loading if stuck beyond all timeouts
  useEffect(() => {
    if (!loading) return

    const safetyTimeout = setTimeout(() => {
      console.error('[LocationSearch] safety timeout: loading state stuck, forcing reset')
      setLoading(false)
      setError(true)
    }, SAFETY_TIMEOUT_MS)

    return () => clearTimeout(safetyTimeout)
  }, [loading])

  const groupedResults = useMemo(() => groupByType(flatResults), [flatResults])
  const popularGroups = useMemo(() => groupByType(popularResults), [popularResults])

  const selectLocation = useCallback((location: LocationSearchResult) => {
    saveRecentSearch(location)
    setRecentSearches(getRecentSearches())
  }, [])

  const clearQuery = useCallback(() => {
    abortRef.current?.abort()
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    setQuery('')
    setFlatResults([])
    setHasSearched(false)
    setError(false)
    setLoading(false)
  }, [])

  const retry = useCallback(() => {
    if (debouncedQuery.length < 3) return
    cacheRef.current.delete(debouncedQuery.toLowerCase())
    setError(false)
    setRetryTrigger((prev) => prev + 1)
  }, [debouncedQuery])

  const clearError = useCallback(() => {
    setError(false)
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
    retry,
    clearError,
  }
}
