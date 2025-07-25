const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fnrlzhrchuoiwwsugidz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucmx6aHJjaHVvaXd3c3VnaWR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc1NjEyMSwiZXhwIjoyMDY2MzMyMTIxfQ.htLE-ibgZ7PVOp6VeBQ1VizdsSCTwB9ay4OTOZSsgLo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRoutesQuery() {
  console.log('Testing routes query...')
  
  // Test basic routes query
  const { data: routes, error: routesError } = await supabase
    .from('routes')
    .select('*')
    .limit(5)
  
  if (routesError) {
    console.error('Error querying routes:', routesError)
  } else {
    console.log(`✅ Routes query successful (${routes?.length || 0} routes found)`)
    if (routes?.length > 0) {
      console.log('Sample route:', routes[0])
    }
  }
  
  // Test vendor routes query with joins
  const { data: vendorRoutes, error: vendorError } = await supabase
    .from('routes')
    .select(`
      *,
      origin_location:locations!origin_location_id(*),
      destination_location:locations!destination_location_id(*)
    `)
    .eq('created_by_type', 'vendor')
    .limit(5)
  
  if (vendorError) {
    console.error('Error querying vendor routes with joins:', vendorError)
  } else {
    console.log(`✅ Vendor routes with joins query successful (${vendorRoutes?.length || 0} vendor routes found)`)
  }
  
  // Test vendor_route_services query
  const { data: services, error: servicesError } = await supabase
    .from('vendor_route_services')
    .select('*')
    .limit(5)
  
  if (servicesError) {
    console.error('Error querying vendor_route_services:', servicesError)
  } else {
    console.log(`✅ Vendor route services query successful (${services?.length || 0} services found)`)
  }
  
  // Test vendor applications
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendor_applications')
    .select('id, user_id, status')
    .eq('status', 'approved')
    .limit(3)
  
  if (vendorsError) {
    console.error('Error querying vendor applications:', vendorsError)
  } else {
    console.log(`✅ Vendor applications query successful (${vendors?.length || 0} approved vendors found)`)
  }
}

testRoutesQuery()