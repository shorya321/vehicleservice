'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database } from '@/lib/supabase/types'
import { AddressAutocomplete } from './address-autocomplete'
import { extractLocationDetails, getTimezoneByCountryCode } from './google-maps-utils'
import { MapPreview } from './map-preview'
import { GoogleMapsProvider } from './google-maps-provider'
import { createLocation, updateLocation } from '../actions'

type Location = Database['public']['Tables']['locations']['Row']
type LocationInsert = Database['public']['Tables']['locations']['Insert']
type LocationUpdate = Database['public']['Tables']['locations']['Update']

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['airport', 'city', 'hotel', 'station']),
  address: z.string().optional().nullable(),
  country_code: z.string().length(2, 'Country code must be 2 characters'),
  city: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  timezone: z.string().optional().nullable(),
  allow_pickup: z.boolean().default(true),
  allow_dropoff: z.boolean().default(true),
  is_active: z.boolean().default(true),
})

type LocationFormValues = z.infer<typeof locationSchema>

interface LocationFormProps {
  location?: Location
  mode: 'create' | 'edit'
}

export function LocationForm({ location, mode }: LocationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name || '',
      type: location?.type || 'airport',
      address: location?.address || '',
      country_code: location?.country_code || 'AE',
      city: location?.city || '',
      latitude: location?.latitude || null,
      longitude: location?.longitude || null,
      timezone: location?.timezone || 'Asia/Dubai',
      allow_pickup: location?.allow_pickup ?? true,
      allow_dropoff: location?.allow_dropoff ?? true,
      is_active: location?.is_active ?? true,
    },
  })

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    const details = extractLocationDetails(place)
    
    // Update form fields with the extracted details
    if (details.city) {
      form.setValue('city', details.city)
    }
    if (details.countryCode) {
      form.setValue('country_code', details.countryCode)
      
      // Auto-detect timezone based on country code
      const timezone = getTimezoneByCountryCode(details.countryCode)
      if (timezone) {
        form.setValue('timezone', timezone)
      }
    }
    if (details.latitude !== null) {
      form.setValue('latitude', details.latitude)
    }
    if (details.longitude !== null) {
      form.setValue('longitude', details.longitude)
    }
  }

  async function onSubmit(values: LocationFormValues) {
    setIsSubmitting(true)
    try {
      if (mode === 'create') {
        await createLocation(values)
        toast.success(`Location "${values.name}" created successfully`)
      } else if (location?.id) {
        await updateLocation(location.id, values)
        toast.success(`Location "${values.name}" updated successfully`)
      }

      router.push('/admin/locations')
    } catch (error) {
      console.error('Error saving location:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save location')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <GoogleMapsProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="location" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="location">Location Information</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="location" className="space-y-4">
              {/* Basic Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Name and type of the location
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Dubai International Airport Terminal 1" {...field} />
                          </FormControl>
                          <FormDescription>
                            The display name of the location
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select location type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="airport">Airport</SelectItem>
                              <SelectItem value="city">City</SelectItem>
                              <SelectItem value="hotel">Hotel</SelectItem>
                              <SelectItem value="station">Station</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The type of location
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

            {/* Address and Location Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Address & Location Details</CardTitle>
                <CardDescription>
                  Search for an address to auto-fill location details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Search</FormLabel>
                      <FormControl>
                        <AddressAutocomplete
                          value={field.value || ''}
                          onChange={field.onChange}
                          onPlaceSelect={handlePlaceSelect}
                          placeholder="Search for an address..."
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Start typing to search. Selecting an address will auto-fill the fields below.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Dubai" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country Code</FormLabel>
                        <FormControl>
                          <Input placeholder="AE" maxLength={2} {...field} />
                        </FormControl>
                        <FormDescription>
                          ISO code
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Asia/Dubai" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormDescription>
                          Auto-detected from country
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.00000001"
                            placeholder="25.2532" 
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              field.onChange(value ? parseFloat(value) : null)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.00000001"
                            placeholder="55.3644" 
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              field.onChange(value ? parseFloat(value) : null)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Map Preview Below */}
            <MapPreview
              latitude={form.watch('latitude')}
              longitude={form.watch('longitude')}
              name={form.watch('name')}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Location Settings</CardTitle>
                <CardDescription>
                  Configure location availability and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="allow_pickup"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Allow Pickup
                        </FormLabel>
                        <FormDescription>
                          Customers can pick up vehicles from this location
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
                  name="allow_dropoff"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Allow Dropoff
                        </FormLabel>
                        <FormDescription>
                          Customers can drop off vehicles at this location
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
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active
                        </FormLabel>
                        <FormDescription>
                          Location is available for bookings
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
              </CardContent>
            </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push('/admin/locations')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Location' : 'Update Location'}
            </Button>
          </div>
        </form>
      </Form>
    </GoogleMapsProvider>
  )
}