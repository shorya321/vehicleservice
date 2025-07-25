"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { 
  User, 
  UserFilters, 
  PaginatedUsers, 
  CreateUserData,
  UserFormData,
  UserUpdate
} from "@/lib/types/user"
import { revalidatePath } from "next/cache"

export async function getUsers(filters: UserFilters = {}): Promise<PaginatedUsers> {
  const supabase = await createClient()
  
  const { 
    search = '', 
    role = 'all', 
    status = 'all', 
    page = 1, 
    limit = 10,
    emailVerified,
    twoFactorEnabled,
    hasSignedIn
  } = filters as any

  // Build query
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })

  // Apply search filter
  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  // Apply role filter
  if (role !== 'all') {
    query = query.eq('role', role)
  }

  // Apply status filter  
  if (status !== 'all') {
    query = query.eq('status', status)
  }

  // Apply advanced filters
  if (emailVerified !== undefined) {
    query = query.eq('email_verified', emailVerified)
  }

  if (twoFactorEnabled !== undefined) {
    query = query.eq('two_factor_enabled', twoFactorEnabled)
  }

  if (hasSignedIn !== undefined) {
    if (hasSignedIn) {
      query = query.not('last_sign_in_at', 'is', null)
    } else {
      query = query.is('last_sign_in_at', null)
    }
  }

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  query = query
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data: users, error, count } = await query

  if (error) {
    console.error('Error fetching users:', error)
    throw new Error('Failed to fetch users')
  }

  return {
    users: users || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export async function getUser(id: string): Promise<User | null> {
  const supabase = await createClient()
  
  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return user
}

export async function createUser(data: CreateUserData) {
  const adminClient = createAdminClient()
  
  try {
    let password: string | undefined
    let temporaryPassword: string | undefined
    
    // Handle password based on selected option
    if (data.password_option === 'generate') {
      // Import at runtime to avoid issues with server/client code
      const { generateSecurePassword } = await import('@/lib/utils/password')
      temporaryPassword = generateSecurePassword(12)
      password = temporaryPassword
    } else if (data.password_option === 'custom') {
      password = data.password
      if (!password) {
        return { error: 'Password is required when using custom password option' }
      }
    } else if (data.password_option === 'reset_link') {
      // Generate a temporary password even for reset link option
      // This ensures the user account is created with a password
      const { generateSecurePassword } = await import('@/lib/utils/password')
      password = generateSecurePassword(16)
    }

    // Create auth user with metadata
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: password,
      email_confirm: data.password_option === 'reset_link' ? false : true, // Auto-confirm if not using reset link
      user_metadata: {
        full_name: data.full_name
      }
    })

    if (authError) {
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Failed to create user' }
    }

    // Create/update profile using admin client to bypass RLS
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role,
        status: data.status,
        email_verified: data.password_option === 'reset_link' ? false : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Try to delete the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: 'Failed to create user profile' }
    }

    // Create vendor application if user is a vendor
    if (data.role === 'vendor' && data.business_profile) {
      // Create vendor application with approved status
      const { data: vendorApp, error: appError } = await adminClient
        .from('vendor_applications')
        .insert({
          user_id: authData.user.id,
          business_name: data.business_profile.business_name,
          business_email: data.business_profile.business_email || data.email,
          business_phone: data.business_profile.business_phone || data.phone,
          business_address: data.business_profile.business_address || null,
          business_city: data.business_profile.business_city || null,
          business_country_code: data.business_profile.business_country_code || 'AE',
          business_description: data.business_profile.business_description || null,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          admin_notes: 'Created directly by admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (appError) {
        console.error('Vendor application creation error:', appError)
        // Don't fail the user creation, but log the error
      }
    }

    // Send password reset email if requested
    if (data.password_option === 'reset_link') {
      const supabase = await createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/reset-password`,
      })
      
      if (resetError) {
        console.error('Failed to send password reset email:', resetError)
        // Don't fail the user creation, just log the error
      }
    }

    revalidatePath('/admin/users')
    
    return { 
      success: true, 
      userId: authData.user.id,
      temporaryPassword: temporaryPassword,
      passwordOption: data.password_option
    }
  } catch (error) {
    console.error('Create user error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function updateUser(id: string, data: UserFormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  try {
    // Get current user data
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', id)
      .single()

    if (!currentUser) {
      return { error: 'User not found' }
    }

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        phone: data.phone,
        role: data.role,
        status: data.status,
        updated_at: new Date().toISOString()
      } as UserUpdate)
      .eq('id', id)

    if (error) {
      return { error: 'Failed to update user' }
    }

    // Handle vendor application and business profile updates
    if (data.role === 'vendor' && data.business_profile) {
      // Check if vendor application exists
      const { data: existingApp } = await supabase
        .from('vendor_applications')
        .select('id')
        .eq('user_id', id)
        .single()

      if (existingApp) {
        // Update existing vendor application
        const { error: appUpdateError } = await supabase
          .from('vendor_applications')
          .update({
            business_name: data.business_profile.business_name,
            business_email: data.business_profile.business_email || data.email,
            business_phone: data.business_profile.business_phone || data.phone,
            business_address: data.business_profile.business_address || null,
            business_city: data.business_profile.business_city || null,
            business_country_code: data.business_profile.business_country_code || 'AE',
            business_description: data.business_profile.business_description || null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', id)

        if (appUpdateError) {
          console.error('Vendor application update error:', appUpdateError)
          return { error: 'Failed to update vendor application' }
        }
      } else {
        // Create new vendor application for existing user becoming vendor
        const { error: appCreateError } = await supabase
          .from('vendor_applications')
          .insert({
            user_id: id,
            business_name: data.business_profile.business_name,
            business_email: data.business_profile.business_email || data.email,
            business_phone: data.business_profile.business_phone || data.phone,
            business_address: data.business_profile.business_address || null,
            business_city: data.business_profile.business_city || null,
            business_country_code: data.business_profile.business_country_code || 'AE',
            business_description: data.business_profile.business_description || null,
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            admin_notes: 'Converted to vendor by admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (appCreateError) {
          console.error('Vendor application creation error:', appCreateError)
          return { error: 'Failed to create vendor application' }
        }
      }

    } else if (currentUser.role === 'vendor' && data.role !== 'vendor') {
      // User was a vendor but is changing to another role
      // Note: We don't delete vendor_applications as it serves as historical record
    }

    // Update email if changed
    if (currentUser.email !== data.email) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(
        id,
        { email: data.email }
      )

      if (authError) {
        return { error: 'Failed to update email' }
      }

      // Update email in profile
      await supabase
        .from('profiles')
        .update({ email: data.email })
        .eq('id', id)
    }

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${id}`)
    
    return { success: true }
  } catch (error) {
    console.error('Update user error:', error)
    return { error: 'An unexpected error occurred' }
  }
}