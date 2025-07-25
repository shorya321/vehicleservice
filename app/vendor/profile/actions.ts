"use server"

import { createClient } from "@/lib/supabase/server"
import { VendorProfileFormData } from "@/lib/types/vendor-application"
import { revalidatePath } from "next/cache"

export async function saveBusinessProfile(
  vendorId: string, 
  data: VendorProfileFormData,
  isUpdate: boolean
) {
  const supabase = await createClient()

  try {
    // Always update - vendor application should already exist for approved vendors
    // Prepare documents JSON
    const documents = {
      trade_license_number: data.trade_license_number || null,
      trade_license_expiry: data.trade_license_expiry || null,
      insurance_policy_number: data.insurance_policy_number || null,
      insurance_expiry: data.insurance_expiry || null,
    }

    // Prepare banking details JSON
    const banking_details = {
      bank_name: data.bank_name || null,
      account_holder_name: data.account_holder_name || null,
      account_number: data.account_number || null,
      iban: data.iban || null,
      swift_code: data.swift_code || null,
    }

    const { error } = await supabase
      .from('vendor_applications')
      .update({
        business_name: data.business_name,
        business_email: data.business_email || null,
        business_phone: data.business_phone || null,
        business_address: data.business_address || null,
        business_city: data.business_city || null,
        business_country_code: data.business_country_code,
        business_description: data.business_description || null,
        registration_number: data.registration_number,
        documents: documents,
        banking_details: banking_details,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', vendorId)

    if (error) {
      console.error('Error updating vendor business profile:', error)
      return { error: error.message }
    }

    revalidatePath('/vendor/profile')
    revalidatePath('/vendor/dashboard')
    
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}