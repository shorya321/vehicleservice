"use server"

import { createClient } from "@/lib/supabase/server"
import { getAdminEmail, getAppUrl } from "@/lib/email/config"
import { sendNewVendorApplicationNotificationEmail } from "@/lib/email/services/admin-emails"
import { formatBookingDate } from "@/lib/utils/timezone"
import * as z from "zod"

const vendorApplicationSchema = z.object({
  businessName: z.string().min(2),
  businessEmail: z.string().email().optional().or(z.literal("")),
  businessPhone: z.string().min(6).optional().or(z.literal("")),
  businessAddress: z.string().optional(),
  businessCity: z.string().optional(),
  businessCountryCode: z.string().default("AE"),
  businessDescription: z.string().optional(),
  registrationNumber: z.string().min(1),
  tradeLicenseNumber: z.string().min(1),
  tradeLicenseExpiry: z.string().min(1),
  insurancePolicyNumber: z.string().min(1),
  insuranceExpiry: z.string().min(1),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
})

/**
 * Create a vendor application.
 *
 * The insert lives on the server so the admin notification has somewhere to run; the
 * write still goes through the applicant's own session, so the existing RLS check
 * (own row, role customer, no prior application) remains the authority.
 */
export async function createVendorApplication(
  values: z.infer<typeof vendorApplicationSchema>
): Promise<{ error?: string; code?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    const parsed = vendorApplicationSchema.safeParse(values)
    if (!parsed.success) {
      return { error: "Please check the form and try again" }
    }
    const data = parsed.data

    const documents = {
      trade_license_number: data.tradeLicenseNumber || null,
      trade_license_expiry: data.tradeLicenseExpiry || null,
      insurance_policy_number: data.insurancePolicyNumber || null,
      insurance_expiry: data.insuranceExpiry || null,
    }

    const banking_details = {
      bank_name: data.bankName || null,
      account_holder_name: data.accountHolderName || null,
      account_number: data.accountNumber || null,
      iban: data.iban || null,
      swift_code: data.swiftCode || null,
    }

    const { data: application, error: insertError } = await supabase
      .from("vendor_applications")
      .insert({
        user_id: user.id,
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
      .select("id")
      .single()

    if (insertError) {
      // Surfaced to the caller rather than mapped to a message here: the form already
      // handles the duplicate case by redirecting to the existing application.
      if (insertError.code === "23505") {
        return { code: "23505" }
      }
      console.error("Vendor application insert error:", insertError)
      return { error: "Failed to submit application" }
    }

    // Notify the admin. Wrapped on its own because getAdminEmail() throws when the env
    // is unset, and a mail failure must not undo an application that is already stored.
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single()

      const result = await sendNewVendorApplicationNotificationEmail({
        adminEmail: getAdminEmail(),
        applicationId: application.id,
        applicationReference: application.id,
        applicantName: profile?.full_name || data.businessName,
        applicantEmail: data.businessEmail || profile?.email || user.email || "",
        companyName: data.businessName,
        submittedDate: formatBookingDate(new Date()),
        applicationDetailsUrl: `${getAppUrl()}/admin/vendor-applications/${application.id}`,
      })

      if (!result.success) {
        console.error("[VendorApplication] admin notification failed:", result.error)
      }
    } catch (emailError) {
      console.error("[VendorApplication] admin notification error:", emailError)
    }

    return {}
  } catch (error) {
    console.error("Create vendor application error:", error)
    return { error: "An unexpected error occurred" }
  }
}
