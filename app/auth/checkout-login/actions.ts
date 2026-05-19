'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface RegisterData {
  email: string
  password: string
  fullName: string
  phone: string
}

export async function registerAndAutoVerify(data: RegisterData) {
  try {
    const adminClient = createAdminClient()
    const nameParts = data.fullName.trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: data.phone,
        full_name: data.fullName
      }
    })

    if (createError) {
      return { error: createError.message }
    }

    if (!userData.user) {
      return { error: 'Failed to create user' }
    }

    const { error: insertError } = await adminClient
      .from('profiles')
      .insert({
        id: userData.user.id,
        email: data.email,
        full_name: data.fullName,
        first_name: firstName,
        last_name: lastName,
        phone: data.phone,
        role: 'customer'
      })

    if (insertError) {
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({
          full_name: data.fullName,
          first_name: firstName,
          last_name: lastName,
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