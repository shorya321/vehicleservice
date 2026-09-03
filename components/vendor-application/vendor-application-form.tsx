"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createVendorApplication } from "@/app/become-vendor/actions"
import { Form } from "@/components/ui/form"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
  createApplicationSchema,
  type VendorApplicationFormInput,
  type VendorApplicationFormValues,
} from "./schema"
import { BusinessInformationSection } from "./sections/business-information"
import { VerificationDocumentsSection } from "./sections/verification-documents"
import { BankingDetailsSection } from "./sections/banking-details"

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
  // A failed submit used to announce itself through a toast and nothing else. This is
  // the same message on the form itself, where a screen reader will reach it.
  const [submitError, setSubmitError] = useState("")

  const form = useForm<VendorApplicationFormInput, unknown, VendorApplicationFormValues>({
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

  async function onSubmit(data: VendorApplicationFormValues) {
    setIsSubmitting(true)
    setSubmitError("")

    try {
      // Submitted through a server action rather than the browser client, so the admin
      // notification email has a server context to run in.
      const { error, code } = await createVendorApplication(data)

      if (error === 'Unauthorized') {
        // The session went away while the form was open. Say so plainly and keep every
        // field: sending them to /login from here would throw the application away.
        const message = "Your session has expired. Sign in again, then submit. Nothing you have typed is lost."
        setSubmitError(message)
        toast.error(message, { duration: 10000 })
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
        setSubmitError("That business registration number is already in use. Correct it and submit again.")
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
      const message = "We could not submit the application. Check your connection and try again."
      setSubmitError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isBusy = isSubmitting || isLeaving

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="vendor-form" aria-busy={isSubmitting}>
        <BusinessInformationSection form={form} />
        <VerificationDocumentsSection form={form} />
        <BankingDetailsSection form={form} />

        {/* The end of the longest form in the product was its quietest moment: a
            160px button and nothing else. The 48-hour promise lived in the left rail,
            well off-screen by the time anyone reached this. */}
        <div className="mt-10 pt-8 border-t border-[rgba(var(--gold-rgb),0.12)]">
          <p aria-live="polite" className="sr-only">
            {submitError}
          </p>
          {submitError && (
            <p className="mb-5 text-sm text-[var(--error-text)]" role="alert">
              {submitError}
            </p>
          )}

          {/* Below lg this docks to the viewport: a gold hairline over one tone step,
              per the flat-by-tone rule. No shadow, no radius, no floating card.
              `flex-col-reverse` puts the promise above the button on a phone, so the
              reassurance is read before the control rather than after it. */}
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
              Submit application
            </button>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:max-w-[34ch]">
              Reviewed within{" "}
              <span className="font-medium tabular-nums text-[var(--text-primary)]">48 hours</span>.
              We email you either way.
            </p>
          </div>
        </div>
      </form>
    </Form>
  )
}
