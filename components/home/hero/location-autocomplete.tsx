"use client"
import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Location } from '@/lib/types/location'
import { Plane, Building2, Hotel, Train, MapPin } from 'lucide-react'
import type { LocationAutocompleteProps } from './types'

function getLocationIcon(type?: string) {
  const iconClass = "h-4 w-4 text-luxury-gold"
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

export function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  ariaLabel,
  selectedLocation
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Location[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)
  const selectedLocationRef = useRef(selectedLocation)

  // Keep selectedLocationRef in sync without triggering search
  useEffect(() => {
    selectedLocationRef.current = selectedLocation
  }, [selectedLocation])

  // Search locations with debounce
  useEffect(() => {
    if (selectedLocationRef.current && selectedLocationRef.current.name === value) {
      setShowSuggestions(false)
      return
    }

    if (value.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const thisRequestId = ++requestIdRef.current

    const searchLocations = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('is_active', true)
          .or(`name.ilike.%${value}%,city.ilike.%${value}%`)
          .order('type', { ascending: false })
          .order('name')
          .limit(10)

        if (error) throw error

        if (thisRequestId !== requestIdRef.current) return

        setSuggestions(data || [])
        setShowSuggestions((data || []).length > 0)
      } catch (error) {
        console.error('Error searching locations:', error)
        if (thisRequestId !== requestIdRef.current) return
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        if (thisRequestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    }

    const debounce = setTimeout(searchLocations, 300)
    return () => clearTimeout(debounce)
  }, [value])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
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
  }

  const handleSelect = (location: Location) => {
    onSelect(location)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full flex-grow">
      <MapPin
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none z-10 text-luxury-gold"
        aria-hidden="true"
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={showSuggestions ? "location-suggestions" : undefined}
        aria-expanded={showSuggestions}
        className="luxury-input w-full h-14 pl-12 text-base text-luxury-pearl placeholder:text-luxury-gold/70"
      />

      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div
            className="animate-spin h-4 w-4 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full"
            role="status"
            aria-label="Loading suggestions"
          >
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          id="location-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 luxury-card luxury-scrollbar max-h-60 overflow-y-auto"
        >
          {suggestions.map((location, index) => (
            <button
              key={location.id}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(location)}
              className={`w-full px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-inset ${
                index === selectedIndex
                  ? 'bg-luxury-gold/20'
                  : 'hover:bg-luxury-gold/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getLocationIcon(location.type)}</div>
                <div className="flex-1">
                  <div className="font-medium text-luxury-pearl">{location.name}</div>
                  <div className="text-sm text-luxury-lightGray">
                    {location.city ? `${location.city}, ` : ''}{location.country_code}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
