import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetAdminPassword() {
  const adminEmail = 'admin@fanaticcoders.com'
  const newPassword = 'password123'

  console.log(`🔐 Resetting password for ${adminEmail}...`)

  // Get admin user ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', adminEmail)
    .eq('role', 'admin')
    .single()

  if (!profile) {
    console.error('❌ Admin user not found')
    process.exit(1)
  }

  const { data, error } = await supabase.auth.admin.updateUserById(
    profile.id,
    { password: newPassword }
  )

  if (error) {
    console.error('❌ Error resetting password:', error)
    process.exit(1)
  }

  console.log('✅ Password reset successfully!')
  console.log(`📧 Email: ${adminEmail}`)
  console.log(`🔑 New Password: ${newPassword}`)
}

resetAdminPassword()
