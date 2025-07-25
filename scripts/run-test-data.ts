import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

async function runTestData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Read and execute the locations SQL
    const locationsSQL = fs.readFileSync(
      path.join(__dirname, 'add-test-locations.sql'),
      'utf8'
    )

    console.log('Adding test locations...')
    const { error: locationsError } = await supabase.rpc('exec_sql', {
      sql: locationsSQL
    }).single()

    if (locationsError) {
      // If RPC doesn't exist, try a different approach
      console.log('RPC failed, trying direct insert...')
      
      // Parse and execute individual INSERT statements
      const locations = [
        { name: 'Indira Gandhi International Airport (DEL)', type: 'airport', city: 'New Delhi', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Delhi Railway Station', type: 'station', city: 'New Delhi', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Connaught Place', type: 'city', city: 'New Delhi', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Gurgaon', type: 'city', city: 'Gurgaon', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Chhatrapati Shivaji International Airport (BOM)', type: 'airport', city: 'Mumbai', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Mumbai Central Railway Station', type: 'station', city: 'Mumbai', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Bandra', type: 'city', city: 'Mumbai', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Andheri', type: 'city', city: 'Mumbai', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Kempegowda International Airport (BLR)', type: 'airport', city: 'Bangalore', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Bangalore City Railway Station', type: 'station', city: 'Bangalore', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Electronic City', type: 'city', city: 'Bangalore', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Chennai International Airport (MAA)', type: 'airport', city: 'Chennai', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Chennai Central Railway Station', type: 'station', city: 'Chennai', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Netaji Subhas Chandra Bose International Airport (CCU)', type: 'airport', city: 'Kolkata', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Howrah Railway Station', type: 'station', city: 'Kolkata', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Rajiv Gandhi International Airport (HYD)', type: 'airport', city: 'Hyderabad', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Secunderabad Railway Station', type: 'station', city: 'Hyderabad', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Pune Airport (PNQ)', type: 'airport', city: 'Pune', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Pune Railway Station', type: 'station', city: 'Pune', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Jaipur International Airport (JAI)', type: 'airport', city: 'Jaipur', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Jaipur Railway Station', type: 'station', city: 'Jaipur', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Goa International Airport (GOI)', type: 'airport', city: 'Goa', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Madgaon Railway Station', type: 'station', city: 'Goa', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Sardar Vallabhbhai Patel International Airport (AMD)', type: 'airport', city: 'Ahmedabad', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true },
        { name: 'Ahmedabad Railway Station', type: 'station', city: 'Ahmedabad', country_code: 'IN', is_active: true, allow_pickup: true, allow_dropoff: true }
      ]

      const { data, error } = await supabase
        .from('locations')
        .insert(locations)
        .select()

      if (error) {
        console.error('Error adding locations:', error)
      } else {
        console.log(`Added ${data.length} locations successfully`)
      }
    } else {
      console.log('Locations added successfully via RPC')
    }

    // Add routes after locations
    console.log('\nAdding test routes...')
    
    // First get admin user
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.')
      return
    }

    // Get location IDs
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name, city')
      .eq('is_active', true)

    if (!locations) {
      console.error('No locations found')
      return
    }

    // Create a map for easy lookup
    const locationMap = new Map(locations.map(loc => [loc.name, loc]))

    // Define routes (need to match the exact names with codes)
    const routeData = [
      ['Indira Gandhi International Airport (DEL)', 'Chhatrapati Shivaji International Airport (BOM)', 1400, 1200, 15000, true],
      ['Delhi Railway Station', 'Mumbai Central Railway Station', 1380, 1260, 12000, true],
      ['Connaught Place', 'Bandra', 1420, 1320, 13000, true],
      ['Indira Gandhi International Airport (DEL)', 'Kempegowda International Airport (BLR)', 2150, 1800, 22000, true],
      ['Delhi Railway Station', 'Bangalore City Railway Station', 2120, 1860, 18000, false],
      ['Chhatrapati Shivaji International Airport (BOM)', 'Kempegowda International Airport (BLR)', 980, 840, 10000, true],
      ['Mumbai Central Railway Station', 'Electronic City', 990, 900, 9500, false],
      ['Indira Gandhi International Airport (DEL)', 'Jaipur International Airport (JAI)', 270, 300, 3500, true],
      ['Delhi Railway Station', 'Jaipur Railway Station', 280, 330, 3000, true],
      ['Chhatrapati Shivaji International Airport (BOM)', 'Pune Airport (PNQ)', 150, 180, 2500, true],
      ['Mumbai Central Railway Station', 'Pune Railway Station', 155, 210, 2000, true],
      ['Bandra', 'Pune Railway Station', 145, 190, 2200, false],
      ['Indira Gandhi International Airport (DEL)', 'Gurgaon', 25, 35, 800, true],
      ['Delhi Railway Station', 'Gurgaon', 30, 45, 700, false],
      ['Kempegowda International Airport (BLR)', 'Chennai International Airport (MAA)', 350, 360, 4500, true],
      ['Bangalore City Railway Station', 'Chennai Central Railway Station', 345, 390, 3800, false],
      ['Chhatrapati Shivaji International Airport (BOM)', 'Goa International Airport (GOI)', 450, 480, 5500, true],
      ['Mumbai Central Railway Station', 'Madgaon Railway Station', 460, 540, 4800, false]
    ]

    const routes = routeData
      .map(([originName, destName, distance, duration, price, popular]) => {
        const origin = locationMap.get(originName as string)
        const dest = locationMap.get(destName as string)
        
        if (!origin || !dest) {
          console.warn(`Skipping route: ${originName} to ${destName} (location not found)`)
          return null
        }

        return {
          origin_location_id: origin.id,
          destination_location_id: dest.id,
          route_name: `${origin.city} to ${dest.city}`,
          route_slug: `${origin.city}-to-${dest.city}`.toLowerCase().replace(/ /g, '-'),
          distance_km: distance as number,
          estimated_duration_minutes: duration as number,
          base_price: price as number,
          is_active: true,
          is_popular: popular as boolean,
          created_by: adminUser.id,
          created_by_type: 'admin'
        }
      })
      .filter(route => route !== null)

    const { data: routesData, error: routesError } = await supabase
      .from('routes')
      .upsert(routes, { 
        onConflict: 'origin_location_id,destination_location_id',
        ignoreDuplicates: true 
      })
      .select()

    if (routesError) {
      console.error('Error adding routes:', routesError)
    } else {
      console.log(`Added ${routesData?.length || 0} routes successfully`)
    }

    console.log('\nTest data added successfully!')
    console.log('You can now search for cities like Delhi, Mumbai, Bangalore, etc.')

  } catch (error) {
    console.error('Error running test data:', error)
  }
}

runTestData().catch(console.error)