const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fnrlzhrchuoiwwsugidz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucmx6aHJjaHVvaXd3c3VnaWR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc1NjEyMSwiZXhwIjoyMDY2MzMyMTIxfQ.htLE-ibgZ7PVOp6VeBQ1VizdsSCTwB9ay4OTOZSsgLo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRoutesConstraints() {
  console.log('Checking routes table constraints...')
  
  // Get existing routes
  const { data: routes, error: routesError } = await supabase
    .from('routes')
    .select('*')
  
  if (routesError) {
    console.error('Error fetching routes:', routesError)
  } else {
    console.log(`Found ${routes?.length || 0} existing routes`)
    if (routes && routes.length > 0) {
      console.log('Existing routes:')
      routes.forEach(route => {
        console.log(`- ${route.route_name} (${route.origin_location_id} -> ${route.destination_location_id})`)
        console.log(`  Slug: ${route.route_slug}`)
      })
    }
  }
  
  // Test creating a route with duplicate slug
  console.log('\nTesting route creation...')
  const testRoute = {
    origin_location_id: '480b52ee-4fa3-4974-8cbe-57e7daec4946',
    destination_location_id: 'cf41e164-d2b0-41cc-aafb-b1a3c804976e',
    route_name: 'Test Route ' + Date.now(),
    route_slug: 'test-route-' + Date.now(),
    distance_km: 10,
    estimated_duration_minutes: 20,
    base_price: 50,
    is_active: true,
    is_popular: false
  }
  
  const { data: newRoute, error: createError } = await supabase
    .from('routes')
    .insert(testRoute)
    .select()
    .single()
  
  if (createError) {
    console.error('Error creating test route:', createError)
    console.log('Error details:', {
      code: createError.code,
      message: createError.message,
      details: createError.details,
      hint: createError.hint
    })
  } else {
    console.log('✅ Test route created successfully:', newRoute.id)
    
    // Clean up test route
    const { error: deleteError } = await supabase
      .from('routes')
      .delete()
      .eq('id', newRoute.id)
    
    if (deleteError) {
      console.error('Error deleting test route:', deleteError)
    } else {
      console.log('✅ Test route cleaned up')
    }
  }
}

checkRoutesConstraints()