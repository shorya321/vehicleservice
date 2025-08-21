'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
}

export function LocationAssignment({ zone, locations }: LocationAssignmentProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterZone, setFilterZone] = useState<string>('all')
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set())
  const [savingLocation, setSavingLocation] = useState<string | null>(null)
  const [bulkSaving, setBulkSaving] = useState(false)

  // Get unique zones for filter
  const uniqueZones = Array.from(
    new Set(locations.map(l => l.zone_name).filter(Boolean))
  ).sort()

  // Filter locations
  const filteredLocations = locations.filter(location => {
    const matchesSearch = !searchQuery || 
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.country_code.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesZone = filterZone === 'all' ||
      (filterZone === 'unassigned' && !location.zone_id) ||
      (filterZone === zone.id && location.zone_id === zone.id) ||
      (filterZone !== 'unassigned' && location.zone_id === filterZone)

    return matchesSearch && matchesZone
  })

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
    if (selectedLocations.size === filteredLocations.length) {
      setSelectedLocations(new Set())
    } else {
      setSelectedLocations(new Set(filteredLocations.map(l => l.id)))
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterZone} onValueChange={setFilterZone}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value={zone.id}>In {zone.name}</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {uniqueZones.map(zoneName => (
              <SelectItem key={zoneName} value={zoneName}>
                {zoneName}
              </SelectItem>
            ))}
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
                    filteredLocations.length > 0 &&
                    selectedLocations.size === filteredLocations.length
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
            {filteredLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No locations found
                </TableCell>
              </TableRow>
            ) : (
              filteredLocations.map((location) => {
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
                      <Badge variant="outline">{location.type}</Badge>
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