"use client"
import { useCallback, useState } from 'react'
import type { LocationSearchResult } from '@/lib/types/location'

/**
 * The typed text and the chosen location of one location field. Typing
 * anything other than the chosen name un-chooses it, so a search can never go
 * out for a place the box no longer shows.
 */
export function useLocationInput() {
  const [location, setLocation] = useState<LocationSearchResult | null>(null)
  const [input, setInput] = useState('')

  const onInput = useCallback((value: string) => {
    setInput(value)
    setLocation((prev) => (prev && prev.name === value ? prev : null))
  }, [])

  const onSelect = useCallback((next: LocationSearchResult) => {
    setLocation(next)
    setInput(next.name)
  }, [])

  const set = useCallback((next: LocationSearchResult | null) => {
    setLocation(next)
    setInput(next?.name ?? '')
  }, [])

  return { location, input, onInput, onSelect, set }
}
