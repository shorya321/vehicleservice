const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function checkLocationsData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  console.log('🔍 Checking locations table...\n')

  try {
    // Check total count
    const { count, error: countError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error counting locations:', countError.message)
      return
    }

    console.log(`📊 Total locations in database: ${count}`)

    // Check active locations
    const { count: activeCount, error: activeError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (activeError) {
      console.error('❌ Error counting active locations:', activeError.message)
      return
    }

    console.log(`✅ Active locations: ${activeCount}`)

    // Check for Delhi
    const { data: delhiData, error: delhiError } = await supabase
      .from('locations')
      .select('*')
      .or('name.ilike.%Delhi%,city.ilike.%Delhi%')
      .eq('is_active', true)

    if (delhiError) {
      console.error('❌ Error searching for Delhi:', delhiError.message)
    } else {
      console.log(`\n🏙️  Delhi-related locations found: ${delhiData.length}`)
      if (delhiData.length > 0) {
        delhiData.forEach(loc => {
          console.log(`   - ${loc.name} (${loc.type}) in ${loc.city}, ${loc.country_code}`)
        })
      }
    }

    // Check for Mumbai
    const { data: mumbaiData, error: mumbaiError } = await supabase
      .from('locations')
      .select('*')
      .or('name.ilike.%Mumbai%,city.ilike.%Mumbai%')
      .eq('is_active', true)

    if (mumbaiError) {
      console.error('❌ Error searching for Mumbai:', mumbaiError.message)
    } else {
      console.log(`\n🏙️  Mumbai-related locations found: ${mumbaiData.length}`)
      if (mumbaiData.length > 0) {
        mumbaiData.forEach(loc => {
          console.log(`   - ${loc.name} (${loc.type}) in ${loc.city}, ${loc.country_code}`)
        })
      }
    }

    // Sample query that autocomplete would run
    console.log('\n🔍 Testing autocomplete query for "Del"...')
    const { data: autoData, error: autoError } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .or('name.ilike.%Del%,city.ilike.%Del%')
      .order('type', { ascending: false })
      .order('name')
      .limit(10)

    if (autoError) {
      console.error('❌ Autocomplete query error:', autoError.message)
    } else {
      console.log(`📍 Results that would appear: ${autoData.length}`)
      autoData.forEach(loc => {
        console.log(`   - ${loc.name} (${loc.type})`)
      })
    }

    // If no locations found, provide seed data
    if (count === 0) {
      console.log('\n⚠️  No locations found in database!')
      console.log('📝 To add test data, run the following SQL in Supabase:')
      console.log(`
INSERT INTO locations (name, type, city, country_code, is_active) VALUES
('Indira Gandhi International Airport', 'airport', 'New Delhi', 'IN', true),
('Delhi Railway Station', 'station', 'New Delhi', 'IN', true),
('Chhatrapati Shivaji International Airport', 'airport', 'Mumbai', 'IN', true),
('Mumbai Central Railway Station', 'station', 'Mumbai', 'IN', true),
('Delhi', 'city', 'New Delhi', 'IN', true),
('Mumbai', 'city', 'Mumbai', 'IN', true),
('Connaught Place', 'city', 'New Delhi', 'IN', true),
('Bandra', 'city', 'Mumbai', 'IN', true);
      `)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkLocationsData()