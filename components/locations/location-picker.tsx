'use client'

import { useCallback, useRef, useState } from 'react'
import { LocationSearchAutocomplete } from '@/components/search/location-search-autocomplete'
import type { LocationSearchResult } from '@/lib/types/location'

export interface LocationPickerInitialValue {
  id: string
  name: string
}

interface LocationPickerProps {
  /** Currently committed location id, or null when nothing is picked. */
  value: string | null
  /** Fires with the picked location, or (null, null) when the selection is dropped. */
  onChange: (id: string | null, name: string | null) => void
  /** Pre-fills the field on mount without triggering a search (edit / URL restore). */
  initialLocation?: LocationPickerInitialValue | null
  placeholder?: string
  id?: string
  ariaLabel?: string
}

/**
 * Widen a bare { id, name } into the shape LocationSearchAutocomplete expects.
 * Only `name` is read (to suppress the mount-time search), so the remaining
 * fields are inert placeholders.
 */
function toSearchResult(location: LocationPickerInitialValue): LocationSearchResult {
  return {
    id: location.id,
    name: location.name,
    address: null,
    city: null,
    country_code: '',
    slug: '',
    country_slug: '',
    latitude: null,
    longitude: null,
    location_type_id: '',
    location_type_label: '',
    location_type_icon: '',
    location_type_sort: 0,
    allow_pickup: null,
    allow_dropoff: null,
    relevance: 0,
  }
}

/**
 * Type-to-search location field backed by the `search_locations` RPC.
 *
 * Wraps LocationSearchAutocomplete so callers only deal in ids. Free typing
 * that no longer matches the picked location drops the id, so a stale
 * selection can never be submitted after the text is edited.
 */
export function LocationPicker({
  value,
  onChange,
  initialLocation = null,
  placeholder = 'Search location...',
  id,
  ariaLabel,
}: LocationPickerProps) {
  const initialSelected = initialLocation ? toSearchResult(initialLocation) : null

  const [text, setText] = useState(initialLocation?.name ?? '')
  const [selected, setSelected] = useState<LocationSearchResult | null>(initialSelected)

  // The autocomplete fires onSelect and then onChange(name) within the same
  // event, so the guard below has to read a value that is already up to date.
  // State would still be stale at that point; the ref is not.
  const selectedRef = useRef<LocationSearchResult | null>(initialSelected)

  const commitSelection = useCallback((next: LocationSearchResult | null) => {
    selectedRef.current = next
    setSelected(next)
  }, [])

  // Mirror external clears (form reset, "Clear filters") back into the input.
  // Adjusted during render rather than in an effect so the input never paints
  // a stale name for a cleared value.
  // The ref is deliberately left alone here (writing it during render is not
  // allowed); it self-heals on the next keystroke, which only ever clears an
  // already-null value.
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    if (!value && selected) {
      setSelected(null)
      setText('')
    }
  }

  const handleSelect = useCallback(
    (location: LocationSearchResult) => {
      commitSelection(location)
      setText(location.name)
      onChange(location.id, location.name)
    },
    [commitSelection, onChange]
  )

  const handleTextChange = useCallback(
    (next: string) => {
      setText(next)

      // Typing away from the picked location invalidates it.
      if (selectedRef.current && selectedRef.current.name !== next) {
        commitSelection(null)
        onChange(null, null)
      }
    },
    [commitSelection, onChange]
  )

  return (
    <LocationSearchAutocomplete
      value={text}
      onChange={handleTextChange}
      onSelect={handleSelect}
      selectedLocation={selected}
      variant="default"
      placeholder={placeholder}
      id={id}
      ariaLabel={ariaLabel}
    />
  )
}
