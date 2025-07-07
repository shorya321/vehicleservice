'use client'

import { useRef, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { StandaloneSearchBox } from '@react-google-maps/api'
import { useGoogleMaps } from './google-maps-provider'

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void
  placeholder?: string
  disabled?: boolean
}

export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search for an address...",
  disabled = false
}: AddressAutocompleteProps) {
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [inputValue, setInputValue] = useState(value)

  const { isLoaded, loadError } = useGoogleMaps()

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handlePlacesChanged = () => {
    if (searchBoxRef.current) {
      const places = searchBoxRef.current.getPlaces()
      if (places && places.length > 0) {
        const place = places[0]
        const formattedAddress = place.formatted_address || ''
        
        setInputValue(formattedAddress)
        onChange(formattedAddress)
        onPlaceSelect(place)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
  }

  if (loadError) {
    return (
      <div className="text-sm text-destructive">
        Error loading Google Maps. Please check your API key.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading maps...</span>
      </div>
    )
  }

  return (
    <StandaloneSearchBox
      onLoad={(ref) => {
        searchBoxRef.current = ref
      }}
      onPlacesChanged={handlePlacesChanged}
    >
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    </StandaloneSearchBox>
  )
}