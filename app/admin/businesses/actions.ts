'use server';

/**
 * Server Actions for Business Account Management
 * Handles approve, reject, suspend, reactivate operations
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

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

export async function quickApproveBusinessAction(businessId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('business_accounts')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', businessId)
      .eq('status', 'pending'); // Only approve if pending

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/businesses');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to approve business' };
  }
}

export async function quickRejectBusinessAction(businessId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('business_accounts')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', businessId)
      .eq('status', 'pending'); // Only reject if pending

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/businesses');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to reject business' };
  }
}

export async function quickSuspendBusinessAction(businessId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('business_accounts')
      .update({ status: 'suspended', updated_at: new Date().toISOString() })
      .eq('id', businessId)
      .eq('status', 'active'); // Only suspend if active

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/businesses');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to suspend business' };
  }
}

export async function quickReactivateBusinessAction(businessId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('business_accounts')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', businessId)
      .eq('status', 'suspended'); // Only reactivate if suspended

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/businesses');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to reactivate business' };
  }
}

export async function bulkApproveBusinessesAction(businessIds: string[]) {
  try {
    const { error } = await supabaseAdmin
      .from('business_accounts')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .in('id', businessIds)
      .eq('status', 'pending');

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/businesses');
    return { success: true, count: businessIds.length };
  } catch (error) {
    return { success: false, error: 'Failed to bulk approve businesses' };
  }
}

export async function bulkSuspendBusinessesAction(businessIds: string[]) {
  try {
    const { error } = await supabaseAdmin
      .from('business_accounts')
      .update({ status: 'suspended', updated_at: new Date().toISOString() })
      .in('id', businessIds)
      .eq('status', 'active');

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/businesses');
    return { success: true, count: businessIds.length };
  } catch (error) {
    return { success: false, error: 'Failed to bulk suspend businesses' };
  }
}

export async function bulkReactivateBusinessesAction(businessIds: string[]) {
  try {
    const { error } = await supabaseAdmin
      .from('business_accounts')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .in('id', businessIds)
      .eq('status', 'suspended');

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/businesses');
    return { success: true, count: businessIds.length };
  } catch (error) {
    return { success: false, error: 'Failed to bulk reactivate businesses' };
  }
}
