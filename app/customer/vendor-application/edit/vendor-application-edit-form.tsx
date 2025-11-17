"use client"

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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { countries } from "@/lib/constants/countries"
import { updateVendorApplication } from "../actions"

const vendorApplicationSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  businessPhone: z.string().min(6, "Please enter a valid phone number").optional().or(z.literal("")),
  businessAddress: z.string().optional(),
  businessCity: z.string().optional(),
  businessCountryCode: z.string().default("AE"),
  businessDescription: z.string().optional(),
  registrationNumber: z.string().min(1, "Business registration number is required"),
  // Documents (required for verification)
  tradeLicenseNumber: z.string().min(1, "Trade license number is required"),
  tradeLicenseExpiry: z.string().min(1, "Trade license expiry date is required").refine((date) => {
    if (!date) return false
    const expiryDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return expiryDate > today
  }, "Trade license expiry date must be in the future"),
  insurancePolicyNumber: z.string().min(1, "Insurance policy number is required"),
  insuranceExpiry: z.string().min(1, "Insurance expiry date is required").refine((date) => {
    if (!date) return false
    const expiryDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return expiryDate > today
  }, "Insurance expiry date must be in the future"),
  // Banking details (optional for initial application)
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
})

type VendorApplicationFormData = z.infer<typeof vendorApplicationSchema>

interface VendorApplicationEditFormProps {
  userId: string
  application: any
  defaultValues?: {
    businessEmail?: string
    businessPhone?: string
  }
}

export function VendorApplicationEditForm({ userId, application, defaultValues }: VendorApplicationEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Extract documents and banking details from JSONB
  const documents = application.documents || {}
  const bankingDetails = application.banking_details || {}

  const form = useForm<VendorApplicationFormData>({
    resolver: zodResolver(vendorApplicationSchema),
    defaultValues: {
      businessName: application.business_name || "",
      businessEmail: application.business_email || defaultValues?.businessEmail || "",
      businessPhone: application.business_phone || defaultValues?.businessPhone || "",
      businessAddress: application.business_address || "",
      businessCity: application.business_city || "",
      businessCountryCode: application.business_country_code || "AE",
      businessDescription: application.business_description || "",
      registrationNumber: application.registration_number || "",
      // Documents
      tradeLicenseNumber: documents.trade_license_number || "",
      tradeLicenseExpiry: documents.trade_license_expiry || "",
      insurancePolicyNumber: documents.insurance_policy_number || "",
      insuranceExpiry: documents.insurance_expiry || "",
      // Banking details
      bankName: bankingDetails.bank_name || "",
      accountHolderName: bankingDetails.account_holder_name || "",
      accountNumber: bankingDetails.account_number || "",
      iban: bankingDetails.iban || "",
      swiftCode: bankingDetails.swift_code || "",
    },
  })

  async function onSubmit(data: VendorApplicationFormData) {
    setIsSubmitting(true)

    try {
      const result = await updateVendorApplication(application.id, data)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Application updated successfully!")
        router.push('/customer/vendor-application')
      }
    } catch (error) {
      console.error('Error updating application:', error)
      toast.error("Failed to update application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name *</FormLabel>
              <FormControl>
                <Input placeholder="ABC Car Rentals" {...field} />
              </FormControl>
              <FormDescription>
                Your registered business name or trading name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Registration Number *</FormLabel>
              <FormControl>
                <Input placeholder="123456789" {...field} />
              </FormControl>
              <FormDescription>
                Your official business registration number (required for verification)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="businessEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@business.com" {...field} />
                </FormControl>
                <FormDescription>
                  Contact email for business inquiries
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+971 50 123 4567" {...field} />
                </FormControl>
                <FormDescription>
                  Primary contact number
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="businessAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main Street, Building A" {...field} />
              </FormControl>
              <FormDescription>
                Your business location or office address
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="businessCity"
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
            name="businessCountryCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
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

        <FormField
          control={form.control}
          name="businessDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about your business, the types of vehicles you offer, and your experience in the rental industry..."
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Help us understand your business better
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Required Documents Section */}
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Documents (Required)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              These documents are required for verification and approval of your vendor application
            </p>
            
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tradeLicenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade License Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="TL-123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tradeLicenseExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade License Expiry *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insurancePolicyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Policy Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="INS-123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insuranceExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Expiry *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Optional Banking Details Section */}
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Banking Details (Optional)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bank account information for payments. Can be completed later if preferred.
            </p>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="bankName"
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
                name="accountHolderName"
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

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="accountNumber"
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
                  name="swiftCode"
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
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Application
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/customer/vendor-application')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}