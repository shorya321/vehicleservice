'use client';

/**
 * Location Autocomplete Component
 * Business portal specific - self-contained, no shared imports
 *
 * Features:
 * - Client-side filtering of locations
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click-outside detection
 * - Location type icons
 */

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Plane, Building2, Hotel, Train, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Location {
  id: string;
  name: string;
  city: string;
  type?: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (locationId: string) => void;
  placeholder: string;
  disabled?: boolean;
  locations: Location[];
}

function getLocationIcon(type?: string) {
  const iconClass = 'h-4 w-4 text-primary';
  switch (type) {
    case 'airport':
      return <Plane className={iconClass} aria-hidden="true" />;
    case 'city':
      return <Building2 className={iconClass} aria-hidden="true" />;
    case 'hotel':
      return <Hotel className={iconClass} aria-hidden="true" />;
    case 'station':
      return <Train className={iconClass} aria-hidden="true" />;
    default:
      return <MapPin className={iconClass} aria-hidden="true" />;
  }
}

export function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  disabled = false,
  locations,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter locations based on input
  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = value.toLowerCase();
    const filtered = locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(query) ||
        loc.city.toLowerCase().includes(query)
    );

    setSuggestions(filtered.slice(0, 10)); // Max 10 results
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(-1);
  }, [value, locations]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (location: Location) => {
    onChange(`${location.name} - ${location.city}`);
    onSelect(location.id);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"
          aria-hidden="true"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.length >= 2 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={placeholder}
          aria-autocomplete="list"
          aria-controls={showSuggestions ? 'location-suggestions' : undefined}
          aria-expanded={showSuggestions}
          className="pl-10"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          id="location-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((location, index) => (
            <button
              key={location.id}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(location)}
              className={cn(
                'w-full px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                index === selectedIndex
                  ? 'bg-primary/10'
                  : 'hover:bg-muted/50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getLocationIcon(location.type)}</div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">
                    {location.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {location.city}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
