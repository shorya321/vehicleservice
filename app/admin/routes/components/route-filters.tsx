'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Location } from "@/lib/types/location"

interface RouteFiltersProps {
  initialFilters: {
    search?: string
    originLocationId?: string
    destinationLocationId?: string
    isActive?: boolean | 'all'
    isPopular?: boolean | 'all'
  }
}

export function RouteFilters({ initialFilters }: RouteFiltersProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialFilters.search || '')
  const [originLocationId, setOriginLocationId] = useState(initialFilters.originLocationId || 'all')
  const [destinationLocationId, setDestinationLocationId] = useState(initialFilters.destinationLocationId || 'all')
  const [isActive, setIsActive] = useState(
    initialFilters.isActive === true ? 'true' : initialFilters.isActive === false ? 'false' : 'all'
  )
  const [isPopular, setIsPopular] = useState(
    initialFilters.isPopular === true ? 'true' : initialFilters.isPopular === false ? 'false' : 'all'
  )
  const [locations, setLocations] = useState<Location[]>([])

  useEffect(() => {
    const loadLocations = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (data) {
        setLocations(data)
      }
    }
    loadLocations()
  }, [])

  const handleFilter = () => {
    const params = new URLSearchParams()
    
    if (search) params.set('search', search)
    if (originLocationId && originLocationId !== 'all') params.set('originLocationId', originLocationId)
    if (destinationLocationId && destinationLocationId !== 'all') params.set('destinationLocationId', destinationLocationId)
    if (isActive !== 'all') params.set('isActive', isActive)
    if (isPopular !== 'all') params.set('isPopular', isPopular)
    
    router.push(`/admin/routes?${params.toString()}`)
  }

  const handleReset = () => {
    setSearch('')
    setOriginLocationId('all')
    setDestinationLocationId('all')
    setIsActive('all')
    setIsPopular('all')
    router.push('/admin/routes')
  }

  const hasActiveFilters = search || 
    (originLocationId && originLocationId !== 'all') || 
    (destinationLocationId && destinationLocationId !== 'all') ||
    isActive !== 'all' || 
    isPopular !== 'all'

  return (
    <div className="space-y-4 bg-card p-4 rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search routes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Origin Location</label>
          <Select value={originLocationId} onValueChange={setOriginLocationId}>
            <SelectTrigger>
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.filter(loc => loc.allow_pickup).map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name} ({location.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Destination Location</label>
          <Select value={destinationLocationId} onValueChange={setDestinationLocationId}>
            <SelectTrigger>
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.filter(loc => loc.allow_dropoff).map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name} ({location.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={isActive} onValueChange={setIsActive}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Popular Routes</label>
          <Select value={isPopular} onValueChange={setIsPopular}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Popular Only</SelectItem>
              <SelectItem value="false">Regular Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleFilter}>
          Apply Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleReset}>
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
}