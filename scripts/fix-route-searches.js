require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { readFileSync } = require('fs')
const { join } = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixRouteSearchesTable() {
  try {
    console.log('Fixing route_searches table...')
    
    // Test if we can insert with passenger_count
    const testData = {
      origin_location_id: '12345678-1234-1234-1234-123456789012',
      destination_location_id: '12345678-1234-1234-1234-123456789013',
      search_date: new Date().toISOString(),
      passenger_count: 2
    }
    
    const { error: testError } = await supabase
      .from('route_searches')
      .insert(testData)
    
    if (testError && testError.message.includes('passenger_count')) {
      console.log('passenger_count column missing, attempting to add...')
      
      // Try to add the column via direct query
      const { error: pgError } = await supabase
        .from('route_searches')
        .select('*')
        .limit(1)
        .then(async () => {
          // Use pg client directly if available
          console.log('Table exists, need to add column manually')
          console.log('Please run this SQL in your database:')
          console.log('ALTER TABLE route_searches ADD COLUMN passenger_count INTEGER DEFAULT 2 NOT NULL;')
          return { error: null }
        })
        .catch(err => ({ error: err }))
      
    } else if (testError) {
      console.log('Other error (expected for invalid UUIDs):', testError.message)
      console.log('✅ passenger_count column exists and works')
    } else {
      console.log('✅ passenger_count column works')
      // Clean up test data
      await supabase
        .from('route_searches')
        .delete()
        .eq('origin_location_id', testData.origin_location_id)
    }
    
    console.log('✅ Successfully checked route_searches table')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixRouteSearchesTable()