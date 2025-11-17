'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { createRoute, updateRoute } from "../actions"
import { RouteWithLocations } from "@/lib/types/route"
import { Location } from "@/lib/types/location"
import { Loader2 } from "lucide-react"

const routeSchema = z.object({
  origin_location_id: z.string().min(1, "Origin location is required"),
  destination_location_id: z.string().min(1, "Destination location is required"),
  route_name: z.string().min(1, "Route name is required").max(255),
  route_slug: z.string().min(1, "Route slug is required").max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  distance_km: z.coerce.number().positive("Distance must be positive"),
  estimated_duration_minutes: z.coerce.number().int().positive("Duration must be positive"),
  is_active: z.boolean(),
  is_popular: z.boolean(),
}).refine((data) => data.origin_location_id !== data.destination_location_id, {
  message: "Origin and destination must be different",
  path: ["destination_location_id"],
})

type RouteFormValues = z.infer<typeof routeSchema>

interface RouteFormProps {
  route?: RouteWithLocations
  locations: Location[]
}

export function RouteForm({ route, locations }: RouteFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      origin_location_id: route?.origin_location_id || "",
      destination_location_id: route?.destination_location_id || "",
      route_name: route?.route_name || "",
      route_slug: route?.route_slug || "",
      distance_km: route?.distance_km || 0,
      estimated_duration_minutes: route?.estimated_duration_minutes || 0,
      is_active: route?.is_active ?? true,
      is_popular: route?.is_popular ?? false,
    },
  })

  const pickupLocations = locations.filter(loc => loc.allow_pickup)
  const dropoffLocations = locations.filter(loc => loc.allow_dropoff)

  const generateSlug = () => {
    const originId = form.getValues('origin_location_id')
    const destinationId = form.getValues('destination_location_id')
    
    if (originId && destinationId) {
      const origin = locations.find(loc => loc.id === originId)
      const destination = locations.find(loc => loc.id === destinationId)
      
      if (origin && destination) {
        const slug = `${origin.name}-to-${destination.name}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
        
        form.setValue('route_slug', slug)
      }
    }
  }

  const generateRouteName = () => {
    const originId = form.getValues('origin_location_id')
    const destinationId = form.getValues('destination_location_id')
    
    if (originId && destinationId) {
      const origin = locations.find(loc => loc.id === originId)
      const destination = locations.find(loc => loc.id === destinationId)
      
      if (origin && destination) {
        form.setValue('route_name', `${origin.name} to ${destination.name}`)
      }
    }
  }

  const onSubmit = async (data: RouteFormValues) => {
    try {
      setIsLoading(true)
      
      if (route) {
        await updateRoute(route.id, data)
        toast.success("Route updated successfully")
      } else {
        await createRoute(data)
        toast.success("Route created successfully")
      }
      
      router.push('/admin/routes')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="origin_location_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origin Location</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value)
                    generateRouteName()
                    generateSlug()
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select origin location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pickupLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Location where the journey starts
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="destination_location_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination Location</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value)
                    generateRouteName()
                    generateSlug()
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {dropoffLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Location where the journey ends
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="route_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Route Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Display name for the route
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="route_slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Route Slug</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                URL-friendly version of the route name (lowercase, hyphens only)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="distance_km"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distance (km)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimated_duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <FormDescription>
                    Make this route available for bookings
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_popular"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Popular Route</FormLabel>
                  <FormDescription>
                    Feature this route as a popular destination
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {route ? 'Update Route' : 'Create Route'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/routes')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}