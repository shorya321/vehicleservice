import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

interface AliasMapping {
  alias: string
  namePattern: string
  googlePlaceId?: string
}

const ALIAS_MAPPINGS: AliasMapping[] = [
  // Airport codes
  { alias: 'DXB', namePattern: 'Dubai International Airport' },
  { alias: 'DWC', namePattern: 'Al Maktoum' },

  // Area abbreviations
  { alias: 'JBR', namePattern: 'Jumeirah Beach Residen' },
  { alias: 'JBR', namePattern: 'JBR' },
  { alias: 'JLT', namePattern: 'Jumeirah Lake Towers' },
  { alias: 'JVC', namePattern: 'Jumeirah Village Circle' },
  { alias: 'JVT', namePattern: 'Jumeirah Village Triangle' },
  { alias: 'DSO', namePattern: 'Dubai Silicon Oasis' },
  { alias: 'DIP', namePattern: 'Dubai Investment Park' },
  { alias: 'DIFC', namePattern: 'Dubai International Financial' },
  { alias: 'DHCC', namePattern: 'Dubai Healthcare City' },
  { alias: 'DIC', namePattern: 'Dubai Internet City' },
  { alias: 'DMC', namePattern: 'Dubai Media City' },
  { alias: 'DAFZA', namePattern: 'Dubai Airport Free Zone' },
  { alias: 'MOE', namePattern: 'Mall of the Emirates' },
  { alias: 'IBN', namePattern: 'Ibn Battuta Mall' },

  // Common short names for landmarks
  { alias: 'Burj Al Arab', namePattern: 'Burj Al Arab' },
  { alias: 'Dubai Frame', namePattern: 'Dubai Frame' },
  { alias: 'Dubai Miracle Garden', namePattern: 'Dubai Miracle Garden' },
  { alias: 'Global Village', namePattern: 'Global Village' },
  { alias: 'La Mer', namePattern: 'La Mer' },
  { alias: 'City Walk', namePattern: 'City Walk' },
  { alias: 'Bluewaters', namePattern: 'Bluewaters' },
  { alias: 'Ain Dubai', namePattern: 'Ain Dubai' },
]

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('=== Location Aliases Seed Script ===\n')

  let totalInserted = 0
  let totalSkipped = 0

  for (const mapping of ALIAS_MAPPINGS) {
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name')
      .ilike('name', `${mapping.namePattern}%`)
      .eq('is_active', true)
      .limit(5)

    if (error) {
      console.error(`  Error searching for "${mapping.namePattern}": ${error.message}`)
      continue
    }

    if (!locations || locations.length === 0) {
      // Try exact google_place_id match if provided
      if (mapping.googlePlaceId) {
        const { data: placeMatch } = await supabase
          .from('locations')
          .select('id, name')
          .eq('google_place_id', mapping.googlePlaceId)
          .single()

        if (placeMatch) {
          const { error: insertErr } = await supabase
            .from('location_aliases')
            .upsert(
              { location_id: placeMatch.id, alias: mapping.alias },
              { onConflict: 'location_id,alias' }
            )
          if (!insertErr) {
            console.log(`  ✓ ${mapping.alias} → ${placeMatch.name} (via place_id)`)
            totalInserted++
          }
        }
      } else {
        console.log(`  ⚠ No locations found for "${mapping.namePattern}"`)
        totalSkipped++
      }
      continue
    }

    for (const loc of locations) {
      // Skip hotels with verbose names (>60 chars) unless it's an exact pattern match
      if (loc.name.length > 60 && !loc.name.toLowerCase().startsWith(mapping.namePattern.toLowerCase())) {
        continue
      }

      const { error: insertErr } = await supabase
        .from('location_aliases')
        .upsert(
          { location_id: loc.id, alias: mapping.alias },
          { onConflict: 'location_id,alias' }
        )

      if (insertErr) {
        console.error(`  ✗ Failed to insert alias "${mapping.alias}" → "${loc.name}": ${insertErr.message}`)
      } else {
        console.log(`  ✓ ${mapping.alias} → ${loc.name}`)
        totalInserted++
      }
    }
  }

  console.log(`\n=== Done ===`)
  console.log(`Inserted: ${totalInserted}`)
  console.log(`Skipped: ${totalSkipped}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
