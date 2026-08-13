"use client"

import { bookingTodayAsCalendarDate } from "@/lib/utils/timezone"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createVendorApplication } from "@/app/become-vendor/actions"
import { vendorApplicationSchema } from "@/app/vendor-application/schemas"
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
import { FormDatePicker } from "@/components/ui/form-date-picker"
import { parse, format } from "date-fns"
import { countries } from "@/lib/constants/countries"

const checkoutFieldBase = "bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold-text)]/20 focus:border-[var(--gold-text)] hover:border-[rgba(var(--gold-text-rgb),0.3)] transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
const checkoutInputStyles = `h-[52px] ${checkoutFieldBase}`

// Judged against the operating timezone, not the applicant browser: an expiry is a fact
// about the document, not about where it is read.
const isFutureDate = (date: string): boolean =>
  Boolean(date) && new Date(date) > bookingTodayAsCalendarDate()

// The shared schema owns which fields are required; this form adds only the two checks
// that cannot apply on the edit path, where a document may already have expired.
const createApplicationSchema = vendorApplicationSchema.extend({
  tradeLicenseExpiry: z
    .string()
    .min(1, "Trade license expiry date is required")
    .refine(isFutureDate, "Trade license expiry date must be in the future"),
  insuranceExpiry: z
    .string()
    .min(1, "Insurance expiry date is required")
    .refine(isFutureDate, "Insurance expiry date must be in the future"),
})

type VendorApplicationFormData = z.infer<typeof createApplicationSchema>

interface VendorApplicationFormProps {
  defaultValues?: {
    businessEmail?: string
    businessPhone?: string
  }
}

export function VendorApplicationForm({ defaultValues }: VendorApplicationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Set once the application is stored and we are routing away. router.push does not
  // resolve, so this is what keeps the button closed across the navigation.
  const [isLeaving, setIsLeaving] = useState(false)

  const form = useForm<VendorApplicationFormData>({
    resolver: zodResolver(createApplicationSchema),
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

  const isDirty = form.formState.isDirty

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  async function onSubmit(data: VendorApplicationFormData) {
    setIsSubmitting(true)

    try {
      // Submitted through a server action rather than the browser client, so the admin
      // notification email has a server context to run in.
      const { error, code } = await createVendorApplication(data)

      if (error === 'Unauthorized') {
        // The session went away while the form was open. Say so plainly and keep every
        // field: sending them to /login from here would throw the application away.
        toast.error("Your session has expired. Please sign in again, then submit.", {
          duration: 10000,
        })
        return
      }

      if (code === 'duplicate_registration') {
        // Someone else already registered this number. Keep them on the filled form:
        // this is one field to correct, not a reason to lose the whole application.
        form.setError('registrationNumber', {
          type: 'server',
          message: "This registration number is already registered to another business",
        })
        form.setFocus('registrationNumber')
        toast.error("That business registration number is already in use")
        return
      }

      if (code === 'already_applied') {
        toast.error("You have already submitted a vendor application")
        setIsLeaving(true)
        router.push('/vendor-application')
        return
      }

      if (error) {
        throw new Error(error)
      }

      toast.success("Application submitted successfully! We'll review it within 48 hours.")
      // Held until the route actually changes. Clearing it here would re-enable the
      // button while the navigation is still in flight, which is a second submit on an
      // application that is already stored.
      setIsLeaving(true)
      router.push('/vendor-application')
    } catch (error) {
      console.error('[VendorApplicationForm] submit failed:', error)
      toast.error("Failed to submit application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="vendor-form space-y-8" aria-busy={isSubmitting}>

        {/* Section 1: Business Information */}
        <fieldset className="space-y-5 border-0 p-0 m-0">
          <legend className="sr-only">Business Information</legend>
          <div>
            <p className="t-label-accent mb-1" aria-hidden="true">
              Business Information
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Core details about your company.
            </p>
          </div>
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[var(--text-secondary)]">Business Name *</FormLabel>
                <FormControl>
                  <Input className={checkoutInputStyles} placeholder="ABC Car Rentals" aria-required="true" {...field} />
                </FormControl>
                <FormDescription className="text-xs text-[var(--text-muted)]">
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
                <FormLabel className="text-[var(--text-secondary)]">Business Registration Number *</FormLabel>
                <FormControl>
                  <Input className={checkoutInputStyles} placeholder="123456789" aria-required="true" {...field} />
                </FormControl>
                <FormDescription className="text-xs text-[var(--text-muted)]">
                  Your company or commercial registration number issued by the licensing authority
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="businessEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--text-secondary)]">Business Email *</FormLabel>
                  <FormControl>
                    <Input type="email" aria-required="true" className={checkoutInputStyles} placeholder="contact@business.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--text-secondary)]">Business Phone *</FormLabel>
                  <FormControl>
                    <Input aria-required="true" className={checkoutInputStyles} placeholder="+971 50 123 4567" {...field} />
                  </FormControl>
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
                <FormLabel className="text-[var(--text-secondary)]">Business Address *</FormLabel>
                <FormControl>
                  <Input aria-required="true" className={checkoutInputStyles} placeholder="123 Main Street, Building A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="businessCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--text-secondary)]">City *</FormLabel>
                  <FormControl>
                    <Input aria-required="true" className={checkoutInputStyles} placeholder="Dubai" {...field} />
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
                  <FormLabel className="text-[var(--text-secondary)]">Country</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className={`h-[52px] ${checkoutFieldBase}`}>
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
                <FormLabel className="text-[var(--text-secondary)]">Business Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your business, the types of vehicles you offer, and your experience in the industry..."
                    className={`${checkoutFieldBase} min-h-[100px] resize-none`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        {/* Divider */}
        <div className="border-t border-[rgba(var(--gold-text-rgb),0.2)]" />

        {/* Section 2: Verification Documents */}
        <fieldset className="space-y-5 border-0 p-0 m-0">
          <legend className="sr-only">Verification Documents</legend>
          <div>
            <p className="t-label-accent mb-1" aria-hidden="true">
              Verification Documents
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Required for approval. Ensure documents are current.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="tradeLicenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--text-secondary)]">Trade License Number *</FormLabel>
                  <FormControl>
                    <Input className={checkoutInputStyles} placeholder="TL-123456789" aria-required="true" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs text-[var(--text-muted)]">Found on your trade license document</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tradeLicenseExpiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--text-secondary)]">Trade License Expiry *</FormLabel>
                  <FormControl>
                    <FormDatePicker
                      value={field.value ? parse(field.value, "yyyy-MM-dd", new Date()) : undefined}
                      onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                      disabled={(date) => date < bookingTodayAsCalendarDate()}
                      placeholder="Select expiry date"
                      className={checkoutInputStyles}
                      captionLayout="dropdown"
                      startMonth={new Date()}
                      endMonth={new Date(new Date().getFullYear() + 10, 11)}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-[var(--text-muted)]">Must be a future date</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="insurancePolicyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--text-secondary)]">Insurance Policy Number *</FormLabel>
                  <FormControl>
                    <Input className={checkoutInputStyles} placeholder="INS-123456789" aria-required="true" {...field} />
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
                  <FormLabel className="text-[var(--text-secondary)]">Insurance Expiry *</FormLabel>
                  <FormControl>
                    <FormDatePicker
                      value={field.value ? parse(field.value, "yyyy-MM-dd", new Date()) : undefined}
                      onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                      disabled={(date) => date < bookingTodayAsCalendarDate()}
                      placeholder="Select expiry date"
                      className={checkoutInputStyles}
                      captionLayout="dropdown"
                      startMonth={new Date()}
                      endMonth={new Date(new Date().getFullYear() + 10, 11)}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-[var(--text-muted)]">Must be a future date</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </fieldset>

        {/* Divider */}
        <div className="border-t border-[rgba(var(--gold-text-rgb),0.2)]" />

        {/* Section 3: Banking Details (Optional) */}
        <fieldset className="space-y-5 border-0 p-0 m-0">
          <legend className="sr-only">Banking Details</legend>
          <div>
            <p className="t-label-accent mb-1" aria-hidden="true">
              Banking Details
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              For payout processing. You can complete this later from your vendor dashboard.
            </p>
          </div>

          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[var(--text-secondary)]">Bank Name <span className="text-[var(--text-muted)] font-normal ml-1.5">(optional)</span></FormLabel>
                <FormControl>
                  <Input className={checkoutInputStyles} placeholder="Emirates NBD" {...field} />
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
                <FormLabel className="text-[var(--text-secondary)]">Account Holder Name <span className="text-[var(--text-muted)] font-normal ml-1.5">(optional)</span></FormLabel>
                <FormControl>
                  <Input className={checkoutInputStyles} placeholder="ABC Car Rentals LLC" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--text-secondary)]">Account Number <span className="text-[var(--text-muted)] font-normal ml-1.5">(optional)</span></FormLabel>
                  <FormControl>
                    <Input className={checkoutInputStyles} placeholder="1234567890" {...field} />
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
                  <FormLabel className="text-[var(--text-secondary)]">SWIFT Code <span className="text-[var(--text-muted)] font-normal ml-1.5">(optional)</span></FormLabel>
                  <FormControl>
                    <Input className={checkoutInputStyles} placeholder="EBILAEAD" {...field} />
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
                <FormLabel className="text-[var(--text-secondary)]">IBAN <span className="text-[var(--text-muted)] font-normal ml-1.5">(optional)</span></FormLabel>
                <FormControl>
                  <Input className={checkoutInputStyles} placeholder="AE07 0331 2345 6789 0123 456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        {/* Divider */}
        <div className="border-t border-[rgba(var(--gold-text-rgb),0.2)]" />

        {/* Actions */}
        <div className="pt-6">
          <button type="submit" disabled={isSubmitting || isLeaving} className="checkout-btn-primary min-w-[160px]">
            {(isSubmitting || isLeaving) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Application
          </button>
        </div>
      </form>
    </Form>
  )
}
