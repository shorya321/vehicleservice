'use server';

/**
 * Server Actions for Business Account Management
 * Handles approve, reject, suspend, reactivate operations
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { removeDomainFromVercel, isVercelConfigured } from '@/lib/vercel/api';
import { stripe } from '@/lib/stripe/server';

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

export async function deleteBusinessAction(businessId: string) {
  try {
    const { data: business, error: fetchError } = await supabaseAdmin
      .from('business_accounts')
      .select('id, business_name, custom_domain, custom_domain_verified, stripe_customer_id')
      .eq('id', businessId)
      .single();

    if (fetchError || !business) {
      return { success: false, error: 'Business account not found' };
    }

    const { data: businessUsers } = await supabaseAdmin
      .from('business_users')
      .select('auth_user_id')
      .eq('business_account_id', businessId);

    const authUserIds = businessUsers?.map((u) => u.auth_user_id) ?? [];

    if (business.custom_domain && business.custom_domain_verified && isVercelConfigured()) {
      try {
        await removeDomainFromVercel(business.custom_domain);
      } catch {
        console.error(`Failed to remove domain ${business.custom_domain} from Vercel`);
      }
    }

    if (business.stripe_customer_id && stripe) {
      try {
        await stripe.customers.del(business.stripe_customer_id);
      } catch (stripeError: unknown) {
        const isAlreadyDeleted =
          stripeError instanceof Error &&
          'code' in stripeError &&
          (stripeError as { code: string }).code === 'resource_missing';
        if (!isAlreadyDeleted) {
          console.error(`Failed to delete Stripe customer ${business.stripe_customer_id}`);
        }
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from('business_accounts')
      .delete()
      .eq('id', businessId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    for (const authUserId of authUserIds) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
      } catch {
        console.error(`Failed to delete auth user ${authUserId}`);
      }
    }

    revalidatePath('/admin/businesses');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete business account' };
  }
}

export async function bulkDeleteBusinessesAction(businessIds: string[]) {
  try {
    let successCount = 0;
    let failCount = 0;

    for (const id of businessIds) {
      const result = await deleteBusinessAction(id);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    revalidatePath('/admin/businesses');

    if (failCount > 0) {
      return {
        success: successCount > 0,
        error: `Deleted ${successCount} of ${businessIds.length} businesses. ${failCount} failed.`,
        count: successCount,
      };
    }

    return { success: true, count: successCount };
  } catch (error) {
    return { success: false, error: 'Failed to bulk delete businesses' };
  }
}
