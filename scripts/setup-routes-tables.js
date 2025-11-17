const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupRoutesTables() {
  console.log('Setting up routes tables...')
  
  // Check if routes table exists by trying to query it
  const { data: routes, error: routesError } = await supabase
    .from('routes')
    .select('id')
    .limit(1)
  
  if (routesError) {
    if (routesError.code === '42P01' || routesError.message?.includes('relation "routes" does not exist')) {
      console.log('❌ Routes table does not exist')
      console.log('Please run the database migrations manually in Supabase Dashboard:')
      console.log('1. Go to your Supabase Dashboard: https://fnrlzhrchuoiwwsugidz.supabase.co')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Run the migrations from these files in order:')
      console.log('   - supabase/migrations/20250115_create_routes_tables.sql')
      console.log('   - supabase/migrations/20250115_add_vendor_route_creation.sql')
      console.log('   - supabase/migrations/20250115_fix_routes_rls_policy.sql')
    } else {
      console.error('Error checking routes table:', routesError)
      return
    }
  } else {
    console.log('✅ Routes table already exists')
  }
  
  // Test basic functionality
  try {
    console.log('Testing vendor_applications table...')
    const { data: vendorApps, error: vendorError } = await supabase
      .from('vendor_applications')
      .select('id, user_id, status')
      .limit(1)
    
    if (vendorError) {
      console.error('Error testing vendor_applications:', vendorError)
    } else {
      console.log('✅ Vendor applications table is accessible')
    }
    
    console.log('Testing locations table...')
    const { data: locations, error: locationError } = await supabase
      .from('locations')
      .select('id, name, is_active')
      .eq('is_active', true)
      .limit(3)
    
    if (locationError) {
      console.error('Error testing locations:', locationError)
    } else {
      console.log(`✅ Locations table is accessible (${locations?.length || 0} active locations found)`)
    }
    
  } catch (error) {
    console.error('Error during testing:', error)
  }
}

setupRoutesTables()