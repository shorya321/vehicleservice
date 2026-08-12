"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { vendorApplicationSchema } from "./schemas"
import * as z from "zod"

export async function updateVendorApplication(
  applicationId: string,
  values: z.infer<typeof vendorApplicationSchema>
): Promise<{ error?: string }> {
  const supabase = await createClient()

  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    // Verify the application belongs to the user and is pending
    const { data: application, error: fetchError } = await supabase
      .from("vendor_applications")
      .select("user_id, status")
      .eq("id", applicationId)
      .single()

    if (fetchError || !application) {
      return { error: "Application not found" }
    }

    if (application.user_id !== user.id) {
      return { error: "Unauthorized" }
    }

    if (application.status !== "pending") {
      return { error: "Only pending applications can be updated" }
    }

    // Parsed here, not only typed. The schema was previously used for the argument type
    // alone, so an edit could blank a field the create form insists on, including the
    // business email that the approval and rejection notices are addressed to.
    const parsed = vendorApplicationSchema.safeParse(values)
    if (!parsed.success) {
      return { error: "Please check the form and try again" }
    }
    const data = parsed.data

    // Prepare documents JSON
    const documents = {
      trade_license_number: data.tradeLicenseNumber,
      trade_license_expiry: data.tradeLicenseExpiry,
      insurance_policy_number: data.insurancePolicyNumber,
      insurance_expiry: data.insuranceExpiry,
    }

    // Prepare banking details JSON
    const banking_details = {
      bank_name: data.bankName || null,
      account_holder_name: data.accountHolderName || null,
      account_number: data.accountNumber || null,
      iban: data.iban || null,
      swift_code: data.swiftCode || null,
    }

    // Update the application.
    // The status filter is repeated here so the write is scoped in SQL, not only by
    // the read-then-write check above (which races an admin approving concurrently).
    const { data: updated, error: updateError } = await supabase
      .from("vendor_applications")
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .eq("status", "pending")
      .select("id")

    if (updateError) {
      console.error("Update error:", updateError)
      return { error: "Failed to update application" }
    }

    // A zero-row update is not an error in PostgREST, so without this check an
    // RLS-blocked write would report success and silently discard the changes.
    if (!updated || updated.length === 0) {
      console.error("Update matched no rows for application", applicationId)
      return { error: "Your changes could not be saved. Please refresh and try again." }
    }

    revalidatePath("/vendor-application")
    revalidatePath("/vendor-application/edit")
    return {}
  } catch (error) {
    console.error("Update vendor application error:", error)
    return { error: "An unexpected error occurred" }
  }
}
