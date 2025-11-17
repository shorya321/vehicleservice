import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetVendorPassword() {
  const vendorEmail = 'shammy@fanaticcoders.com'
  const newPassword = 'Vendor@123'

  console.log(`🔐 Resetting password for ${vendorEmail}...`)

  const { data, error } = await supabase.auth.admin.updateUserById(
    '8c004f66-1c34-47d6-a663-16a6b09eee49',
    { password: newPassword }
  )

  if (error) {
    console.error('❌ Error resetting password:', error)
    process.exit(1)
  }

  console.log('✅ Password reset successfully!')
  console.log(`📧 Email: ${vendorEmail}`)
  console.log(`🔑 New Password: ${newPassword}`)
}

resetVendorPassword()
