import { Location } from '@/lib/types/location'

export interface SearchFormData {
  fromLocation: Location | null
  toLocation: Location | null
  passengers: number
  selectedDate: string
}

export interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (location: Location) => void
  placeholder: string
  ariaLabel: string
  selectedLocation: Location | null
}
