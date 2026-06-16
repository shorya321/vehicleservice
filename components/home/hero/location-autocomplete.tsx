"use client"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPublicClient } from '@/lib/supabase/public-client'
import { Location } from '@/lib/types/location'
import { sanitizePostgrestInput } from '@/lib/utils/postgrest-sanitize'
import { Plane, Building2, Hotel, Train, MapPin } from 'lucide-react'
import type { LocationAutocompleteProps } from './types'

function getLocationIcon(type?: string) {
  const iconClass = "h-4 w-4 text-[var(--gold-text)]"
  switch(type) {
    case 'airport':
      return <Plane className={iconClass} aria-hidden="true" />
    case 'city':
      return <Building2 className={iconClass} aria-hidden="true" />
    case 'hotel':
      return <Hotel className={iconClass} aria-hidden="true" />
    case 'station':
      return <Train className={iconClass} aria-hidden="true" />
    default:
      return <MapPin className={iconClass} aria-hidden="true" />
  }
}

function LocationAutocompleteBase({
  value,
  onChange,
  onSelect,
  placeholder,
  ariaLabel,
  selectedLocation,
  id,
}: LocationAutocompleteProps & { id?: string }) {
  const [suggestions, setSuggestions] = useState<Location[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedLocationRef = useRef(selectedLocation)
  const supabase = useMemo(() => createPublicClient(), [])

  useEffect(() => {
    selectedLocationRef.current = selectedLocation
  }, [selectedLocation])

  useEffect(() => {
    if (selectedLocationRef.current && selectedLocationRef.current.name === value) {
      setShowSuggestions(false)
      return
    }

    if (value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      setHasSearched(false)
      setSearchError(false)
      return
    }

    const controller = new AbortController()
    let loadingTimeoutId: ReturnType<typeof setTimeout>

    const searchLocations = async () => {
      setLoading(true)
      setSearchError(false)

      loadingTimeoutId = setTimeout(() => {
        controller.abort()
        setSuggestions([])
        setHasSearched(true)
        setSearchError(true)
        setShowSuggestions(true)
        setLoading(false)
      }, 8000)

      try {
        const sanitized = sanitizePostgrestInput(value)
        if (sanitized.length < 2) {
          clearTimeout(loadingTimeoutId)
          setSuggestions([])
          setHasSearched(true)
          setShowSuggestions(true)
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('is_active', true)
          .or(`name.ilike.%${sanitized}%,city.ilike.%${sanitized}%`)
          .order('type', { ascending: false })
          .order('name')
          .limit(10)
          .abortSignal(controller.signal)

        clearTimeout(loadingTimeoutId)
        if (error) throw error

        setSuggestions(data || [])
        setHasSearched(true)
        setShowSuggestions(true)
      } catch (err) {
        if (controller.signal.aborted) return
        clearTimeout(loadingTimeoutId)
        setSuggestions([])
        setHasSearched(true)
        setSearchError(true)
        setShowSuggestions(true)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    const debounce = setTimeout(searchLocations, 300)
    return () => {
      clearTimeout(debounce)
      clearTimeout(loadingTimeoutId)
      controller.abort()
    }
  }, [supabase, value])

  const handleSelect = useCallback((location: Location) => {
    onSelect(location)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }, [onSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }, [handleSelect, selectedIndex, showSuggestions, suggestions])

  useEffect(() => {
    if (!showSuggestions) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSuggestions])

  return (
    <div ref={containerRef} className="relative w-full flex-grow">
      <MapPin
        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10 ${
          selectedLocation ? 'text-[var(--gold-text)]' : 'text-[var(--text-muted)]'
        }`}
        aria-hidden="true"
      />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={showSuggestions ? `${id}-suggestions` : undefined}
        aria-expanded={showSuggestions}
        className="search-bar-input search-bar-input--location pl-9"
      />

      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div
            className="animate-spin h-4 w-4 border-2 border-[var(--graphite)] border-t-[var(--gold)] rounded-full"
            role="status"
            aria-label="Loading suggestions"
          >
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}

      {showSuggestions && (
        <div
          id={`${id}-suggestions`}
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-[var(--graphite)] bg-[var(--charcoal)] shadow-lg max-h-60 overflow-y-auto luxury-scrollbar"
        >
          {suggestions.map((location, index) => (
            <button
              key={location.id}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(location)}
              className={`w-full px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-inset ${
                index === selectedIndex
                  ? 'bg-[var(--charcoal-light)]'
                  : 'hover:bg-[var(--charcoal-light)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getLocationIcon(location.type)}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--text-primary)]">{location.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {location.city ? `${location.city}, ` : ''}{location.country_code}
                  </div>
                </div>
              </div>
            </button>
          ))}
          <div role="status" aria-live="polite">
            {!loading && hasSearched && suggestions.length === 0 && !searchError && (
              <div className="px-4 py-3 text-sm text-[var(--text-muted)]">
                No locations found for &ldquo;{value}&rdquo;
              </div>
            )}
            {!loading && searchError && (
              <div className="px-4 py-3 text-sm text-[hsl(var(--destructive))]">
                Unable to search locations. Try again.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const LocationAutocomplete = memo(LocationAutocompleteBase)
LocationAutocomplete.displayName = 'LocationAutocomplete'
