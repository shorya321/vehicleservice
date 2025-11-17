/**
 * Script to create an admin user for testing
 * Run with: npx tsx scripts/setup-admin.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createAdminUser() {
  try {
    // Create user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@vehicleservice.com',
      password: 'admin123456',
      email_confirm: true,
    })

    if (authError) {
      console.error('Error creating user:', authError)
      return
    }

    console.log('User created:', authData.user?.email)

    // Update profile to admin role
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          full_name: 'System Administrator' 
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        return
      }

      console.log('Profile updated with admin role')
    }

    console.log('\nAdmin user created successfully!')
    console.log('Email: admin@vehicleservice.com')
    console.log('Password: admin123456')
    console.log('\nPlease change the password after first login.')
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createAdminUser()