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
  const adminId = '323d626d-3e92-47af-b1ce-0beb661bfb2d'
  const adminEmail = 'admin@vehicleservice.com'
  const newPassword = 'password123'

  console.log(`🔐 Resetting password for ${adminEmail}...`)

  const { data, error } = await supabase.auth.admin.updateUserById(
    adminId,
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
