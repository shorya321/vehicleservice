'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createVendorRoute } from "../actions"
import { useRouter } from "next/navigation"

const createRouteSchema = z.object({
  origin_location_id: z.string().uuid('Please select an origin location'),
  destination_location_id: z.string().uuid('Please select a destination location'),
  route_name: z.string().min(1, 'Route name is required').max(255, 'Route name must be less than 255 characters'),
  route_slug: z.string().min(1, 'Route slug is required').max(255, 'Route slug must be less than 255 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
  distance_km: z.number().min(0.1, 'Distance must be at least 0.1 km').max(10000, 'Distance cannot exceed 10,000 km'),
  estimated_duration_minutes: z.number().min(1, 'Duration must be at least 1 minute').max(10080, 'Duration cannot exceed 7 days'),
  base_price: z.number().min(0, 'Base price cannot be negative').max(100000, 'Base price cannot exceed 100,000'),
  is_active: z.boolean().default(true),
  is_popular: z.boolean().default(false),
  is_shared: z.boolean().default(false)
})

type CreateRouteFormData = z.infer<typeof createRouteSchema>

interface CreateRouteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations?: Array<{
    id: string
    name: string
    city: string
    country_code: string
    type: string
  }>
}

export function CreateRouteDialog({ open, onOpenChange, locations = [] }: CreateRouteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    clearErrors
  } = useForm<CreateRouteFormData>({
    resolver: zodResolver(createRouteSchema),
    defaultValues: {
      is_active: true,
      is_popular: false,
      is_shared: false
    }
  })

  const originLocationId = watch('origin_location_id')
  const destinationLocationId = watch('destination_location_id')

  const onSubmit = async (data: CreateRouteFormData) => {
    if (data.origin_location_id === data.destination_location_id) {
      toast.error('Origin and destination must be different')
      return
    }

    setIsLoading(true)
    try {
      await createVendorRoute(data)
      toast.success('Route created successfully')
      reset()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error creating route:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create route')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
    }
    onOpenChange(newOpen)
  }

  const handleLocationChange = (field: 'origin_location_id' | 'destination_location_id', value: string) => {
    setValue(field, value)
    clearErrors(field)
    
    // Auto-generate route name and slug based on selected locations
    if (field === 'origin_location_id' || field === 'destination_location_id') {
      const currentOrigin = field === 'origin_location_id' ? value : originLocationId
      const currentDestination = field === 'destination_location_id' ? value : destinationLocationId
      
      if (currentOrigin && currentDestination) {
        const originLocation = locations.find(l => l.id === currentOrigin)
        const destinationLocation = locations.find(l => l.id === currentDestination)
        
        if (originLocation && destinationLocation) {
          const routeName = `${originLocation.city} to ${destinationLocation.city}`
          setValue('route_name', routeName)
          clearErrors('route_name')
          
          // Auto-generate slug
          const slug = `${originLocation.name}-to-${destinationLocation.name}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
          setValue('route_slug', slug)
          clearErrors('route_slug')
        }
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Route</DialogTitle>
          <DialogDescription>
            Create a new route between two locations for your transfer services.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin_location_id">Origin Location</Label>
              <Select
                value={originLocationId}
                onValueChange={(value) => handleLocationChange('origin_location_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select origin location" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter(location => location.id !== destinationLocationId)
                    .map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.city}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.origin_location_id && (
                <p className="text-sm text-red-600">{errors.origin_location_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination_location_id">Destination Location</Label>
              <Select
                value={destinationLocationId}
                onValueChange={(value) => handleLocationChange('destination_location_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination location" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter(location => location.id !== originLocationId)
                    .map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.city}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.destination_location_id && (
                <p className="text-sm text-red-600">{errors.destination_location_id.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route_name">Route Name</Label>
            <Input
              id="route_name"
              {...register('route_name')}
              placeholder="e.g., Dubai Airport to Downtown"
            />
            {errors.route_name && (
              <p className="text-sm text-red-600">{errors.route_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="route_slug">Route Slug</Label>
            <Input
              id="route_slug"
              {...register('route_slug')}
              placeholder="e.g., dubai-airport-to-downtown"
            />
            <p className="text-sm text-muted-foreground">
              URL-friendly version of the route name (lowercase, hyphens only)
            </p>
            {errors.route_slug && (
              <p className="text-sm text-red-600">{errors.route_slug.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distance_km">Distance (km)</Label>
              <Input
                id="distance_km"
                type="number"
                step="0.1"
                {...register('distance_km', { valueAsNumber: true })}
                placeholder="e.g., 25.5"
              />
              {errors.distance_km && (
                <p className="text-sm text-red-600">{errors.distance_km.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_duration_minutes">Duration (minutes)</Label>
              <Input
                id="estimated_duration_minutes"
                type="number"
                {...register('estimated_duration_minutes', { valueAsNumber: true })}
                placeholder="e.g., 45"
              />
              {errors.estimated_duration_minutes && (
                <p className="text-sm text-red-600">{errors.estimated_duration_minutes.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_price">Base Price</Label>
            <Input
              id="base_price"
              type="number"
              step="0.01"
              {...register('base_price', { valueAsNumber: true })}
              placeholder="e.g., 150.00"
            />
            {errors.base_price && (
              <p className="text-sm text-red-600">{errors.base_price.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={watch('is_active')}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
              <Label htmlFor="is_active">Active Route</Label>
              <span className="text-sm text-muted-foreground">(Make this route available for bookings)</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_popular"
                checked={watch('is_popular')}
                onCheckedChange={(checked) => setValue('is_popular', checked)}
              />
              <Label htmlFor="is_popular">Popular Route</Label>
              <span className="text-sm text-muted-foreground">(Feature this route as a popular destination)</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_shared"
                checked={watch('is_shared')}
                onCheckedChange={(checked) => setValue('is_shared', checked)}
              />
              <Label htmlFor="is_shared">Share this route with other vendors</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Route'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}