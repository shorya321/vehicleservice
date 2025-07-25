"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VendorProfileFormData } from "@/lib/types/vendor-application"
import { countries } from "@/lib/constants/countries"
import { saveBusinessProfile } from "../actions"
import { Loader2, Save, Upload, FileText, CreditCard } from "lucide-react"

const businessSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  business_email: z.string().email("Invalid email address").optional().or(z.literal("")),
  business_phone: z.string().optional(),
  business_address: z.string().optional(),
  business_city: z.string().optional(),
  business_country_code: z.string().default("AE"),
  business_description: z.string().optional(),
  registration_number: z.string().min(1, "Registration number is required"),
  // Documents
  trade_license_number: z.string().optional(),
  trade_license_expiry: z.string().optional(),
  insurance_policy_number: z.string().optional(),
  insurance_expiry: z.string().optional(),
  // Banking details
  bank_name: z.string().optional(),
  account_holder_name: z.string().optional(),
  account_number: z.string().optional(),
  iban: z.string().optional(),
  swift_code: z.string().optional(),
})

interface BusinessProfileFormProps {
  vendorId: string
  initialData: any | null
}

export function BusinessProfileForm({ vendorId, initialData }: BusinessProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<VendorProfileFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      business_name: initialData?.business_name || "",
      business_email: initialData?.business_email || "",
      business_phone: initialData?.business_phone || "",
      business_address: initialData?.business_address || "",
      business_city: initialData?.business_city || "",
      business_country_code: initialData?.business_country_code || "AE",
      business_description: initialData?.business_description || "",
      registration_number: initialData?.registration_number || "",
      // Documents
      trade_license_number: initialData?.documents?.trade_license_number || "",
      trade_license_expiry: initialData?.documents?.trade_license_expiry || "",
      insurance_policy_number: initialData?.documents?.insurance_policy_number || "",
      insurance_expiry: initialData?.documents?.insurance_expiry || "",
      // Banking details
      bank_name: initialData?.banking_details?.bank_name || "",
      account_holder_name: initialData?.banking_details?.account_holder_name || "",
      account_number: initialData?.banking_details?.account_number || "",
      iban: initialData?.banking_details?.iban || "",
      swift_code: initialData?.banking_details?.swift_code || "",
    },
  })

  async function onSubmit(values: VendorProfileFormData) {
    setIsLoading(true)
    
    try {
      const result = await saveBusinessProfile(vendorId, values, !!initialData)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(initialData ? "Business profile updated" : "Business profile created")
        router.refresh()
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide your business details for customers to see
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC Car Rentals" {...field} />
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
                  <FormLabel>Business Registration Number</FormLabel>
                  <FormControl>
                    <Input placeholder="123456789" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your official business registration number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="business_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="contact@abcrentals.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Phone</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        placeholder="+971 50 123 4567" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="business_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell customers about your business..."
                      className="resize-none"
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This will be displayed on your public profile
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>
              Where is your business located?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="business_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="123 Main Street, Building A" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="business_city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Dubai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_country_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>
              Provide your business document details for verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="trade_license_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade License Number</FormLabel>
                    <FormControl>
                      <Input placeholder="TL-123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trade_license_expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade License Expiry</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="insurance_policy_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Policy Number</FormLabel>
                    <FormControl>
                      <Input placeholder="INS-123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insurance_expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Expiry</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Banking Details
            </CardTitle>
            <CardDescription>
              Bank account information for payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Emirates NBD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_holder_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Holder Name</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC Car Rentals LLC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="swift_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SWIFT Code</FormLabel>
                    <FormControl>
                      <Input placeholder="EBILAEAD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="iban"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IBAN</FormLabel>
                  <FormControl>
                    <Input placeholder="AE07 0331 2345 6789 0123 456" {...field} />
                  </FormControl>
                  <FormDescription>
                    International Bank Account Number for international transfers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}