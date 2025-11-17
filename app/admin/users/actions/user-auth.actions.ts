"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logUserActivity } from "./user-activity.actions"
import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"

export async function sendPasswordResetEmail(email: string) {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
      return { error: 'Failed to send password reset email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Send password reset error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function toggleUser2FA(
  userId: string, 
  enable: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  try {
    // Check if user is admin
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser?.user) {
      return { error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Only admins can manage 2FA settings' }
    }

    // Update 2FA status
    const { error } = await supabase
      .from('profiles')
      .update({ 
        two_factor_enabled: enable,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      return { error: 'Failed to update 2FA status' }
    }

    // Log activity
    await logUserActivity(
      userId, 
      enable ? 'two_factor_enabled' : 'two_factor_disabled', 
      { changed_by: currentUser.user.id }
    )

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    
    return {}
  } catch (error) {
    console.error('Toggle 2FA error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function bulkDisable2FA(
  userIds: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  try {
    // Check if user is admin
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser?.user) {
      return { error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Only admins can manage 2FA settings' }
    }

    // Update multiple users
    const { error } = await supabase
      .from('profiles')
      .update({ 
        two_factor_enabled: false,
        updated_at: new Date().toISOString()
      })
      .in('id', userIds)

    if (error) throw error

    // Log activity for each user
    for (const userId of userIds) {
      await logUserActivity(
        userId, 
        'two_factor_disabled_bulk', 
        { changed_by: currentUser.user.id }
      )
    }

    revalidatePath('/admin/users')
    return {}
  } catch (error) {
    console.error('Bulk disable 2FA error:', error)
    return { error: 'Failed to disable 2FA for users' }
  }
}

export async function bulkSendPasswordReset(
  userIds: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  try {
    // Check if user is admin
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser?.user) {
      return { error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Only admins can send password resets' }
    }

    // Get user emails
    const { data: users, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds)

    if (fetchError || !users) {
      return { error: 'Failed to fetch user emails' }
    }

    // Send password reset for each user
    const errors: string[] = []
    for (const user of users) {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      })
      
      if (error) {
        errors.push(`Failed for ${user.email}: ${error.message}`)
      } else {
        await logUserActivity(
          user.id, 
          'password_reset_sent_bulk', 
          { sent_by: currentUser.user.id }
        )
      }
    }

    if (errors.length > 0) {
      return { error: errors.join(', ') }
    }

    return {}
  } catch (error) {
    console.error('Bulk send password reset error:', error)
    return { error: 'Failed to send password resets' }
  }
}

export async function sendVerificationEmail(
  userId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()
  
  try {
    // Check if user is admin
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser?.user) {
      return { error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Only admins can send verification emails' }
    }

    // Get user details
    const { data: user, error: userError } = await adminSupabase
      .from('profiles')
      .select('email, full_name, email_verified')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { error: 'User not found' }
    }

    if (user.email_verified) {
      return { error: 'User is already verified' }
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiry

    // Store token in database
    const { error: tokenError } = await adminSupabase
      .from('email_verification_tokens')
      .upsert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString()
      })

    if (tokenError) {
      console.error('Token creation error:', tokenError)
      return { error: 'Failed to create verification token' }
    }

    // TODO: Send actual email via email service
    // For now, just log the verification link
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`
    console.log('Verification email would be sent to:', user.email)
    console.log('Verification URL:', verificationUrl)

    // Log activity
    await logUserActivity(
      userId,
      'verification_email_sent',
      { 
        sent_to: user.email,
        sent_by: currentUser.user.id
      }
    )

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    return {}
  } catch (error) {
    console.error('Send verification email error:', error)
    return { error: 'Failed to send verification email' }
  }
}

export async function bulkSendVerificationEmails(
  userIds: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  try {
    // Check if user is admin
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser?.user) {
      return { error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Only admins can send verification emails' }
    }

    // Send verification email for each user
    const errors: string[] = []
    let successCount = 0
    
    for (const userId of userIds) {
      const result = await sendVerificationEmail(userId)
      if (result.error) {
        errors.push(`Failed for user ${userId}: ${result.error}`)
      } else {
        successCount++
      }
    }

    if (errors.length > 0 && successCount === 0) {
      return { error: errors.join(', ') }
    }

    revalidatePath('/admin/users')
    return {}
  } catch (error) {
    console.error('Bulk send verification emails error:', error)
    return { error: 'Failed to send verification emails' }
  }
}