"use server"

import { createClient } from "@/lib/supabase/server"
import { getAdminEmail, getAppUrl } from "@/lib/email/config"
import { sendNewVendorApplicationNotificationEmail } from "@/lib/email/services/admin-emails"
import { sendVendorApplicationReceivedEmail } from "@/lib/email/services/vendor-emails"
import { formatBookingDate } from "@/lib/utils/timezone"
import { vendorApplicationSchema } from "@/app/vendor-application/schemas"
import * as z from "zod"

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
        business_email: data.businessEmail,
        business_phone: data.businessPhone,
        business_address: data.businessAddress,
        business_city: data.businessCity,
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

    // Notify the admin and confirm to the applicant. Wrapped on its own because
    // getAdminEmail() throws when the env is unset, and a mail failure must not undo an
    // application that is already stored.
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single()

      const applicantName = profile?.full_name || data.businessName
      const submittedDate = formatBookingDate(new Date())

      // The account email, not businessEmail: the confirmation goes to the person who
      // applied, and the business field is optional and describes the company.
      const applicantEmail = profile?.email || user.email || data.businessEmail || ""

      const [adminResult, applicantResult] = await Promise.allSettled([
        sendNewVendorApplicationNotificationEmail({
          adminEmail: getAdminEmail(),
          applicationId: application.id,
          applicationReference: application.id,
          applicantName,
          applicantEmail: data.businessEmail || profile?.email || user.email || "",
          businessPhone: data.businessPhone || "Not provided",
          companyName: data.businessName,
          submittedDate,
          applicationDetailsUrl: `${getAppUrl()}/admin/vendor-applications/${application.id}`,
        }),
        applicantEmail
          ? sendVendorApplicationReceivedEmail({
              email: applicantEmail,
              name: applicantName,
              applicationReference: application.id,
              submittedDate,
            })
          : Promise.resolve({ success: false, error: "no applicant email on file" }),
      ])

      // Reported separately so a failure names which of the two it was.
      if (adminResult.status === "rejected") {
        console.error("[VendorApplication] admin notification threw:", adminResult.reason)
      } else if (!adminResult.value.success) {
        console.error("[VendorApplication] admin notification failed:", adminResult.value.error)
      }

      if (applicantResult.status === "rejected") {
        console.error("[VendorApplication] applicant confirmation threw:", applicantResult.reason)
      } else if (!applicantResult.value.success) {
        console.error(
          "[VendorApplication] applicant confirmation failed:",
          applicantResult.value.error
        )
      }
    } catch (emailError) {
      console.error("[VendorApplication] notification error:", emailError)
    }

    return {}
  } catch (error) {
    console.error("Create vendor application error:", error)
    return { error: "An unexpected error occurred" }
  }
}
