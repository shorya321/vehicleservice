"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { countries } from "@/lib/constants/countries"
import { FormField } from "@/components/ui/form-field"
import { vendorApplicationSchema, VendorApplicationFormData } from "../schemas"
import { updateVendorApplication } from "../actions"

interface VendorApplicationEditFormProps {
  userId: string
  application: {
    id: string
    business_name: string
    business_email: string | null
    business_phone: string | null
    business_address: string | null
    business_city: string | null
    business_country_code: string | null
    business_description: string | null
    registration_number: string | null
    documents: Record<string, string> | null
    banking_details: Record<string, string> | null
  }
  defaultValues?: { businessEmail?: string; businessPhone?: string }
}

export function VendorApplicationEditForm({ application, defaultValues }: VendorApplicationEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const docs = application.documents || {}
  const banking = application.banking_details || {}

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

  async function onSubmit(data: VendorApplicationFormData) {
    setIsSubmitting(true)
    try {
      const result = await updateVendorApplication(application.id, data)
      if (result.error) toast.error(result.error)
      else { toast.success("Application updated!"); router.push("/vendor-application") }
    } catch { toast.error("Failed to update application.") }
    finally { setIsSubmitting(false) }
  }

  const { register, formState: { errors } } = form

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <Section title="Business Information">
        <FormField label="Business Name *" error={errors.businessName?.message}>
          <input {...register("businessName")} className="form-input" placeholder="ABC Car Rentals" />
        </FormField>
        <FormField label="Registration Number *" error={errors.registrationNumber?.message}>
          <input {...register("registrationNumber")} className="form-input" placeholder="123456789" />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Business Email" error={errors.businessEmail?.message}>
            <input {...register("businessEmail")} type="email" className="form-input" placeholder="contact@business.com" />
          </FormField>
          <FormField label="Business Phone" error={errors.businessPhone?.message}>
            <input {...register("businessPhone")} className="form-input" placeholder="+971 50 123 4567" />
          </FormField>
        </div>
        <FormField label="Business Address" error={errors.businessAddress?.message}>
          <input {...register("businessAddress")} className="form-input" placeholder="123 Main Street" />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="City" error={errors.businessCity?.message}>
            <input {...register("businessCity")} className="form-input" placeholder="Dubai" />
          </FormField>
          <FormField label="Country" error={errors.businessCountryCode?.message}>
            <select {...register("businessCountryCode")} className="form-input">
              {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Business Description" error={errors.businessDescription?.message}>
          <textarea {...register("businessDescription")} className="form-input min-h-[80px]" placeholder="About your business..." />
        </FormField>
      </Section>

      <Section title="Required Documents" bordered>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Trade License Number *" error={errors.tradeLicenseNumber?.message}>
            <input {...register("tradeLicenseNumber")} className="form-input" placeholder="TL-123456789" />
          </FormField>
          <FormField label="Trade License Expiry *" error={errors.tradeLicenseExpiry?.message}>
            <input {...register("tradeLicenseExpiry")} type="date" className="form-input" />
          </FormField>
          <FormField label="Insurance Policy Number *" error={errors.insurancePolicyNumber?.message}>
            <input {...register("insurancePolicyNumber")} className="form-input" placeholder="INS-123456789" />
          </FormField>
          <FormField label="Insurance Expiry *" error={errors.insuranceExpiry?.message}>
            <input {...register("insuranceExpiry")} type="date" className="form-input" />
          </FormField>
        </div>
      </Section>

      <Section title="Banking Details (Optional)" bordered description="Bank account for payments. Can be completed later.">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Bank Name" error={errors.bankName?.message}>
            <input {...register("bankName")} className="form-input" placeholder="Emirates NBD" />
          </FormField>
          <FormField label="Account Holder" error={errors.accountHolderName?.message}>
            <input {...register("accountHolderName")} className="form-input" placeholder="ABC LLC" />
          </FormField>
          <FormField label="Account Number" error={errors.accountNumber?.message}>
            <input {...register("accountNumber")} className="form-input" placeholder="1234567890" />
          </FormField>
          <FormField label="SWIFT Code" error={errors.swiftCode?.message}>
            <input {...register("swiftCode")} className="form-input" placeholder="EBILAEAD" />
          </FormField>
        </div>
        <FormField label="IBAN" error={errors.iban?.message}>
          <input {...register("iban")} className="form-input" placeholder="AE07 0331 2345 6789 0123 456" />
        </FormField>
      </Section>

      <div className="flex gap-4 pt-4">
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Update Application
        </button>
        <button type="button" onClick={() => router.push("/vendor-application")} disabled={isSubmitting} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  )
}

function Section({ title, bordered, description, children }: { title: string; bordered?: boolean; description?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-4 ${bordered ? "border-t border-[var(--charcoal)] pt-6" : ""}`}>
      <h3 className="text-sm font-medium text-[var(--gold)] uppercase tracking-wider">{title}</h3>
      {description && <p className="text-sm text-[var(--text-muted)]">{description}</p>}
      {children}
    </div>
  )
}
