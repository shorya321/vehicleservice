'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Location {
  id: string
  name: string
  city: string
  country_code: string
}

export default function TestLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, city, country_code')
        .eq('is_active', true)
        .order('name')
        .limit(10)

      if (error) {
        setError(error.message)
      } else {
        setLocations(data || [])
      }
    } catch (err) {
      setError('Connection error: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const searchLocations = async (query: string) => {
    if (!query || query.length < 2) {
      fetchLocations()
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, city, country_code')
        .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
        .eq('is_active', true)
        .order('name')
        .limit(10)

      if (error) {
        setError(error.message)
      } else {
        setLocations(data || [])
      }
    } catch (err) {
      setError('Search error: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    searchLocations(value)
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Test Locations</h1>
      
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search locations (e.g., Jassur)"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && (
        <div className="text-center py-4">Loading...</div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {locations.map((location) => (
          <div key={location.id} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold">{location.name}</h3>
            <p className="text-gray-600">{location.city}, {location.country_code}</p>
            <p className="text-sm text-gray-500">ID: {location.id}</p>
          </div>
        ))}
      </div>

      {!loading && locations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No locations found
        </div>
      )}
    </div>
  )
}