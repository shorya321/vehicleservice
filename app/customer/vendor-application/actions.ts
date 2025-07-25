"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
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
      .from('vendor_applications')
      .select('user_id, status')
      .eq('id', applicationId)
      .single()

    if (fetchError || !application) {
      return { error: "Application not found" }
    }

    if (application.user_id !== user.id) {
      return { error: "Unauthorized" }
    }

    if (application.status !== 'pending') {
      return { error: "Only pending applications can be updated" }
    }

    // Prepare documents JSON
    const documents = {
      trade_license_number: values.tradeLicenseNumber,
      trade_license_expiry: values.tradeLicenseExpiry,
      insurance_policy_number: values.insurancePolicyNumber,
      insurance_expiry: values.insuranceExpiry,
    }

    // Prepare banking details JSON
    const banking_details = {
      bank_name: values.bankName || null,
      account_holder_name: values.accountHolderName || null,
      account_number: values.accountNumber || null,
      iban: values.iban || null,
      swift_code: values.swiftCode || null,
    }

    // Update the application
    const { error: updateError } = await supabase
      .from('vendor_applications')
      .update({
        business_name: values.businessName,
        business_email: values.businessEmail || null,
        business_phone: values.businessPhone || null,
        business_address: values.businessAddress || null,
        business_city: values.businessCity || null,
        business_country_code: values.businessCountryCode,
        business_description: values.businessDescription || null,
        registration_number: values.registrationNumber,
        documents: documents,
        banking_details: banking_details,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)

    if (updateError) {
      console.error('Update error:', updateError)
      return { error: "Failed to update application" }
    }

    revalidatePath('/customer/vendor-application')
    revalidatePath('/customer/vendor-application/edit')
    return {}
  } catch (error) {
    console.error('Update vendor application error:', error)
    return { error: "An unexpected error occurred" }
  }
}