"use client"
import type { LocationSearchResult } from '@/lib/types/location'
import { LocationSearchAutocomplete } from '@/components/search/location-search-autocomplete'

interface LocationFieldProps {
  id: string
  label: string
  placeholder: string
  ariaLabel: string
  input: string
  location: LocationSearchResult | null
  onInput: (value: string) => void
  onSelect: (location: LocationSearchResult) => void
}

export function LocationField({ id, label, placeholder, ariaLabel, input, location, onInput, onSelect }: LocationFieldProps) {
  return (
    <div className="search-bar-field search-bar-field--location">
      <label htmlFor={id} className="search-bar-label">{label}</label>
      <LocationSearchAutocomplete
        id={id}
        value={input}
        onChange={onInput}
        onSelect={onSelect}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
        selectedLocation={location}
        variant="hero"
      />
    </div>
  )
}
