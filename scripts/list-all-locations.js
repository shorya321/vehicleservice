const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function listAllLocations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  console.log('📍 Listing all locations in the database:\n')

  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('type', { ascending: false })
      .order('name')

    if (error) {
      console.error('❌ Error fetching locations:', error.message)
      return
    }

    if (data.length === 0) {
      console.log('No locations found in the database.')
      return
    }

    console.log(`Found ${data.length} locations:\n`)
    
    data.forEach((location, index) => {
      console.log(`${index + 1}. ${location.name}`)
      console.log(`   Type: ${location.type}`)
      console.log(`   City: ${location.city || 'N/A'}`)
      console.log(`   Country: ${location.country_code}`)
      console.log(`   Active: ${location.is_active ? '✅' : '❌'}`)
      console.log(`   ID: ${location.id}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

listAllLocations()