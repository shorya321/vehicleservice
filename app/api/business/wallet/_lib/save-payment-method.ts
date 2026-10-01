/**
 * Moved verbatim out of app/api/business/wallet/webhook/route.ts so the verify-intent
 * backup path can save the card too when it credits ahead of a late webhook. Route files
 * may only export HTTP handlers, hence this module.
 */

import Stripe from 'stripe';

/**
 * Helper function to save payment method after successful payment
 * Extracts payment method from Stripe and saves to database
 */
export async function savePaymentMethod(
  stripe: Stripe,
  supabaseAdmin: any,
  businessAccountId: string,
  paymentMethodId: string
): Promise<void> {
  try {
    // Check if business allows saving payment methods
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('save_payment_methods')
      .eq('id', businessAccountId)
      .single();

    if (!businessAccount?.save_payment_methods) {
      console.log('Saving payment methods disabled for business:', businessAccountId);
      return;
    }

    // Check if payment method already exists (including soft-deleted ones)
    // Use array query to handle duplicates gracefully (not .single())
    const { data: existingPMs, error: checkError } = await supabaseAdmin
      .from('payment_methods')
      .select('id, is_active, last_used_at, card_last4, card_brand, created_at')
      .eq('stripe_payment_method_id', paymentMethodId)
      .eq('business_account_id', businessAccountId)
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (existingPMs && existingPMs.length > 0) {
      // Find active PM or use most recently used
      const activePM = existingPMs.find(pm => pm.is_active);
      const existingPM = activePM || existingPMs[0];

      // Reactivate/update the chosen PM
      await supabaseAdmin
        .from('payment_methods')
        .update({
          is_active: true, // Reactivate if was soft-deleted
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existingPM.id);

      // If multiple duplicates exist, deactivate the others
      if (existingPMs.length > 1) {
        const otherIds = existingPMs
          .filter(pm => pm.id !== existingPM.id)
          .map(pm => pm.id);

        if (otherIds.length > 0) {
          await supabaseAdmin
            .from('payment_methods')
            .update({ is_active: false })
            .in('id', otherIds);
        }
      }

      return;
    }

    // Retrieve payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Extract card details if it's a card
    const cardDetails: Record<string, any> = {};
    if (paymentMethod.type === 'card' && paymentMethod.card) {
      cardDetails.card_brand = paymentMethod.card.brand;
      cardDetails.card_last4 = paymentMethod.card.last4;
      cardDetails.card_exp_month = paymentMethod.card.exp_month;
      cardDetails.card_exp_year = paymentMethod.card.exp_year;
      cardDetails.card_funding = paymentMethod.card.funding;
    }

    // Check if this is the first payment method (should be default)
    const { data: existingMethods } = await supabaseAdmin
      .from('payment_methods')
      .select('id')
      .eq('business_account_id', businessAccountId)
      .eq('is_active', true);

    const isFirstMethod = !existingMethods || existingMethods.length === 0;

    // Save to database
    const insertData = {
      business_account_id: businessAccountId,
      stripe_payment_method_id: paymentMethodId,
      payment_method_type: paymentMethod.type,
      ...cardDetails,
      billing_email: paymentMethod.billing_details?.email,
      billing_name: paymentMethod.billing_details?.name,
      billing_country: paymentMethod.billing_details?.address?.country,
      is_default: isFirstMethod, // First payment method becomes default
      is_active: true,
      last_used_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabaseAdmin
      .from('payment_methods')
      .insert(insertData);

    if (insertError) {
      console.error('Error saving payment method:', insertError);
      return;
    }
  } catch (error) {
    console.error('Error in savePaymentMethod:', error);
    // Don't throw - we don't want to fail the webhook if payment method saving fails
  }
}
