"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Vehicle, VehicleType } from "@/lib/types/vehicle"
import { VehicleCategory } from "@/lib/types/vehicle-category"
import { createAdminVehicle, updateAdminVehicle } from "../actions"
import { buildAdminVehicleFormSchema, type AdminVehicleFormValues } from "@/lib/vehicles/schema"
import { typeLuggageCapacity } from "@/lib/vehicles/capacity"
import { toOptionalNumber } from "@/lib/vehicles/form-input"
import { rollbackVehicleImage, uploadVehicleImage } from "@/lib/vehicles/image-upload"
import { getErrorMessage, withTimeout } from "@/lib/storage/image-upload"
import { getVehicleCategories, getVehicleTypesByCategory } from "@/app/vendor/vehicles/actions"
import { Loader2, Building2 } from "lucide-react"
import { ImageUpload } from "@/app/vendor/vehicles/components/image-upload"

const currentYear = new Date().getFullYear()

/** Upper bound on the save round-trip, so the form can never hang on it. */
const SAVE_TIMEOUT_MS = 30_000

interface VehicleWithVendor extends Vehicle {
  vendor?: {
    id: string
    business_name: string
    business_email: string
  }
}

interface AdminVehicleFormProps {
  initialData?: VehicleWithVendor
  vendors: Array<{
    id: string
    business_name: string
    business_email: string
    user?: {
      full_name: string | null
      email: string
    }
  }>
}

export function AdminVehicleForm({ initialData, vendors }: AdminVehicleFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [primaryImageFile, setPrimaryImageFile] = useState<File | null>(null)
  const [primaryImage, setPrimaryImage] = useState<string>(initialData?.primary_image_url || "")
  const [categories, setCategories] = useState<VehicleCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [loadingVehicleTypes, setLoadingVehicleTypes] = useState(true)

  // Rebuilt whenever the loaded types change, because the seats and luggage
  // ceilings come from the type that is selected.
  const formSchema = useMemo(() => buildAdminVehicleFormSchema(vehicleTypes), [vehicleTypes])

  const form = useForm<AdminVehicleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_id: initialData?.business_id || "",
      make: initialData?.make || "",
      model: initialData?.model || "",
      year: initialData?.year || currentYear,
      registration_number: initialData?.registration_number || "",
      category_id: initialData?.category_id || "",
      vehicle_type_id: initialData?.vehicle_type_id || "",
      fuel_type: initialData?.fuel_type as any || 'petrol',
      transmission: initialData?.transmission as any || 'manual',
      // A blank form starts at 0 rather than guessing 5 seats and 2 bags. The
      // limit shown under each field tells the admin the ceiling once they
      // pick a type; nothing is pre-filled on their behalf. An existing vehicle
      // keeps whatever is stored, and a stored null stays blank.
      seats: initialData ? (initialData.seats ?? undefined) : 0,
      luggage_capacity: initialData ? (initialData.luggage_capacity ?? undefined) : 0,
      is_available: initialData?.is_available ?? true,
    },
  })

  // Watch for category changes
  const watchedCategoryId = form.watch('category_id')
  const watchedVehicleTypeId = form.watch('vehicle_type_id')

  const selectedType = vehicleTypes.find((type) => type.id === watchedVehicleTypeId)
  const maxSeats = selectedType?.passenger_capacity
  const maxLuggage = selectedType ? typeLuggageCapacity(selectedType) : undefined

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await getVehicleCategories()
        if (result.data) {
          setCategories(result.data)
        }
      } catch (error) {
        console.error("Failed to load categories:", error)
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  // Load vehicle types when category changes
  useEffect(() => {
    async function loadVehicleTypes() {
      const categoryId = watchedCategoryId
      if (!categoryId) {
        setVehicleTypes([])
        setLoadingVehicleTypes(false)
        return
      }

      setLoadingVehicleTypes(true)
      try {
        const types = await getVehicleTypesByCategory(categoryId)
        setVehicleTypes(types)
        
        // If editing and the vehicle type doesn't belong to the new category, clear it
        const currentVehicleTypeId = form.getValues('vehicle_type_id')
        if (currentVehicleTypeId && !types.find(t => t.id === currentVehicleTypeId)) {
          form.setValue('vehicle_type_id', '')
        }
      } catch (error) {
        console.error("Failed to load vehicle types:", error)
        setVehicleTypes([])
      } finally {
        setLoadingVehicleTypes(false)
      }
    }
    loadVehicleTypes()
  }, [watchedCategoryId, form])

  // Load features on mount

  const handlePrimaryImageChange = (files: File[]) => {
    if (files.length > 0) {
      setPrimaryImageFile(files[0])
      const url = URL.createObjectURL(files[0])
      setPrimaryImage(url)
    }
  }

  const handlePrimaryImageRemove = () => {
    setPrimaryImageFile(null)
    if (primaryImage.startsWith('blob:')) {
      URL.revokeObjectURL(primaryImage)
    }
    setPrimaryImage("")
  }

  async function onSubmit(values: AdminVehicleFormValues) {
    setIsLoading(true)

    // Uploaded ahead of the save so the image never travels through the Server
    // Action body, which Next.js caps at 1 MB. Tracked so it can be rolled back
    // if the save then fails.
    let uploadedImageUrl: string | null = null
    let succeeded = false

    try {
      let primaryImageUrl = initialData?.primary_image_url || null

      if (primaryImageFile) {
        setUploadingImages(true)
        const { url, error } = await uploadVehicleImage({
          businessId: values.business_id,
          file: primaryImageFile,
        })
        setUploadingImages(false)

        if (error || !url) {
          toast.error(error || "Failed to upload image")
          return
        }

        uploadedImageUrl = url
        primaryImageUrl = url
      } else if (!primaryImage) {
        primaryImageUrl = null
      }

      const formData = { ...values, primaryImageUrl }

      // Bounded because a Server Action POST that never answers — a stalled
      // connection, or a redirect issued by the proxy on an expired session —
      // otherwise leaves this await pending and the button stuck on "Saving...".
      const result = await withTimeout(
        initialData
          ? updateAdminVehicle(initialData.id, formData)
          : createAdminVehicle(formData),
        SAVE_TIMEOUT_MS,
        "Saving timed out. Check your connection and try again."
      )

      if (result.error) {
        // Toast first: the rollback is best-effort cleanup, and awaiting it
        // here would let a slow delete swallow the error that needs reporting.
        toast.error(result.error)
        rollbackVehicleImage(uploadedImageUrl)
        return
      }

      toast.success(initialData ? "Vehicle updated" : "Vehicle added successfully")
      // Left loading on purpose: the button stays disabled until the vehicles
      // list finishes rendering, so a second click can't resubmit and trip the
      // registration-number unique constraint on the row just written.
      succeeded = true
      router.push('/admin/vehicles')
    } catch (error) {
      toast.error(getErrorMessage(error, "An unexpected error occurred"))
      rollbackVehicleImage(uploadedImageUrl)
    } finally {
      setUploadingImages(false)

      if (!succeeded) {
        setIsLoading(false)
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendor Assignment</CardTitle>
            <CardDescription>
              Select the vendor who owns this vehicle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="business_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!!initialData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>{vendor.business_name}</span>
                            <span className="text-muted-foreground">
                              ({vendor.user?.email || vendor.business_email})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {initialData ? "Vendor cannot be changed after creation" : "Select the vendor who will manage this vehicle"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>
              Basic details about the vehicle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input placeholder="Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="Camry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={currentYear.toString()}
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registration_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
            <CardDescription>
              Specifications and features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loadingCategories}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select vehicle category"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicle_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Switching to a smaller type must re-flag seats and
                      // luggage that were already entered, not wait for submit.
                      void form.trigger(['seats', 'luggage_capacity'])
                    }}
                    defaultValue={field.value}
                    disabled={!form.watch('category_id') || loadingVehicleTypes}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !form.watch('category_id') 
                            ? "Select a category first" 
                            : loadingVehicleTypes 
                            ? "Loading vehicle types..." 
                            : "Select vehicle type"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.passenger_capacity} passengers, {type.luggage_capacity} bags)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Vehicle type determines passenger and luggage capacity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fuel_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transmission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transmission</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transmission" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automatic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="seats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Seats</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={maxSeats}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(toOptionalNumber(e.target.valueAsNumber))}
                      />
                    </FormControl>
                    {selectedType && (
                      <FormDescription>
                        Up to {maxSeats} for {selectedType.name}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="luggage_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Luggage Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={maxLuggage}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(toOptionalNumber(e.target.valueAsNumber))}
                      />
                    </FormControl>
                    <FormDescription>
                      {selectedType
                        ? `Number of luggage pieces, up to ${maxLuggage} for ${selectedType.name}`
                        : 'Number of luggage pieces'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>
              Control when this vehicle is available for rent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="is_available"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Available for Rent
                    </FormLabel>
                    <FormDescription>
                      Make this vehicle available for customers to book
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

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Images</CardTitle>
            <CardDescription>
              Add photos to showcase the vehicle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ImageUpload
              label="Primary Image"
              description="Main photo that will be displayed in the fleet listing"
              value={primaryImage}
              onChange={handlePrimaryImageChange}
              onRemove={handlePrimaryImageRemove}
              disabled={isLoading || uploadingImages}
              uploading={uploadingImages}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/vehicles')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Vehicle" : "Add Vehicle"}
          </Button>
        </div>
      </form>
    </Form>
  )
}