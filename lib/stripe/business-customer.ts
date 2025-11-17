import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export interface BusinessDetails {
  business_name: string
  business_email: string
  business_phone?: string | null
  address?: string | null
  city?: string | null
  country_code?: string | null
}

/**
 * Get or create a Stripe customer for a business account
 * This ensures all PaymentIntents/SetupIntents are attached to a customer,
 * which allows Stripe to reuse payment methods instead of creating duplicates
 *
 * @param businessAccountId - The UUID of the business account
 * @param businessDetails - Business information for customer creation
 * @returns Stripe customer ID (cus_xxx format)
 */
export async function getOrCreateBusinessStripeCustomer(
  businessAccountId: string,
  businessDetails: BusinessDetails
): Promise<string> {
  const adminClient = createAdminClient()

  // Step 1: Check if business account already has a Stripe customer ID
  const { data: businessAccount, error: fetchError } = await adminClient
    .from('business_accounts')
    .select('stripe_customer_id')
    .eq('id', businessAccountId)
    .single()

  if (fetchError) {
    console.error('Error fetching business account:', fetchError)
    throw new Error('Failed to fetch business account')
  }

  // Step 2: If customer ID exists, verify it's still valid in Stripe
  if (businessAccount.stripe_customer_id) {
    try {
      // Verify customer exists in Stripe
      await stripe.customers.retrieve(businessAccount.stripe_customer_id)

      console.log('Existing Stripe customer verified:', {
        customerId: businessAccount.stripe_customer_id,
        businessAccountId,
      })

      return businessAccount.stripe_customer_id
    } catch (error) {
      // Customer doesn't exist in Stripe (deleted or invalid)
      console.log('Stripe customer not found, creating new one:', {
        oldCustomerId: businessAccount.stripe_customer_id,
        businessAccountId,
      })
    }
  }

  // Step 3: Create new Stripe customer
  try {
    const customerParams: Stripe.CustomerCreateParams = {
      email: businessDetails.business_email,
      name: businessDetails.business_name,
      phone: businessDetails.business_phone || undefined,
      description: `Business Account: ${businessDetails.business_name}`,
      metadata: {
        business_account_id: businessAccountId,
        source: 'wallet_recharge',
      },
    }

    // Add address if available
    if (businessDetails.address && businessDetails.city && businessDetails.country_code) {
      customerParams.address = {
        line1: businessDetails.address,
        city: businessDetails.city,
        country: businessDetails.country_code,
      }
    }

    // Create customer
    const customer = await stripe.customers.create(customerParams)

    console.log('Stripe customer created:', {
      customerId: customer.id,
      businessAccountId,
    })

    // Step 4: Save customer ID to business account
    const { error: updateError } = await adminClient
      .from('business_accounts')
      .update({ stripe_customer_id: customer.id })
      .eq('id', businessAccountId)

    if (updateError) {
      console.error('Error saving customer ID to database:', updateError)
      // Don't throw - customer is created in Stripe, just log the error
    }

    return customer.id
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(`Stripe error: ${error.message}`)
    }
    throw new Error('Failed to create Stripe customer')
  }
}

/**
 * Helper function to format business details from database row
 * @param businessAccount - Business account row from database
 * @returns Formatted BusinessDetails object
 */
export function formatBusinessDetails(businessAccount: any): BusinessDetails {
  return {
    business_name: businessAccount.business_name,
    business_email: businessAccount.business_email,
    business_phone: businessAccount.business_phone || null,
    address: businessAccount.address || null,
    city: businessAccount.city || null,
    country_code: businessAccount.country_code || null,
  }
}
