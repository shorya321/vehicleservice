import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

async function createAdminUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Create admin user via auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@vehicleservice.com',
      password: 'admin123456',
      email_confirm: true
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return
    }

    console.log('Auth user created:', authData.user?.id)

    // Create user record in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user!.id,
        email: 'admin@vehicleservice.com',
        name: 'Admin User',
        role: 'admin',
        is_active: true,
        is_verified: true
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user record:', userError)
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(authData.user!.id)
      return
    }

    console.log('Admin user created successfully!')
    console.log('Email: admin@vehicleservice.com')
    console.log('Password: admin123456')
    console.log('User ID:', userData.id)

  } catch (error) {
    console.error('Error:', error)
  }
}

createAdminUser().catch(console.error)