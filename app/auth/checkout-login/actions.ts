'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { optionalPhoneSchema } from '@/lib/validation/phone'
import { z } from 'zod'

const registerDataSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: optionalPhoneSchema,
})

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
}

export async function registerAndAutoVerify(input: RegisterData) {
  try {
    const parsed = registerDataSchema.safeParse(input)

    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message || 'Invalid registration details' }
    }

    const data = parsed.data

    // Use admin client to create user with auto-verification
    const adminClient = createAdminClient()
    
    // Create the user with admin privileges (auto-confirms email)
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // This auto-verifies the email
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        full_name: `${data.firstName} ${data.lastName}`
      }
    })

    if (createError) {
      return { error: createError.message }
    }

    if (!userData.user) {
      return { error: 'Failed to create user' }
    }

    // Create/update profile - use insert first, then update if it fails
    const { error: insertError } = await adminClient
      .from('profiles')
      .insert({
        id: userData.user.id,
        email: data.email,
        full_name: `${data.firstName} ${data.lastName}`,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        role: 'customer'
      })
    
    // If insert fails (profile already exists), update it
    if (insertError) {
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({
          full_name: `${data.firstName} ${data.lastName}`,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone
        })
        .eq('id', userData.user.id)
      
      if (updateError) {
        console.error('Profile update error:', updateError)
      }
    }

    // Sign in the user after creation
    const supabase = await createClient()
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    })

    if (signInError) {
      return { error: 'Account created but failed to sign in. Please login manually.' }
    }

    return { 
      success: true, 
      user: userData.user,
      session: signInData.session 
    }
  } catch (error) {
    console.error('Registration error:', error)
    return { error: 'An unexpected error occurred during registration' }
  }
}