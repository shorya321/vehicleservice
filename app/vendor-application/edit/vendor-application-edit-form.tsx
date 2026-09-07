"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import * as z from "zod"
import { parse, format } from "date-fns"

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
import { FormDatePicker } from "@/components/ui/form-date-picker"
import { countries } from "@/lib/constants/countries"
import { SectionShell } from "@/components/vendor-application/sections/section-shell"
import {
  FIELD_BASE,
  FIELD_HELP,
  FIELD_INPUT,
  FIELD_LABEL,
  OptionalTag,
} from "@/components/vendor-application/field-primitives"
import { EditRail } from "@/components/vendor-application/edit-rail"
import { normalizeApplicationStatus } from "@/lib/vendor-application/status"
import { vendorApplicationSchema, VendorApplicationFormData } from "../schemas"
import { updateVendorApplication } from "../actions"

/**
 * `businessCountryCode` carries `.default("AE")`, so the schema's input and output types
 * differ: `string | undefined` going in, `string` coming out. Typing `useForm` on the
 * output alone is what the create form corrected in 5303795; this is the same correction.
 */
type EditFormInput = z.input<typeof vendorApplicationSchema>

/**
 * Field order and display names for the amendment ledger in the rail.
 *
 * Declaration order is form order, so the ledger reads down the page rather than in
 * whatever order the applicant happened to touch things.
 */
const CHANGE_LABELS: Record<keyof VendorApplicationFormData, string> = {
  businessName: "Business name",
  registrationNumber: "Registration number",
  businessEmail: "Business email",
  businessPhone: "Business phone",
  businessAddress: "Business address",
  businessCity: "City",
  businessCountryCode: "Country",
  businessDescription: "Business description",
  tradeLicenseNumber: "Trade license number",
  tradeLicenseExpiry: "Trade license expiry",
  insurancePolicyNumber: "Insurance policy number",
  insuranceExpiry: "Insurance expiry",
  bankName: "Bank name",
  accountHolderName: "Account holder",
  accountNumber: "Account number",
  swiftCode: "SWIFT code",
  iban: "IBAN",
}

const CHANGE_KEYS = Object.keys(CHANGE_LABELS) as (keyof VendorApplicationFormData)[]

/** Both expiry pickers, unchanged from before the conversion. */
const expiryPickerProps = {
  placeholder: "Select expiry date",
  className: FIELD_INPUT,
  captionLayout: "dropdown" as const,
  startMonth: new Date(),
  endMonth: new Date(new Date().getFullYear() + 10, 11),
}

interface VendorApplicationEditFormProps {
  application: {
    id: string
    status: string | null
    created_at: string
    updated_at: string
    business_name: string
    business_email: string | null
    business_phone: string | null
    business_address: string | null
    business_city: string | null
    business_country_code: string | null
    business_description: string | null
    registration_number: string | null
    documents: unknown
    banking_details: unknown
  }
  defaultValues?: { businessEmail?: string | null; businessPhone?: string | null }
}

export function VendorApplicationEditForm({
  application,
  defaultValues,
}: VendorApplicationEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Held across the redirect. router.push does not resolve, so clearing this in `finally`
  // would re-open the button while the navigation is still in flight.
  const [isLeaving, setIsLeaving] = useState(false)
  // A failed save used to announce itself through a toast and nothing else. This is the
  // same message on the form, where a screen reader will reach it.
  const [submitError, setSubmitError] = useState("")

  // The row's JSON columns arrive as `Json`, which is wider than the two flat string maps
  // stored in them. Narrowed once, here, rather than at seventeen call sites.
  const docs = (application.documents ?? {}) as Record<string, string>
  const banking = (application.banking_details ?? {}) as Record<string, string>

  const form = useForm<EditFormInput, unknown, VendorApplicationFormData>({
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
      tradeLicenseNumber: docs.trade_license_number || "",
      tradeLicenseExpiry: docs.trade_license_expiry || "",
      insurancePolicyNumber: docs.insurance_policy_number || "",
      insuranceExpiry: docs.insurance_expiry || "",
      bankName: banking.bank_name || "",
      accountHolderName: banking.account_holder_name || "",
      accountNumber: banking.account_number || "",
      iban: banking.iban || "",
      swiftCode: banking.swift_code || "",
    },
  })

  // Reading these off formState is what subscribes the component to them.
  const { dirtyFields, isDirty } = form.formState
  const changes = CHANGE_KEYS.filter((key) => dirtyFields[key]).map((key) => CHANGE_LABELS[key])

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
    setSubmitError("")
    try {
      const result = await updateVendorApplication(application.id, data)
      if (result.error) {
        setSubmitError(result.error)
        toast.error(result.error)
        return
      }
      toast.success("Changes saved")
      setIsLeaving(true)
      router.push("/vendor-application")
    } catch (error) {
      console.error("[VendorApplicationEditForm] save failed:", error)
      const message = "We could not save your changes. Check your connection and try again."
      setSubmitError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isBusy = isSubmitting || isLeaving

  return (
    <div className="mt-[clamp(2.5rem,5vw,3.5rem)] lg:grid lg:grid-cols-[2fr_3fr] lg:gap-16 xl:gap-20">
      <EditRail
        status={normalizeApplicationStatus(application.status)}
        createdAt={application.created_at}
        updatedAt={application.updated_at}
        changes={changes}
        className="mb-10 lg:mb-0 lg:sticky lg:top-28 lg:self-start"
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="vendor-form"
          aria-busy={isSubmitting}
        >
          {/* ── Business information ─────────────────────────────── */}
          <SectionShell
            id="vendor-section-business"
            title="Business information"
            note="Your registered details and the contacts we reach you on."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={FIELD_LABEL}>Business name</FormLabel>
                    <FormControl>
                      <Input
                        className={FIELD_INPUT}
                        placeholder="ABC Car Rentals"
                        autoComplete="organization"
                        aria-required="true"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={FIELD_LABEL}>Registration number</FormLabel>
                    <FormControl>
                      <Input
                        className={`${FIELD_INPUT} tabular-nums`}
                        placeholder="123456789"
                        inputMode="numeric"
                        autoComplete="off"
                        aria-required="true"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="businessEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={FIELD_LABEL}>Business email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        className={FIELD_INPUT}
                        placeholder="contact@business.com"
                        inputMode="email"
                        autoComplete="email"
                        aria-required="true"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className={FIELD_HELP}>
                      Our decision on your application is sent here.
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
                    <FormLabel className={FIELD_LABEL}>Business phone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        className={`${FIELD_INPUT} tabular-nums`}
                        placeholder="+971 50 123 4567"
                        inputMode="tel"
                        autoComplete="tel"
                        aria-required="true"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className={FIELD_HELP}>
                      Include the country code.
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
                  <FormLabel className={FIELD_LABEL}>Business address</FormLabel>
                  <FormControl>
                    <Input
                      className={FIELD_INPUT}
                      placeholder="123 Main Street, Building A"
                      autoComplete="street-address"
                      aria-required="true"
                      {...field}
                    />
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
                    <FormLabel className={FIELD_LABEL}>City</FormLabel>
                    <FormControl>
                      <Input
                        className={FIELD_INPUT}
                        placeholder="Dubai"
                        autoComplete="address-level2"
                        aria-required="true"
                        {...field}
                      />
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
                    <FormLabel className={FIELD_LABEL}>Country</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={`h-[52px] ${FIELD_BASE}`}>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      {/* The native select painted the OS menu. This is the surface every
                          other menu in the product uses. */}
                      <SelectContent className="bg-[var(--dropdown-surface)] border-[var(--graphite)] rounded-[4px]">
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
                  <FormLabel className={FIELD_LABEL}>
                    Business description
                    <OptionalTag />
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your fleet, the vehicles you run, and how long you have been operating."
                      className={`${FIELD_BASE} min-h-[100px] resize-none py-3.5 focus-visible:ring-offset-0`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionShell>

          {/* ── Required documents ───────────────────────────────── */}
          <SectionShell
            id="vendor-section-documents"
            title="Required documents"
            note="Trade license and insurance, exactly as registered."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tradeLicenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={FIELD_LABEL}>Trade license number</FormLabel>
                    <FormControl>
                      <Input
                        className={`${FIELD_INPUT} tabular-nums`}
                        placeholder="TL-123456789"
                        autoComplete="off"
                        aria-required="true"
                        {...field}
                      />
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
                    <FormLabel className={FIELD_LABEL}>Trade license expiry</FormLabel>
                    <FormControl>
                      <FormDatePicker
                        {...expiryPickerProps}
                        value={
                          field.value
                            ? parse(field.value, "yyyy-MM-dd", new Date())
                            : undefined
                        }
                        onChange={(date) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                      />
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
                    <FormLabel className={FIELD_LABEL}>Insurance policy number</FormLabel>
                    <FormControl>
                      <Input
                        className={`${FIELD_INPUT} tabular-nums`}
                        placeholder="INS-123456789"
                        autoComplete="off"
                        aria-required="true"
                        {...field}
                      />
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
                    <FormLabel className={FIELD_LABEL}>Insurance expiry</FormLabel>
                    <FormControl>
                      <FormDatePicker
                        {...expiryPickerProps}
                        value={
                          field.value
                            ? parse(field.value, "yyyy-MM-dd", new Date())
                            : undefined
                        }
                        onChange={(date) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SectionShell>

          {/* ── Banking details ──────────────────────────────────── */}
          <SectionShell
            id="vendor-section-banking"
            title="Banking details"
            note="Where settlements are paid. You can leave this until later; nothing is paid out until it is complete."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={FIELD_LABEL}>
                      Bank name
                      <OptionalTag />
                    </FormLabel>
                    <FormControl>
                      <Input
                        className={FIELD_INPUT}
                        placeholder="Emirates NBD"
                        autoComplete="off"
                        {...field}
                      />
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
                    <FormLabel className={FIELD_LABEL}>
                      Account holder
                      <OptionalTag />
                    </FormLabel>
                    <FormControl>
                      <Input
                        className={FIELD_INPUT}
                        placeholder="ABC LLC"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={FIELD_LABEL}>
                      Account number
                      <OptionalTag />
                    </FormLabel>
                    <FormControl>
                      <Input
                        className={`${FIELD_INPUT} tabular-nums`}
                        placeholder="1234567890"
                        inputMode="numeric"
                        autoComplete="off"
                        {...field}
                      />
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
                    <FormLabel className={FIELD_LABEL}>
                      SWIFT code
                      <OptionalTag />
                    </FormLabel>
                    <FormControl>
                      <Input
                        className={`${FIELD_INPUT} tabular-nums`}
                        placeholder="EBILAEAD"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className={FIELD_HELP}>
                      8 or 11 characters, from your bank.
                    </FormDescription>
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
                  <FormLabel className={FIELD_LABEL}>
                    IBAN
                    <OptionalTag />
                  </FormLabel>
                  <FormControl>
                    <Input
                      className={`${FIELD_INPUT} tabular-nums`}
                      placeholder="AE07 0331 2345 6789 0123 456"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionShell>

          {/* The two controls used to float bottom-left at near-equal weight, with nothing
              above them and nothing said about what happens on save. */}
          <div className="mt-10 pt-8 border-t border-[rgba(var(--gold-rgb),0.12)]">
            <p aria-live="polite" className="sr-only">
              {submitError}
            </p>
            {submitError && (
              <p className="mb-5 text-sm text-[var(--error-text)]" role="alert">
                {submitError}
              </p>
            )}

            {/* Below lg this docks to the viewport, as the create form's does: a gold
                hairline over one tone step, no shadow and no radius. `flex-col-reverse`
                puts the reassurance above the control on a phone. */}
            <div
              className="
                flex flex-col-reverse gap-3
                max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40
                max-lg:border-t max-lg:border-[var(--gold)] max-lg:bg-[var(--charcoal)]
                max-lg:px-6 max-lg:py-4
                sm:flex-row sm:items-center sm:gap-6
              "
            >
              <button
                type="submit"
                disabled={isBusy}
                className="checkout-btn-primary w-full sm:w-auto sm:min-w-[190px]"
              >
                {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Save changes
              </button>

              <button
                type="button"
                onClick={() => router.push("/vendor-application")}
                disabled={isBusy}
                className="
                  inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[4px]
                  border border-[var(--graphite)] px-4 text-[0.75rem] uppercase tracking-[0.14em]
                  text-[var(--text-secondary)] transition-colors
                  hover:border-[var(--gold)] hover:text-[var(--gold-text)]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]
                  focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]
                  disabled:cursor-not-allowed disabled:opacity-50
                  sm:w-auto
                "
              >
                Cancel
              </button>

              <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:max-w-[30ch]">
                Your application stays in review while you edit.
              </p>
            </div>
          </div>

          {/* Clears the docked action, which is out of flow below lg. */}
          <div aria-hidden="true" className="h-[152px] sm:h-[116px] lg:hidden" />
        </form>
      </Form>
    </div>
  )
}
