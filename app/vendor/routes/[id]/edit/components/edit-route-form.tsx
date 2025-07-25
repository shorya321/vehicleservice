'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { updateVendorRoute } from "../../../actions"
import { RouteWithLocations } from "@/lib/types/route"
import { Location } from "@/lib/types/location"
import { Loader2 } from "lucide-react"

const editRouteSchema = z.object({
  origin_location_id: z.string().min(1, 'Origin location is required'),
  destination_location_id: z.string().min(1, 'Destination location is required'),
  route_name: z.string().min(1, 'Route name is required').max(255, 'Route name must be less than 255 characters'),
  route_slug: z.string().min(1, 'Route slug is required').max(255, 'Route slug must be less than 255 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
  distance_km: z.number().min(0.1, 'Distance must be at least 0.1 km').max(10000, 'Distance cannot exceed 10,000 km'),
  estimated_duration_minutes: z.number().min(1, 'Duration must be at least 1 minute').max(10080, 'Duration cannot exceed 7 days'),
  base_price: z.number().min(0, 'Base price cannot be negative').max(100000, 'Base price cannot exceed 100,000'),
  is_active: z.boolean(),
  is_popular: z.boolean(),
  is_shared: z.boolean()
}).refine((data) => data.origin_location_id !== data.destination_location_id, {
  message: "Origin and destination must be different",
  path: ["destination_location_id"],
})

type EditRouteFormData = z.infer<typeof editRouteSchema>

interface EditRouteFormProps {
  route: RouteWithLocations
  locations: Location[]
}

export function EditRouteForm({ route, locations }: EditRouteFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues
  } = useForm<EditRouteFormData>({
    resolver: zodResolver(editRouteSchema),
    defaultValues: {
      origin_location_id: route.origin_location_id,
      destination_location_id: route.destination_location_id,
      route_name: route.route_name,
      route_slug: route.route_slug,
      distance_km: route.distance_km,
      estimated_duration_minutes: route.estimated_duration_minutes,
      base_price: route.base_price,
      is_active: route.is_active,
      is_popular: route.is_popular || false,
      is_shared: route.is_shared || false
    }
  })

  const pickupLocations = locations.filter(loc => loc.allow_pickup !== false)
  const dropoffLocations = locations.filter(loc => loc.allow_dropoff !== false)

  const generateSlug = () => {
    const originId = getValues('origin_location_id')
    const destinationId = getValues('destination_location_id')
    
    if (originId && destinationId) {
      const origin = locations.find(loc => loc.id === originId)
      const destination = locations.find(loc => loc.id === destinationId)
      
      if (origin && destination) {
        const slug = `${origin.name}-to-${destination.name}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
        
        setValue('route_slug', slug)
      }
    }
  }

  const generateRouteName = () => {
    const originId = getValues('origin_location_id')
    const destinationId = getValues('destination_location_id')
    
    if (originId && destinationId) {
      const origin = locations.find(loc => loc.id === originId)
      const destination = locations.find(loc => loc.id === destinationId)
      
      if (origin && destination) {
        setValue('route_name', `${origin.name} to ${destination.name}`)
      }
    }
  }

  const onSubmit = async (data: EditRouteFormData) => {
    setIsLoading(true)
    try {
      await updateVendorRoute(route.id, {
        origin_location_id: data.origin_location_id,
        destination_location_id: data.destination_location_id,
        route_name: data.route_name,
        route_slug: data.route_slug,
        distance_km: data.distance_km,
        estimated_duration_minutes: data.estimated_duration_minutes,
        base_price: data.base_price,
        is_active: data.is_active,
        is_popular: data.is_popular,
        is_shared: data.is_shared
      })
      toast.success('Route updated successfully')
      router.push('/vendor/routes')
      router.refresh()
    } catch (error) {
      console.error('Error updating route:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update route')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="origin_location_id">Origin Location</Label>
          <Select
            value={watch('origin_location_id')}
            onValueChange={(value) => {
              setValue('origin_location_id', value)
              generateRouteName()
              generateSlug()
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select origin location" />
            </SelectTrigger>
            <SelectContent>
              {pickupLocations
                .filter(location => location.id !== watch('destination_location_id'))
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
            value={watch('destination_location_id')}
            onValueChange={(value) => {
              setValue('destination_location_id', value)
              generateRouteName()
              generateSlug()
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select destination location" />
            </SelectTrigger>
            <SelectContent>
              {dropoffLocations
                .filter(location => location.id !== watch('origin_location_id'))
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
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="is_active" className="text-base font-medium">Active Route</Label>
            <p className="text-sm text-muted-foreground">
              Make this route available for bookings
            </p>
          </div>
          <Switch
            id="is_active"
            checked={watch('is_active')}
            onCheckedChange={(checked) => setValue('is_active', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="is_popular" className="text-base font-medium">Popular Route</Label>
            <p className="text-sm text-muted-foreground">
              Feature this route as a popular destination
            </p>
          </div>
          <Switch
            id="is_popular"
            checked={watch('is_popular')}
            onCheckedChange={(checked) => setValue('is_popular', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="is_shared" className="text-base font-medium">Share Route</Label>
            <p className="text-sm text-muted-foreground">
              Allow other vendors to offer this route
            </p>
          </div>
          <Switch
            id="is_shared"
            checked={watch('is_shared')}
            onCheckedChange={(checked) => setValue('is_shared', checked)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/vendor/routes')}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Route'
          )}
        </Button>
      </div>
    </form>
  )
}