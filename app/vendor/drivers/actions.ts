'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface VendorDriver {
  id: string
  vendor_id: string
  first_name: string
  last_name: string
  phone: string
  email?: string | null
  license_number: string
  license_expiry: string
  license_type?: string | null
  date_of_birth?: string | null
  address?: string | null
  city?: string | null
  country_code?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  joining_date?: string | null
  employment_status?: string | null
  documents?: any
  is_available: boolean
  is_active: boolean
  notes?: string | null
  created_at: string
  updated_at: string
}

// Get current vendor ID for the logged-in user
async function getCurrentVendorId() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data: vendor, error } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()
  
  if (error || !vendor) {
    throw new Error('Vendor not found or not approved')
  }
  
  return vendor.id
}

// Get all drivers for the current vendor
export async function getDrivers() {
  const supabase = await createClient()
  
  try {
    const vendorId = await getCurrentVendorId()
    
    const { data, error } = await supabase
      .from('vendor_drivers')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error fetching drivers:', error)
    return { data: null, error: error.message }
  }
}

// Get a single driver by ID
export async function getDriver(driverId: string) {
  const supabase = await createClient()
  
  try {
    const vendorId = await getCurrentVendorId()
    
    const { data, error } = await supabase
      .from('vendor_drivers')
      .select('*')
      .eq('id', driverId)
      .eq('vendor_id', vendorId)
      .single()
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error fetching driver:', error)
    return { data: null, error: error.message }
  }
}

// Create a new driver
export async function createDriver(formData: FormData) {
  const supabase = await createClient()
  
  try {
    const vendorId = await getCurrentVendorId()
    
    const driverData = {
      vendor_id: vendorId,
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string || null,
      license_number: formData.get('license_number') as string,
      license_expiry: formData.get('license_expiry') as string,
      license_type: formData.get('license_type') as string || 'regular',
      date_of_birth: formData.get('date_of_birth') as string || null,
      address: formData.get('address') as string || null,
      city: formData.get('city') as string || null,
      country_code: formData.get('country_code') as string || 'AE',
      emergency_contact_name: formData.get('emergency_contact_name') as string || null,
      emergency_contact_phone: formData.get('emergency_contact_phone') as string || null,
      joining_date: formData.get('joining_date') as string || new Date().toISOString().split('T')[0],
      employment_status: formData.get('employment_status') as string || 'active',
      notes: formData.get('notes') as string || null,
      is_available: formData.get('is_available') === 'true',
      is_active: true
    }
    
    const { data, error } = await supabase
      .from('vendor_drivers')
      .insert(driverData)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/vendor/drivers')
    return { data, error: null }
  } catch (error: any) {
    console.error('Error creating driver:', error)
    return { data: null, error: error.message }
  }
}

// Update an existing driver
export async function updateDriver(driverId: string, formData: FormData) {
  const supabase = await createClient()
  
  try {
    const vendorId = await getCurrentVendorId()
    
    const updateData = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string || null,
      license_number: formData.get('license_number') as string,
      license_expiry: formData.get('license_expiry') as string,
      license_type: formData.get('license_type') as string || 'regular',
      date_of_birth: formData.get('date_of_birth') as string || null,
      address: formData.get('address') as string || null,
      city: formData.get('city') as string || null,
      country_code: formData.get('country_code') as string || 'AE',
      emergency_contact_name: formData.get('emergency_contact_name') as string || null,
      emergency_contact_phone: formData.get('emergency_contact_phone') as string || null,
      employment_status: formData.get('employment_status') as string || 'active',
      notes: formData.get('notes') as string || null,
      is_available: formData.get('is_available') === 'true',
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('vendor_drivers')
      .update(updateData)
      .eq('id', driverId)
      .eq('vendor_id', vendorId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/vendor/drivers')
    revalidatePath(`/vendor/drivers/${driverId}`)
    return { data, error: null }
  } catch (error: any) {
    console.error('Error updating driver:', error)
    return { data: null, error: error.message }
  }
}

// Delete a driver (soft delete by setting is_active to false)
export async function deleteDriver(driverId: string) {
  const supabase = await createClient()
  
  try {
    const vendorId = await getCurrentVendorId()
    
    const { error } = await supabase
      .from('vendor_drivers')
      .update({ 
        is_active: false,
        employment_status: 'terminated',
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId)
      .eq('vendor_id', vendorId)
    
    if (error) throw error
    
    revalidatePath('/vendor/drivers')
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error deleting driver:', error)
    return { success: false, error: error.message }
  }
}

// Toggle driver availability
export async function toggleDriverAvailability(driverId: string, isAvailable: boolean) {
  const supabase = await createClient()
  
  try {
    const vendorId = await getCurrentVendorId()
    
    const { error } = await supabase
      .from('vendor_drivers')
      .update({ 
        is_available: isAvailable,
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId)
      .eq('vendor_id', vendorId)
    
    if (error) throw error
    
    revalidatePath('/vendor/drivers')
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error toggling driver availability:', error)
    return { success: false, error: error.message }
  }
}

// Update driver employment status
export async function updateDriverStatus(driverId: string, status: string) {
  const supabase = await createClient()
  
  try {
    const vendorId = await getCurrentVendorId()
    
    const { error } = await supabase
      .from('vendor_drivers')
      .update({ 
        employment_status: status,
        is_available: status === 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId)
      .eq('vendor_id', vendorId)
    
    if (error) throw error
    
    revalidatePath('/vendor/drivers')
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Error updating driver status:', error)
    return { success: false, error: error.message }
  }
}

// Get driver statistics
export async function getDriverStats() {
  const supabase = await createClient()
  
  try {
    const vendorId = await getCurrentVendorId()
    
    const { data, error } = await supabase
      .from('vendor_drivers')
      .select('employment_status, is_available')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
    
    if (error) throw error
    
    const stats = {
      total: data.length,
      active: data.filter(d => d.employment_status === 'active').length,
      available: data.filter(d => d.is_available).length,
      onLeave: data.filter(d => d.employment_status === 'on_leave').length,
      inactive: data.filter(d => d.employment_status === 'inactive').length
    }
    
    return { data: stats, error: null }
  } catch (error: any) {
    console.error('Error fetching driver stats:', error)
    return { data: null, error: error.message }
  }
}