require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSearchFunctionality() {
  console.log('Testing search functionality...')
  
  // Test 1: Check if locations exist
  console.log('\n1. Testing locations query...')
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .limit(5)
    
  if (locError) {
    console.error('❌ Error fetching locations:', locError)
    return
  }
  
  console.log(`✅ Found ${locations.length} locations`)
  locations.forEach(loc => {
    console.log(`  - ${loc.name} (${loc.city}, ${loc.country_code})`)
  })
  
  if (locations.length < 2) {
    console.log('❌ Need at least 2 locations to test search')
    return
  }
  
  // Test 2: Check if routes exist
  console.log('\n2. Testing routes query...')
  const { data: routes, error: routeError } = await supabase
    .from('routes')
    .select('*')
    .eq('is_active', true)
    .limit(5)
    
  if (routeError) {
    console.error('❌ Error fetching routes:', routeError)
    return
  }
  
  console.log(`✅ Found ${routes.length} routes`)
  
  // Test 3: Test route search functionality
  console.log('\n3. Testing route search...')
  const testOrigin = locations[0]
  const testDestination = locations[1]
  
  const { data: searchRoute, error: searchError } = await supabase
    .from('routes')
    .select('*')
    .eq('origin_location_id', testOrigin.id)
    .eq('destination_location_id', testDestination.id)
    .eq('is_active', true)
    .single()
    
  if (searchError) {
    console.log('❌ No direct route found between test locations')
    console.log('   This is normal if routes haven\'t been created yet')
  } else {
    console.log(`✅ Found route: ${searchRoute.route_name}`)
  }
  
  // Test 4: Test route_searches table insertion
  console.log('\n4. Testing route_searches table...')
  const testInsert = {
    route_id: searchRoute?.id || null,
    origin_location_id: testOrigin.id,
    destination_location_id: testDestination.id,
    // Try with passenger_count first
    passenger_count: 2
  }
  
  let { error: insertError } = await supabase
    .from('route_searches')
    .insert(testInsert)
    
  if (insertError && insertError.message.includes('passenger_count')) {
    console.log('⚠️  passenger_count column missing, trying without it...')
    const { passenger_count, ...insertWithoutPassenger } = testInsert
    
    const { error: fallbackError } = await supabase
      .from('route_searches')
      .insert(insertWithoutPassenger)
      
    if (fallbackError) {
      console.error('❌ Error inserting into route_searches (fallback):', fallbackError)
    } else {
      console.log('✅ Successfully inserted search record without passenger_count')
    }
  } else if (insertError) {
    console.error('❌ Error inserting into route_searches:', insertError)
  } else {
    console.log('✅ Successfully inserted search record with passenger_count')
  }
  
  // Test 5: Test vendor route services
  console.log('\n5. Testing vendor route services...')
  const { data: vendorRoutes, error: vendorError } = await supabase
    .from('vendor_route_services')
    .select('*')
    .eq('is_active', true)
    .limit(5)
    
  if (vendorError) {
    console.error('❌ Error fetching vendor routes:', vendorError)
  } else {
    console.log(`✅ Found ${vendorRoutes.length} vendor route services`)
  }
  
  console.log('\n🎉 Search functionality test completed!')
}

testSearchFunctionality().catch(console.error)