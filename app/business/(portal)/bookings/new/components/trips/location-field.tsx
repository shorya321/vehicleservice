'use client';

/**
 * A location picker that refuses locations closed for pickups or drop-offs.
 * SCOPE: Business module ONLY. Uses the same location search the one-way Route step uses.
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { LocationSearchAutocomplete } from '@/components/search/location-search-autocomplete';
import type { LocationSearchResult } from '@/lib/types/location';

interface LocationFieldProps {
  id: string;
  label: string;
  name: string;
  /** Which flag the location must not have switched off. */
  role: 'pickup' | 'dropoff';
  placeholder: string;
  onSelect: (location: { id: string; name: string }) => void;
}

export function LocationField({ id, label, name, role, placeholder, onSelect }: LocationFieldProps) {
  const [input, setInput] = useState(name);
  const [error, setError] = useState<string | null>(null);

  function handleSelect(location: LocationSearchResult) {
    // Null means unrestricted. Recent searches carry null flags, so the server checks again.
    const closed = role === 'pickup' ? location.allow_pickup === false : location.allow_dropoff === false;
    if (closed) {
      setError(`${location.name} is not available for ${role === 'pickup' ? 'pickups' : 'drop-offs'}.`);
      setInput(name);
      return;
    }
    setError(null);
    setInput(location.name);
    onSelect({ id: location.id, name: location.name });
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <LocationSearchAutocomplete value={input} onChange={setInput} onSelect={handleSelect} placeholder={placeholder} id={id} />
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
