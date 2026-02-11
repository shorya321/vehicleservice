/**
 * Admin Wallet Audit Log API Route
 * Allows admins to view wallet audit logs
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/business/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Unauthorized', 401);
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return apiError('Forbidden: Admin access required', 403);
    }

    const { searchParams } = new URL(request.url);
    const businessAccountId = id;

    // Parse query parameters
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const actionTypes = searchParams.get('action_types')?.split(',');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify business account exists
    const { data: businessAccount } = await supabase
      .from('business_accounts')
      .select('id, business_name')
      .eq('id', businessAccountId)
      .single();

    if (!businessAccount) {
      return apiError('Business account not found', 404);
    }

    // Call get_admin_audit_log function
    const { data: auditLogs, error } = await supabase.rpc('get_admin_audit_log', {
      p_business_account_id: businessAccountId,
      p_admin_user_id: null, // Get all admins
      p_start_date: startDate || null,
      p_end_date: endDate || null,
      p_action_types: actionTypes || null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Error fetching audit log:', error);
      return apiError(error.message, 400);
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('admin_wallet_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('business_account_id', businessAccountId);

    if (startDate) {
      countQuery = countQuery.gte('created_at', startDate);
    }
    if (endDate) {
      countQuery = countQuery.lte('created_at', endDate);
    }
    if (actionTypes && actionTypes.length > 0) {
      countQuery = countQuery.in('action_type', actionTypes);
    }

    const { count } = await countQuery;

    return apiSuccess({
      business: {
        id: businessAccount.id,
        name: businessAccount.business_name,
      },
      audit_logs: auditLogs || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        has_more: (count || 0) > offset + limit,
      },
      filters: {
        start_date: startDate,
        end_date: endDate,
        action_types: actionTypes,
      },
    });
  } catch (error) {
    console.error('Error in audit log retrieval:', error);
    return apiError('Internal server error', 500);
  }
}
