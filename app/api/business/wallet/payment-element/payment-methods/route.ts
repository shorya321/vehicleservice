/**
 * Payment Element - Payment Methods Management
 * List, add, update, and delete saved payment methods
 */

import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { requireBusinessAuth, apiSuccess, apiError } from '@/lib/business/api-utils';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

/**
 * GET /api/business/wallet/payment-element/payment-methods
 * List all saved payment methods for the business
 */
export const GET = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const { createClient: createSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = await createSupabaseClient();

    // Fetch payment methods from database
    const { data: paymentMethods, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('business_account_id', user.businessAccountId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment methods:', error);
      return apiError('Failed to fetch payment methods', 500);
    }

    return apiSuccess({
      payment_methods: paymentMethods,
      count: paymentMethods.length,
    });
  } catch (error) {
    console.error('Payment methods fetch error:', error);
    return apiError('Failed to fetch payment methods', 500);
  }
});

/**
 * POST /api/business/wallet/payment-element/payment-methods
 * Save a new payment method after successful payment
 */
export const POST = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { payment_method_id, set_as_default } = body;

    if (!payment_method_id) {
      return apiError('Payment method ID is required', 400);
    }

    // Create admin Supabase client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get business account
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('save_payment_methods')
      .eq('id', user.businessAccountId)
      .single();

    if (!businessAccount?.save_payment_methods) {
      return apiError('Saving payment methods is not enabled for this business', 403);
    }

    // Fetch payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);

    // Extract card details if it's a card
    let cardDetails = {};
    if (paymentMethod.type === 'card' && paymentMethod.card) {
      cardDetails = {
        card_brand: paymentMethod.card.brand,
        card_last4: paymentMethod.card.last4,
        card_exp_month: paymentMethod.card.exp_month,
        card_exp_year: paymentMethod.card.exp_year,
        card_funding: paymentMethod.card.funding,
      };
    }

    // Check if payment method already exists (including soft-deleted ones)
    // Use array query to handle duplicates gracefully (not .single())
    const { data: existingPMs } = await supabaseAdmin
      .from('payment_methods')
      .select('id, is_active, last_used_at, created_at')
      .eq('stripe_payment_method_id', payment_method_id)
      .eq('business_account_id', user.businessAccountId)
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (existingPMs && existingPMs.length > 0) {
      // Find active PM or use most recently used
      const activePM = existingPMs.find(pm => pm.is_active);
      const existingPM = activePM || existingPMs[0];

      if (activePM) {
        // Payment method is already active
        return apiError('Payment method already saved', 409);
      }

      // Reactivate soft-deleted payment method
      const { data: reactivatedPM, error: reactivateError } = await supabaseAdmin
        .from('payment_methods')
        .update({
          is_active: true,
          is_default: set_as_default || false,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existingPM.id)
        .select()
        .single();

      if (reactivateError) {
        console.error('Error reactivating payment method:', reactivateError);
        return apiError('Failed to reactivate payment method', 500);
      }

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

          console.log(`🧹 Deactivated ${otherIds.length} duplicate payment methods during manual save`);
        }
      }

      return apiSuccess({
        message: 'Payment method reactivated successfully',
        payment_method: reactivatedPM,
      });
    }

    // Insert into database
    const { data: savedPM, error: insertError } = await supabaseAdmin
      .from('payment_methods')
      .insert({
        business_account_id: user.businessAccountId,
        stripe_payment_method_id: payment_method_id,
        payment_method_type: paymentMethod.type,
        ...cardDetails,
        billing_email: paymentMethod.billing_details?.email,
        billing_name: paymentMethod.billing_details?.name,
        billing_country: paymentMethod.billing_details?.address?.country,
        is_default: set_as_default || false,
        is_active: true,
        last_used_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving payment method:', insertError);
      return apiError('Failed to save payment method', 500);
    }

    return apiSuccess({
      message: 'Payment method saved successfully',
      payment_method: savedPM,
    });
  } catch (error) {
    console.error('Save payment method error:', error);
    if (error instanceof Stripe.errors.StripeError) {
      return apiError(error.message, 400);
    }
    return apiError('Failed to save payment method', 500);
  }
});

/**
 * PATCH /api/business/wallet/payment-element/payment-methods
 * Update payment method (e.g., set as default)
 */
export const PATCH = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { payment_method_id, set_as_default } = body;

    if (!payment_method_id) {
      return apiError('Payment method ID is required', 400);
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Update payment method
    const updateData: Record<string, any> = {};
    if (set_as_default !== undefined) {
      updateData.is_default = set_as_default;
    }

    const { data: updatedPM, error } = await supabaseAdmin
      .from('payment_methods')
      .update(updateData)
      .eq('id', payment_method_id)
      .eq('business_account_id', user.businessAccountId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment method:', error);
      return apiError('Failed to update payment method', 500);
    }

    return apiSuccess({
      message: 'Payment method updated successfully',
      payment_method: updatedPM,
    });
  } catch (error) {
    console.error('Update payment method error:', error);
    return apiError('Failed to update payment method', 500);
  }
});

/**
 * DELETE /api/business/wallet/payment-element/payment-methods
 * Delete a saved payment method
 */
export const DELETE = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      return apiError('Payment method ID is required', 400);
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Soft delete (mark as inactive)
    const { error } = await supabaseAdmin
      .from('payment_methods')
      .update({ is_active: false, is_default: false })
      .eq('id', paymentMethodId)
      .eq('business_account_id', user.businessAccountId);

    if (error) {
      console.error('Error deleting payment method:', error);
      return apiError('Failed to delete payment method', 500);
    }

    return apiSuccess({
      message: 'Payment method deleted successfully',
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    return apiError('Failed to delete payment method', 500);
  }
});
