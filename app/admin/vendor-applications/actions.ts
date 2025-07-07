'use server'

import { createClient } from '@/lib/supabase/server'

export async function getVendorApplicationsStats() {
  const supabase = await createClient()
  
  // Get total count
  const { count: total, error: totalError } = await supabase
    .from('vendor_applications')
    .select('*', { count: 'exact', head: true })
    
  if (totalError) {
    console.error('Error fetching total vendor applications:', totalError)
    return { total: 0, pending: 0, approved: 0, rejected: 0 }
  }

  // Get pending count
  const { count: pending, error: pendingError } = await supabase
    .from('vendor_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    
  if (pendingError) {
    console.error('Error fetching pending vendor applications:', pendingError)
  }

  // Get approved count
  const { count: approved, error: approvedError } = await supabase
    .from('vendor_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')
    
  if (approvedError) {
    console.error('Error fetching approved vendor applications:', approvedError)
  }

  // Get rejected count
  const { count: rejected, error: rejectedError } = await supabase
    .from('vendor_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'rejected')
    
  if (rejectedError) {
    console.error('Error fetching rejected vendor applications:', rejectedError)
  }

  return {
    total: total || 0,
    pending: pending || 0,
    approved: approved || 0,
    rejected: rejected || 0
  }
}