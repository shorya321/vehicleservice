'use client'

import { useState, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { MapPin, Search, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Zone } from '../actions'
import { LocationWithZone, assignLocationToZone, bulkAssignLocationsToZone } from '../[id]/locations/actions'

interface LocationAssignmentProps {
  zone: Zone
  locations: LocationWithZone[]
  currentSearch: string
  currentZoneFilter: string
}

export function LocationAssignment({ zone, locations, currentSearch, currentZoneFilter }: LocationAssignmentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(currentSearch)
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set())
  const [savingLocation, setSavingLocation] = useState<string | null>(null)
  const [bulkSaving, setBulkSaving] = useState(false)

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateParams({ search: searchInput })
  }

  const handleZoneFilterChange = (value: string) => {
    updateParams({ zoneFilter: value })
  }

  const handleAssignLocation = async (location: LocationWithZone) => {
    setSavingLocation(location.id)

    const newZoneId = location.zone_id === zone.id ? null : zone.id
    const result = await assignLocationToZone(location.id, newZoneId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(newZoneId
        ? `${location.name} assigned to ${zone.name}`
        : `${location.name} removed from ${zone.name}`)
      router.refresh()
    }

    setSavingLocation(null)
  }

  const handleBulkAssign = async () => {
    if (selectedLocations.size === 0) {
      toast.error('Please select locations to assign')
      return
    }

    setBulkSaving(true)

    const result = await bulkAssignLocationsToZone(
      Array.from(selectedLocations),
      zone.id
    )

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${selectedLocations.size} location(s) assigned to ${zone.name}`)
      setSelectedLocations(new Set())
      router.refresh()
    }

    setBulkSaving(false)
  }

  const handleBulkRemove = async () => {
    if (selectedLocations.size === 0) {
      toast.error('Please select locations to remove')
      return
    }

    setBulkSaving(true)

    const result = await bulkAssignLocationsToZone(
      Array.from(selectedLocations),
      null
    )

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${selectedLocations.size} location(s) removed from zones`)
      setSelectedLocations(new Set())
      router.refresh()
    }

    setBulkSaving(false)
  }

  const toggleSelectAll = () => {
    if (selectedLocations.size === locations.length) {
      setSelectedLocations(new Set())
    } else {
      setSelectedLocations(new Set(locations.map(l => l.id)))
    }
  }

  const toggleSelectLocation = (locationId: string) => {
    const newSelected = new Set(selectedLocations)
    if (newSelected.has(locationId)) {
      newSelected.delete(locationId)
    } else {
      newSelected.add(locationId)
    }
    setSelectedLocations(newSelected)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </form>
        <Select value={currentZoneFilter} onValueChange={handleZoneFilterChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value={zone.id}>In {zone.name}</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedLocations.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
          <span className="text-sm font-medium">
            {selectedLocations.size} location(s) selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleBulkAssign}
              disabled={bulkSaving}
            >
              {bulkSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign to {zone.name}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkRemove}
              disabled={bulkSaving}
            >
              {bulkSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove from Zones
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    locations.length > 0 &&
                    selectedLocations.size === locations.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Location</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Current Zone</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No locations found
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => {
                const isInThisZone = location.zone_id === zone.id
                const isLoading = savingLocation === location.id

                return (
                  <TableRow key={location.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLocations.has(location.id)}
                        onCheckedChange={() => toggleSelectLocation(location.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {location.name}
                      </div>
                    </TableCell>
                    <TableCell>{location.city}</TableCell>
                    <TableCell>{location.country_code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{location.location_type_label || 'Location'}</Badge>
                    </TableCell>
                    <TableCell>
                      {location.zone_name ? (
                        <Badge
                          variant={isInThisZone ? 'default' : 'secondary'}
                        >
                          {location.zone_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={isInThisZone ? 'outline' : 'default'}
                        onClick={() => handleAssignLocation(location)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isInThisZone ? (
                          <>
                            <X className="mr-1 h-3 w-3" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Check className="mr-1 h-3 w-3" />
                            Assign
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
