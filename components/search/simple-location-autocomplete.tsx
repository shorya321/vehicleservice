'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Location } from '@/lib/types/location'

interface SimpleLocationAutocompleteProps {
  value?: string
  onSelect: (location: Location) => void
  placeholder?: string
  className?: string
  icon?: boolean
}

export function SimpleLocationAutocomplete({
  value = '',
  onSelect,
  placeholder = 'Select location',
  className,
  icon = true
}: SimpleLocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const searchLocations = async () => {
      if (inputValue.length < 2) {
        setLocations([])
        setShowDropdown(false)
        return
      }

      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('is_active', true)
          .or(`name.ilike.%${inputValue}%,city.ilike.%${inputValue}%`)
          .order('type', { ascending: false })
          .order('name')
          .limit(10)

        if (error) throw error
        setLocations(data || [])
        setShowDropdown((data || []).length > 0)
      } catch (error) {
        console.error('Error searching locations:', error)
        setLocations([])
        setShowDropdown(false)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchLocations, 300)
    return () => clearTimeout(debounceTimer)
  }, [inputValue])

  const handleSelect = (location: Location) => {
    setInputValue(location.name)
    onSelect(location)
    setShowDropdown(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || locations.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < locations.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : locations.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          handleSelect(locations[highlightedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const handleClear = () => {
    setInputValue('')
    setLocations([])
    setShowDropdown(false)
    onSelect(null as any)
    inputRef.current?.focus()
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        {icon && (
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
        )}
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setHighlightedIndex(-1)
          }}
          onFocus={() => {
            if (locations.length > 0) {
              setShowDropdown(true)
            }
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full pr-8",
            icon && "pl-10"
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {!loading && inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && locations.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover rounded-md border shadow-md max-h-[300px] overflow-auto">
          {locations.map((location, index) => (
            <button
              key={location.id}
              type="button"
              onClick={() => handleSelect(location)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors",
                "flex items-start gap-2",
                highlightedIndex === index && "bg-accent text-accent-foreground"
              )}
            >
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">{location.name}</div>
                <div className="text-sm text-muted-foreground">
                  {location.city}, {location.country_code}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}