'use client'

import { useCallback, useState } from "react"
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
import { LocationPicker, type LocationPickerInitialValue } from "@/components/locations/location-picker"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { createRoute, updateRoute } from "../actions"
import { RouteWithLocations } from "@/lib/types/route"
import { ImageUpload } from "@/app/admin/(shell)/vehicle-types/components/image-upload"
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
  image_alt: z.string().max(255).optional(),
}).refine((data) => data.origin_location_id !== data.destination_location_id, {
  message: "Origin and destination must be different",
  path: ["destination_location_id"],
})

type RouteFormValues = z.infer<typeof routeSchema>

interface RouteFormProps {
  route?: RouteWithLocations
}

function toInitialLocation(
  id: string | null | undefined,
  name: string | null | undefined
): LocationPickerInitialValue | null {
  return id && name ? { id, name } : null
}

export function RouteForm({ route }: RouteFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // The image is not registered with react-hook-form: ImageUpload carries its
  // own size and MIME validation and hands back File objects, so it is held as
  // plain state and folded into the payload at submit time.
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(route?.image_url || null)

  // The pickers search live, so the selected names are tracked here rather
  // than looked up in a preloaded locations array.
  const [originName, setOriginName] = useState<string | null>(
    route?.origin_location?.name ?? null
  )
  const [destinationName, setDestinationName] = useState<string | null>(
    route?.destination_location?.name ?? null
  )

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
      image_alt: route?.image_alt || "",
    },
  })

  const { setValue } = form

  /**
   * Regenerate route name and slug once both endpoints are known. Names are
   * passed in explicitly so this never reads a value the caller just wrote.
   */
  const syncGeneratedFields = useCallback(
    (origin: string | null, destination: string | null) => {
      if (!origin || !destination) return

      setValue('route_name', `${origin} to ${destination}`)
      setValue(
        'route_slug',
        `${origin}-to-${destination}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      )
    },
    [setValue]
  )

  const handleImageChange = (files: File[]) => {
    if (files.length === 0) return

    const file = files[0]
    setImageFile(file)

    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleImageRemove = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const onSubmit = async (data: RouteFormValues) => {
    try {
      setIsLoading(true)

      // imageBase64 set means a new upload, existingImage set means keep the
      // URL already on the row, both null means the admin removed the image.
      let imageBase64: string | null = null
      if (imageFile) {
        const reader = new FileReader()
        imageBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(imageFile)
        })
      }

      const payload = {
        ...data,
        image_alt: data.image_alt || null,
        imageBase64,
        existingImage: !imageBase64 && imagePreview ? imagePreview : null,
      }

      if (route) {
        await updateRoute(route.id, payload)
        toast.success("Route updated successfully")
      } else {
        await createRoute(payload)
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
                <FormControl>
                  <LocationPicker
                    id="origin-location"
                    value={field.value || null}
                    initialLocation={toInitialLocation(
                      route?.origin_location_id,
                      route?.origin_location?.name
                    )}
                    onChange={(id, name) => {
                      field.onChange(id ?? "")
                      setOriginName(name)
                      syncGeneratedFields(name, destinationName)
                    }}
                    placeholder="Search origin location..."
                    ariaLabel="Origin location"
                  />
                </FormControl>
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
                <FormControl>
                  <LocationPicker
                    id="destination-location"
                    value={field.value || null}
                    initialLocation={toInitialLocation(
                      route?.destination_location_id,
                      route?.destination_location?.name
                    )}
                    onChange={(id, name) => {
                      field.onChange(id ?? "")
                      setDestinationName(name)
                      syncGeneratedFields(originName, name)
                    }}
                    placeholder="Search destination location..."
                    ariaLabel="Destination location"
                  />
                </FormControl>
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

        <div className="space-y-6 rounded-lg border p-4">
          <ImageUpload
            label="Route Image"
            description="Shown on the home page Routes rail. Landscape, at least 680x420px. Optional: routes without one fall back to a gradient plate."
            value={imagePreview || undefined}
            onChange={handleImageChange}
            onRemove={handleImageRemove}
            disabled={isLoading}
          />

          <FormField
            control={form.control}
            name="image_alt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image Alt Text</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>
                  What the photo shows, for screen readers. Leave blank to fall back to
                  &ldquo;Origin to Destination&rdquo;.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/routes')}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {route ? 'Update Route' : 'Create Route'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
