'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

export async function getVendorApplicationsStats() {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    
    let total = 0, pending = 0, approved = 0, rejected = 0
    
    // Get total count
    try {
      const { count, error } = await supabase
        .from('vendor_applications')
        .select('*', { count: 'exact', head: true })
        
      if (error) {
        console.error('Error fetching total vendor applications:', error)
        throw error
      }
      total = count || 0
    } catch (error) {
      console.error('Failed to fetch total count:', error)
    }

    // Get pending count
    try {
      const { count, error } = await supabase
        .from('vendor_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        
      if (error) {
        console.error('Error fetching pending vendor applications:', error)
        throw error
      }
      pending = count || 0
    } catch (error) {
      console.error('Failed to fetch pending count:', error)
    }

    // Get approved count
    try {
      const { count, error } = await supabase
        .from('vendor_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        
      if (error) {
        console.error('Error fetching approved vendor applications:', error)
        throw error
      }
      approved = count || 0
    } catch (error) {
      console.error('Failed to fetch approved count:', error)
    }

    // Get rejected count
    try {
      const { count, error } = await supabase
        .from('vendor_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        
      if (error) {
        console.error('Error fetching rejected vendor applications:', error)
        throw error
      }
      rejected = count || 0
    } catch (error) {
      console.error('Failed to fetch rejected count:', error)
    }

    return {
      total,
      pending,
      approved,
      rejected
    }
  } catch (error) {
    console.error('Error in getVendorApplicationsStats:', error)
    // Return default values on error
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    }
  }
}

export async function getVendorApplications({
  search,
  status,
  page = 1,
  limit = 10
}: {
  search?: string
  status?: string
  page?: number
  limit?: number
}) {
  try {
    await requireAdmin()
    const supabase = createAdminClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('vendor_applications')
      .select(`
        *,
        user:profiles!vendor_applications_user_id_fkey(
          id,
          email,
          full_name
        ),
        reviewer:profiles!vendor_applications_reviewed_by_fkey(
          id,
          email,
          full_name
        )
      `, { count: 'exact' })

    // Add search filter
    if (search) {
      query = query.or(`business_name.ilike.%${search}%,business_email.ilike.%${search}%`)
    }

    // Add status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Add pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching vendor applications:', error)
      throw error
    }

    return {
      data: data || [],
      count: count || 0,
      error: null
    }
  } catch (error) {
    console.error('Error in getVendorApplications:', error)
    return {
      data: [],
      count: 0,
      error: 'Failed to fetch vendor applications'
    }
  }
}

export async function deleteVendorApplication(id: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('vendor_applications')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Vendor Applications] Error deleting application:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/vendor-applications')
}