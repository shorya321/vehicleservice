"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Building2, FileText, Landmark } from "lucide-react"
import { countries } from "@/lib/constants/countries"
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
      {/* Business Information */}
      <div className="account-section">
        <div className="account-section-header">
          <div className="account-section-icon">
            <Building2 className="w-5 h-5 text-[var(--gold)]" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-[var(--text-primary)]">Business Information</h3>
            <p className="text-sm text-[var(--text-muted)]">Your business details and contact information</p>
          </div>
        </div>
        <div className="account-section-content">
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Business Name *</label>
                <input {...register("businessName")} className="luxury-input" placeholder="ABC Car Rentals" />
                {errors.businessName && <p className="mt-1.5 text-sm text-red-400">{errors.businessName.message}</p>}
              </div>
              <div>
                <label className="form-label">Registration Number *</label>
                <input {...register("registrationNumber")} className="luxury-input" placeholder="123456789" />
                {errors.registrationNumber && <p className="mt-1.5 text-sm text-red-400">{errors.registrationNumber.message}</p>}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Business Email</label>
                <input {...register("businessEmail")} type="email" className="luxury-input" placeholder="contact@business.com" />
                {errors.businessEmail && <p className="mt-1.5 text-sm text-red-400">{errors.businessEmail.message}</p>}
              </div>
              <div>
                <label className="form-label">Business Phone</label>
                <input {...register("businessPhone")} className="luxury-input" placeholder="+971 50 123 4567" />
                {errors.businessPhone && <p className="mt-1.5 text-sm text-red-400">{errors.businessPhone.message}</p>}
              </div>
            </div>
            <div>
              <label className="form-label">Business Address</label>
              <input {...register("businessAddress")} className="luxury-input" placeholder="123 Main Street" />
              {errors.businessAddress && <p className="mt-1.5 text-sm text-red-400">{errors.businessAddress.message}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">City</label>
                <input {...register("businessCity")} className="luxury-input" placeholder="Dubai" />
                {errors.businessCity && <p className="mt-1.5 text-sm text-red-400">{errors.businessCity.message}</p>}
              </div>
              <div>
                <label className="form-label">Country</label>
                <select {...register("businessCountryCode")} className="luxury-input">
                  {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                {errors.businessCountryCode && <p className="mt-1.5 text-sm text-red-400">{errors.businessCountryCode.message}</p>}
              </div>
            </div>
            <div>
              <label className="form-label">Business Description</label>
              <textarea {...register("businessDescription")} className="luxury-input min-h-[80px]" placeholder="About your business..." />
              {errors.businessDescription && <p className="mt-1.5 text-sm text-red-400">{errors.businessDescription.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Required Documents */}
      <div className="account-section">
        <div className="account-section-header">
          <div className="account-section-icon">
            <FileText className="w-5 h-5 text-[var(--gold)]" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-[var(--text-primary)]">Required Documents</h3>
            <p className="text-sm text-[var(--text-muted)]">Trade license and insurance details</p>
          </div>
        </div>
        <div className="account-section-content">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Trade License Number *</label>
              <input {...register("tradeLicenseNumber")} className="luxury-input" placeholder="TL-123456789" />
              {errors.tradeLicenseNumber && <p className="mt-1.5 text-sm text-red-400">{errors.tradeLicenseNumber.message}</p>}
            </div>
            <div>
              <label className="form-label">Trade License Expiry *</label>
              <input {...register("tradeLicenseExpiry")} type="date" className="luxury-input" />
              {errors.tradeLicenseExpiry && <p className="mt-1.5 text-sm text-red-400">{errors.tradeLicenseExpiry.message}</p>}
            </div>
            <div>
              <label className="form-label">Insurance Policy Number *</label>
              <input {...register("insurancePolicyNumber")} className="luxury-input" placeholder="INS-123456789" />
              {errors.insurancePolicyNumber && <p className="mt-1.5 text-sm text-red-400">{errors.insurancePolicyNumber.message}</p>}
            </div>
            <div>
              <label className="form-label">Insurance Expiry *</label>
              <input {...register("insuranceExpiry")} type="date" className="luxury-input" />
              {errors.insuranceExpiry && <p className="mt-1.5 text-sm text-red-400">{errors.insuranceExpiry.message}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Banking Details */}
      <div className="account-section">
        <div className="account-section-header">
          <div className="account-section-icon">
            <Landmark className="w-5 h-5 text-[var(--gold)]" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-[var(--text-primary)]">Banking Details</h3>
            <p className="text-sm text-[var(--text-muted)]">Bank account for payments. Can be completed later.</p>
          </div>
        </div>
        <div className="account-section-content">
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Bank Name</label>
                <input {...register("bankName")} className="luxury-input" placeholder="Emirates NBD" />
                {errors.bankName && <p className="mt-1.5 text-sm text-red-400">{errors.bankName.message}</p>}
              </div>
              <div>
                <label className="form-label">Account Holder</label>
                <input {...register("accountHolderName")} className="luxury-input" placeholder="ABC LLC" />
                {errors.accountHolderName && <p className="mt-1.5 text-sm text-red-400">{errors.accountHolderName.message}</p>}
              </div>
              <div>
                <label className="form-label">Account Number</label>
                <input {...register("accountNumber")} className="luxury-input" placeholder="1234567890" />
                {errors.accountNumber && <p className="mt-1.5 text-sm text-red-400">{errors.accountNumber.message}</p>}
              </div>
              <div>
                <label className="form-label">SWIFT Code</label>
                <input {...register("swiftCode")} className="luxury-input" placeholder="EBILAEAD" />
                {errors.swiftCode && <p className="mt-1.5 text-sm text-red-400">{errors.swiftCode.message}</p>}
              </div>
            </div>
            <div>
              <label className="form-label">IBAN</label>
              <input {...register("iban")} className="luxury-input" placeholder="AE07 0331 2345 6789 0123 456" />
              {errors.iban && <p className="mt-1.5 text-sm text-red-400">{errors.iban.message}</p>}
            </div>
          </div>
        </div>
      </div>

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
