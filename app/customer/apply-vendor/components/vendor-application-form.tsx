"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
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

const vendorApplicationSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  businessPhone: z.string().min(6, "Please enter a valid phone number").optional().or(z.literal("")),
  businessAddress: z.string().optional(),
  businessCity: z.string().optional(),
  businessCountryCode: z.string().default("AE"),
  businessDescription: z.string().optional(),
  registrationNumber: z.string().min(1, "Business registration number is required"),
  // Documents (optional for initial application)
  tradeLicenseNumber: z.string().optional(),
  tradeLicenseExpiry: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  // Banking details (optional for initial application)
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
})

type VendorApplicationFormData = z.infer<typeof vendorApplicationSchema>

interface VendorApplicationFormProps {
  userId: string
  defaultValues?: {
    businessEmail?: string
    businessPhone?: string
  }
}

export function VendorApplicationForm({ userId, defaultValues }: VendorApplicationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<VendorApplicationFormData>({
    resolver: zodResolver(vendorApplicationSchema),
    defaultValues: {
      businessName: "",
      businessEmail: defaultValues?.businessEmail || "",
      businessPhone: defaultValues?.businessPhone || "",
      businessAddress: "",
      businessCity: "",
      businessCountryCode: "AE",
      businessDescription: "",
      registrationNumber: "",
      // Documents
      tradeLicenseNumber: "",
      tradeLicenseExpiry: "",
      insurancePolicyNumber: "",
      insuranceExpiry: "",
      // Banking details
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      iban: "",
      swiftCode: "",
    },
  })

  async function onSubmit(data: VendorApplicationFormData) {
    setIsSubmitting(true)
    const supabase = createClient()

    try {
      // Submit vendor application
      // Prepare documents JSON
      const documents = {
        trade_license_number: data.tradeLicenseNumber || null,
        trade_license_expiry: data.tradeLicenseExpiry || null,
        insurance_policy_number: data.insurancePolicyNumber || null,
        insurance_expiry: data.insuranceExpiry || null,
      }

      // Prepare banking details JSON
      const banking_details = {
        bank_name: data.bankName || null,
        account_holder_name: data.accountHolderName || null,
        account_number: data.accountNumber || null,
        iban: data.iban || null,
        swift_code: data.swiftCode || null,
      }

      const { error } = await supabase
        .from('vendor_applications')
        .insert({
          user_id: userId,
          business_name: data.businessName,
          business_email: data.businessEmail || null,
          business_phone: data.businessPhone || null,
          business_address: data.businessAddress || null,
          business_city: data.businessCity || null,
          business_country_code: data.businessCountryCode,
          business_description: data.businessDescription || null,
          registration_number: data.registrationNumber,
          documents: documents,
          banking_details: banking_details,
        })

      if (error) {
        if (error.code === '23505') {
          toast.error("You have already submitted a vendor application")
          router.push('/customer/vendor-application')
          return
        }
        throw error
      }

      toast.success("Application submitted successfully! We'll review it within 48 hours.")
      router.push('/customer/vendor-application')
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error("Failed to submit application. Please try again.")
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

        {/* Optional Documents Section */}
        <div className="space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Documents (Optional)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You can provide these details now or complete them later in your vendor profile
            </p>
            
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tradeLicenseNumber"
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
                name="tradeLicenseExpiry"
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

              <FormField
                control={form.control}
                name="insurancePolicyNumber"
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
                name="insuranceExpiry"
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
            Submit Application
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/customer/dashboard')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}