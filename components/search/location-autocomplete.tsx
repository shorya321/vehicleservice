'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createPublicClient } from '@/lib/supabase/public-client'
import { sanitizePostgrestInput } from '@/lib/utils/postgrest-sanitize'

interface Location {
  id: string
  name: string
  city: string | null
  country_code: string
}

interface LocationAutocompleteProps {
  placeholder: string
  onSelect: (location: Location | null) => void
  value?: string
  className?: string
}

export function LocationAutocomplete({
  placeholder,
  onSelect,
  value = '',
  className = ''
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<Location[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createPublicClient(), [])

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (inputValue.length < 2) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    let loadingTimeoutId: ReturnType<typeof setTimeout>

    const search = async () => {
      setIsLoading(true)

      loadingTimeoutId = setTimeout(() => {
        controller.abort()
        setSuggestions([])
        setIsLoading(false)
      }, 8000)

      try {
        const sanitized = sanitizePostgrestInput(inputValue)
        if (sanitized.length < 2) {
          clearTimeout(loadingTimeoutId)
          setSuggestions([])
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('locations')
          .select('id, name, city, country_code')
          .or(`name.ilike.%${sanitized}%,city.ilike.%${sanitized}%`)
          .eq('is_active', true)
          .order('name')
          .limit(10)
          .abortSignal(controller.signal)

        clearTimeout(loadingTimeoutId)
        if (error) throw error
        setSuggestions(data || [])
      } catch (err) {
        if (controller.signal.aborted) return
        clearTimeout(loadingTimeoutId)
        setSuggestions([])
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    const debounce = setTimeout(search, 300)
    return () => {
      clearTimeout(debounce)
      clearTimeout(loadingTimeoutId)
      controller.abort()
    }
  }, [supabase, inputValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setIsOpen(true)
    onSelect(null)
  }

  const handleLocationSelect = (location: Location) => {
    setInputValue(location.name)
    setIsOpen(false)
    setSuggestions([])
    onSelect(location)
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />

      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          )}

          {suggestions.map((location) => (
            <button
              key={location.id}
              onClick={() => handleLocationSelect(location)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
            >
              <div className="font-medium">{location.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {location.city}, {location.country_code}
              </div>
            </button>
          ))}

          {!isLoading && suggestions.length === 0 && inputValue.length >= 2 && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No locations found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
