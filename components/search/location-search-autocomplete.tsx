'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, X, Search, Loader2, AlertCircle } from 'lucide-react'
import { getLocationTypeIcon } from '@/lib/utils/location-type-utils'
import { getCountryName } from '@/lib/utils/country'
import {
  useLocationSearch,
  type UseLocationSearchReturn,
} from '@/lib/hooks/use-location-search'
import type { LocationSearchResult } from '@/lib/types/location'
import { cn } from '@/lib/utils'

interface LocationSearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (location: LocationSearchResult) => void
  placeholder?: string
  selectedLocation?: LocationSearchResult | null
  variant?: 'hero' | 'default'
  id?: string
  ariaLabel?: string
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)

  if (index === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, index)}
      <span className="font-bold">{text.slice(index, index + query.length)}</span>
      {text.slice(index + query.length)}
    </>
  )
}

function formatLocationSubtitle(location: {
  name: string
  address: string | null
  city: string | null
  country_code: string
}): string {
  const country = getCountryName(location.country_code)
  const parts: string[] = []

  if (location.address) {
    parts.push(location.address)
  }
  if (location.city) {
    parts.push(location.city)
  }
  parts.push(country)

  return parts.join(' · ')
}

interface ResultItemProps {
  location: LocationSearchResult
  query: string
  isSelected: boolean
  onSelect: () => void
  onHover: () => void
  variant: 'hero' | 'default'
  optionId?: string
}

function ResultItem({
  location,
  query,
  isSelected,
  onSelect,
  onHover,
  variant,
  optionId,
}: ResultItemProps) {
  const isHero = variant === 'hero'
  const itemRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest' })
    }
  }, [isSelected])

  return (
    <button
      ref={itemRef}
      type="button"
      role="option"
      id={optionId}
      aria-selected={isSelected}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        'w-full px-4 py-3 text-left transition-colors',
        isHero
          ? cn(
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gold)]/50',
              isSelected
                ? 'bg-[var(--dropdown-surface-hover)]'
                : 'hover:bg-[var(--dropdown-surface-hover)]'
            )
          : cn(
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
              isSelected
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            )
      )}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          {getLocationTypeIcon(
            location.location_type_icon || 'map-pin',
            cn(
              'h-4 w-4',
              isHero ? 'text-[var(--gold-text)]' : 'text-primary'
            )
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'text-sm truncate',
              isHero ? 'text-[var(--text-primary)]' : 'text-foreground'
            )}
          >
            <HighlightedText text={location.name} query={query} />
          </div>
          <div
            className={cn(
              'text-xs',
              isHero ? 'text-[var(--text-muted)]' : 'text-muted-foreground'
            )}
          >
            {formatLocationSubtitle(location)}
          </div>
        </div>
      </div>
    </button>
  )
}

interface NavigableItem {
  location: LocationSearchResult
  section: 'recent' | 'popular' | 'results'
}

function LocationSearchAutocompleteBase({
  value,
  onChange,
  onSelect,
  placeholder = 'Airport, hotel, or address',
  selectedLocation,
  variant = 'default',
  id,
  ariaLabel,
}: LocationSearchAutocompleteProps) {
  const {
    query,
    setQuery,
    groupedResults,
    popularGroups,
    recentSearches,
    loading,
    error,
    hasSearched,
    selectLocation,
    clearQuery,
    retry,
    clearError,
  }: UseLocationSearchReturn = useLocationSearch({ debounceMs: 250 })

  const groupedFlat = useMemo(
    () => groupedResults.flatMap((g) => g.locations),
    [groupedResults]
  )

  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedLocationRef = useRef(selectedLocation)
  const isHero = variant === 'hero'

  useEffect(() => {
    selectedLocationRef.current = selectedLocation
  }, [selectedLocation])

  useEffect(() => {
    if (selectedLocationRef.current && selectedLocationRef.current.name === value) {
      return
    }
    setQuery(value)
  }, [value, setQuery])

  const popularFlat = useMemo(
    () => popularGroups.flatMap((g) => g.locations),
    [popularGroups]
  )

  const recentAsResults = useMemo(
    (): LocationSearchResult[] =>
      recentSearches.map((recent) => ({
        ...recent,
        address: recent.address ?? null,
        latitude: null,
        longitude: null,
        location_type_id: recent.location_type_id || '',
        location_type_sort: 0,
        allow_pickup: null,
        allow_dropoff: null,
        relevance: 0,
      })),
    [recentSearches]
  )

  const showResults = query.length >= 2 && hasSearched
  const showPopularOrRecent =
    !showResults && (recentSearches.length > 0 || popularFlat.length > 0)

  const allNavigable = useMemo((): NavigableItem[] => {
    if (showResults) {
      return groupedFlat.map((loc) => ({ location: loc, section: 'results' as const }))
    }
    if (showPopularOrRecent) {
      const items: NavigableItem[] = []
      for (const loc of recentAsResults) {
        items.push({ location: loc, section: 'recent' })
      }
      for (const loc of popularFlat) {
        items.push({ location: loc, section: 'popular' })
      }
      return items
    }
    return []
  }, [showResults, showPopularOrRecent, groupedFlat, recentAsResults, popularFlat])

  const hasDropdownContent = showResults || showPopularOrRecent
  const isPopularLoading = !showResults && recentSearches.length === 0 && popularFlat.length === 0

  const activeDescendantId =
    selectedIndex >= 0 && selectedIndex < allNavigable.length
      ? `${id}-option-${selectedIndex}`
      : undefined

  const handleSelect = useCallback(
    (location: LocationSearchResult) => {
      selectLocation(location)
      onSelect(location)
      onChange(location.name)
      setShowDropdown(false)
      setSelectedIndex(-1)
    },
    [onSelect, onChange, selectLocation]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
      setSelectedIndex(-1)
    },
    [onChange]
  )

  const handleFocus = useCallback(() => {
    clearError()
    setShowDropdown(true)
  }, [clearError])

  const handleClear = useCallback(() => {
    onChange('')
    clearQuery()
    setShowDropdown(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }, [onChange, clearQuery])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < allNavigable.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && allNavigable[selectedIndex]) {
            handleSelect(allNavigable[selectedIndex].location)
          }
          break
        case 'Escape':
          e.preventDefault()
          setShowDropdown(false)
          setSelectedIndex(-1)
          break
      }
    },
    [showDropdown, allNavigable, selectedIndex, handleSelect]
  )

  useEffect(() => {
    if (!showDropdown) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  const getNavIndex = useCallback(
    (section: NavigableItem['section'], indexInSection: number): number => {
      let remaining = indexInSection
      let offset = 0
      for (const item of allNavigable) {
        if (item.section === section) {
          if (remaining === 0) return offset
          remaining--
        }
        offset++
      }
      return -1
    },
    [allNavigable]
  )

  return (
    <div ref={containerRef} className="relative w-full flex-grow">
      {isHero ? (
        <MapPin
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10',
            selectedLocation
              ? 'text-[var(--gold-text)]'
              : 'text-[var(--text-muted)]'
          )}
          aria-hidden="true"
        />
      ) : (
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
      )}

      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={
          showDropdown && hasDropdownContent ? `${id}-suggestions` : undefined
        }
        aria-expanded={showDropdown && hasDropdownContent}
        aria-activedescendant={activeDescendantId}
        className={cn(
          isHero
            ? 'search-bar-input search-bar-input--location pl-9 pr-8'
            : 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 pr-8'
        )}
      />

      {loading && (
        <div className={cn(
          'absolute top-1/2 -translate-y-1/2',
          value ? 'right-8' : 'right-3'
        )}>
          <div
            className={cn(
              'animate-spin h-4 w-4 border-2 rounded-full',
              isHero
                ? 'border-[var(--graphite)] border-t-[var(--gold)]'
                : 'border-muted border-t-primary'
            )}
            role="status"
            aria-label="Loading suggestions"
          >
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[44px] min-h-[44px]',
            isHero
              ? 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label={loading ? 'Cancel search' : 'Clear search'}
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {showDropdown && (hasDropdownContent || isPopularLoading) && (
        <div
          id={`${id}-suggestions`}
          role="listbox"
          className={cn(
            'absolute z-50 rounded-lg shadow-lg max-h-72 overflow-y-auto',
            isHero
              ? 'top-full mt-3 left-0 w-full lg:left-[-16px] lg:w-[calc(100%+32px)] lg:min-w-[360px] max-w-[min(600px,calc(100vw-2rem))] border border-[var(--graphite)] bg-[var(--dropdown-surface)] luxury-scrollbar'
              : 'top-full left-0 mt-1 w-full max-w-[min(420px,calc(100vw-2rem))] border bg-popover'
          )}
        >
          {isPopularLoading && (
            <div className={cn(
              'flex items-center gap-2 px-4 py-3 text-xs',
              isHero ? 'text-[var(--text-muted)]' : 'text-muted-foreground'
            )}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading locations...</span>
            </div>
          )}

          {showPopularOrRecent && (
            <>
              {recentSearches.length > 0 && (
                <>
                  <div
                    role="presentation"
                    className={cn(
                      'px-4 py-1.5 text-xs font-semibold uppercase tracking-wider',
                      isHero
                        ? 'text-[var(--gold-text)] bg-[var(--dropdown-surface)] border-b border-[var(--graphite)]/50'
                        : 'text-muted-foreground bg-popover border-b'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-3.5 w-3.5" />
                      <span>Recent Searches</span>
                    </div>
                  </div>
                  {recentAsResults.map((location, i) => {
                    const navIdx = getNavIndex('recent', i)
                    return (
                      <ResultItem
                        key={`recent-${location.id}`}
                        location={location}
                        query=""
                        isSelected={navIdx === selectedIndex}
                        onSelect={() => handleSelect(location)}
                        onHover={() => setSelectedIndex(navIdx)}
                        variant={variant}
                        optionId={`${id}-option-${navIdx}`}
                      />
                    )
                  })}
                </>
              )}

              {popularFlat.length > 0 && (
                <>
                  <div
                    role="presentation"
                    className={cn(
                      'px-4 py-1.5 text-xs font-semibold uppercase tracking-wider',
                      isHero
                        ? 'text-[var(--gold-text)] bg-[var(--dropdown-surface)] border-b border-[var(--graphite)]/50'
                        : 'text-muted-foreground bg-popover border-b'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Popular Locations</span>
                    </div>
                  </div>
                  {popularFlat.map((location, i) => {
                    const navIdx = getNavIndex('popular', i)
                    return (
                      <ResultItem
                        key={`popular-${location.id}`}
                        location={location}
                        query=""
                        isSelected={navIdx === selectedIndex}
                        onSelect={() => handleSelect(location)}
                        onHover={() => setSelectedIndex(navIdx)}
                        variant={variant}
                        optionId={`${id}-option-${navIdx}`}
                      />
                    )
                  })}
                </>
              )}
            </>
          )}

          {showResults && (
            <>
              {groupedResults.length > 0 ? (
                groupedResults.map((group) => {
                  const groupStartIndex = groupedFlat.indexOf(group.locations[0])
                  return (
                    <div key={`group-${group.label}`}>
                      <div
                        role="presentation"
                        className={cn(
                          'px-4 py-1.5 text-xs font-semibold uppercase tracking-wider sticky top-0',
                          isHero
                            ? 'text-[var(--gold-text)] bg-[var(--dropdown-surface)] border-b border-[var(--graphite)]/50'
                            : 'text-muted-foreground bg-popover border-b'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {getLocationTypeIcon(
                            group.icon || 'map-pin',
                            cn(
                              'h-3.5 w-3.5',
                              isHero ? 'text-[var(--gold-text)]' : 'text-muted-foreground'
                            )
                          )}
                          <span>{group.label}</span>
                        </div>
                      </div>
                      {group.locations.map((location, i) => {
                        const navIdx = groupStartIndex + i
                        return (
                          <ResultItem
                            key={location.id}
                            location={location}
                            query={query}
                            isSelected={navIdx === selectedIndex}
                            onSelect={() => handleSelect(location)}
                            onHover={() => setSelectedIndex(navIdx)}
                            variant={variant}
                            optionId={`${id}-option-${navIdx}`}
                          />
                        )
                      })}
                    </div>
                  )
                })
              ) : !error ? (
                <div
                  className={cn(
                    'px-4 py-3 text-sm',
                    isHero
                      ? 'text-[var(--text-muted)]'
                      : 'text-muted-foreground'
                  )}
                >
                  No locations found for &ldquo;{value}&rdquo;
                </div>
              ) : null}

              {error && (
                <div className="px-4 py-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-sm text-destructive">
                    Unable to search locations.{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        retry()
                      }}
                      className="underline underline-offset-2 hover:text-destructive/80 font-medium"
                    >
                      Try again
                    </button>
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export const LocationSearchAutocomplete = memo(LocationSearchAutocompleteBase)
LocationSearchAutocomplete.displayName = 'LocationSearchAutocomplete'
