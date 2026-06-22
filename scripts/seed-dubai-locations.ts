import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { parse } from 'csv-parse/sync'

dotenv.config({ path: '.env.local' })

const BATCH_SIZE = 500
const BATCH_DELAY_MS = 100

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const startTime = Date.now()
  console.log('=== Dubai Locations Seed Script ===\n')

  // Step 1: Fetch location type IDs
  console.log('Step 1: Fetching location types...')
  const { data: allTypes, error: typesError } = await supabase
    .from('location_types')
    .select('id, name')

  if (typesError) {
    throw new Error(`Failed to fetch location types: ${typesError.message}`)
  }

  const typeIdMap = new Map<string, string>()
  for (const t of allTypes ?? []) {
    typeIdMap.set(t.name, t.id)
  }
  console.log(`  Found ${typeIdMap.size} location types`)

  // Step 2: Parse CSV
  console.log('\nStep 2: Parsing CSV...')
  const csvPath = path.join(__dirname, '..', 'dubai_locations.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const records: Array<{
    google_place_id: string
    name: string
    address: string
    city: string
    country_code: string
    latitude: string
    longitude: string
    location_type: string
    google_place_types: string
  }> = parse(csvContent, { columns: true, skip_empty_lines: true })
  console.log(`  Parsed ${records.length} rows`)

  // Step 3: Validate location type coverage
  console.log('\nStep 3: Validating location type mappings...')
  const unmappedTypes = new Set<string>()
  for (const row of records) {
    if (!typeIdMap.has(row.location_type)) {
      unmappedTypes.add(row.location_type)
    }
  }
  if (unmappedTypes.size > 0) {
    console.error(`  ERROR: Unmapped location types: ${Array.from(unmappedTypes).join(', ')}`)
    console.error('  Run the seed_location_types migration first!')
    process.exit(1)
  }
  console.log('  All location types mapped')

  // Step 4: Fetch existing slugs to avoid collisions
  console.log('\nStep 4: Fetching existing slugs...')
  const { data: existingSlugs } = await supabase
    .from('locations')
    .select('slug')

  const existingSlugSet = new Set<string>()
  for (const s of (existingSlugs ?? []) as Array<{ slug: string }>) {
    existingSlugSet.add(s.slug)
  }
  console.log(`  Found ${existingSlugSet.size} existing slugs`)

  // Step 5: Generate deduplicated slugs
  console.log('\nStep 5: Generating slugs...')
  const slugCounts = new Map<string, number>()
  for (const row of records) {
    const baseSlug = generateSlug(row.name.trim())
    slugCounts.set(baseSlug, (slugCounts.get(baseSlug) ?? 0) + 1)
  }

  const slugAssignment = new Map<string, number>()
  const finalSlugs: string[] = []

  for (const row of records) {
    const trimmedName = row.name.trim().substring(0, 255)
    const baseSlug = generateSlug(trimmedName)
    const count = slugCounts.get(baseSlug) ?? 1

    let finalSlug: string
    if (count === 1 && !existingSlugSet.has(baseSlug)) {
      finalSlug = baseSlug
    } else {
      const current = slugAssignment.get(baseSlug) ?? 0
      const next = current + 1
      slugAssignment.set(baseSlug, next)

      if (next === 1) {
        finalSlug = `${baseSlug}-dubai`
        if (existingSlugSet.has(finalSlug)) {
          finalSlug = `${baseSlug}-dubai-1`
        }
      } else {
        finalSlug = `${baseSlug}-dubai-${next}`
      }

      while (existingSlugSet.has(finalSlug)) {
        const bump = (slugAssignment.get(baseSlug) ?? next) + 1
        slugAssignment.set(baseSlug, bump)
        finalSlug = `${baseSlug}-dubai-${bump}`
      }
    }

    existingSlugSet.add(finalSlug)
    finalSlugs.push(finalSlug)
  }

  const uniqueSlugs = new Set(finalSlugs)
  if (uniqueSlugs.size !== finalSlugs.length) {
    console.error(`  FATAL: Slug dedup failed! ${finalSlugs.length} total but only ${uniqueSlugs.size} unique`)
    process.exit(1)
  }
  console.log(`  Generated ${finalSlugs.length} unique slugs`)

  // Step 6: Batch upsert locations
  console.log('\nStep 6: Inserting locations...')
  const totalBatches = Math.ceil(records.length / BATCH_SIZE)
  let insertedCount = 0
  let skippedCount = 0
  const failedBatches: Array<{ batchNum: number; error: string }> = []

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    const batchSlugs = finalSlugs.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1

    const insertData = batch.map((row, idx) => ({
      name: row.name.trim().substring(0, 255),
      address: row.address || null,
      country_code: 'AE',
      country_slug: 'united-arab-emirates',
      city: 'Dubai',
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      timezone: 'Asia/Dubai',
      allow_pickup: true,
      allow_dropoff: true,
      is_active: true,
      location_type_id: typeIdMap.get(row.location_type)!,
      slug: batchSlugs[idx],
      google_place_id: row.google_place_id,
      google_place_types: row.google_place_types.split('|'),
    }))

    const { error } = await supabase
      .from('locations')
      .upsert(insertData, { onConflict: 'google_place_id' })

    if (error) {
      console.error(`  Batch ${batchNum}/${totalBatches} FAILED: ${error.message}`)
      failedBatches.push({ batchNum, error: error.message })
      skippedCount += batch.length
    } else {
      insertedCount += batch.length
      if (batchNum % 20 === 0 || batchNum === totalBatches) {
        console.log(`  Batch ${batchNum}/${totalBatches} complete (${insertedCount} rows so far)`)
      }
    }

    if (i + BATCH_SIZE < records.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  // Step 7: Verification
  console.log('\nStep 7: Verifying...')
  const { count: totalLocations } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })

  const { count: dubaiLocations } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .eq('city', 'Dubai')

  const { count: totalTypes } = await supabase
    .from('location_types')
    .select('*', { count: 'exact', head: true })

  // Step 8: Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('\n=== Summary ===')
  console.log(`  Duration: ${elapsed}s`)
  console.log(`  CSV rows processed: ${records.length}`)
  console.log(`  Successfully inserted/updated: ${insertedCount}`)
  console.log(`  Skipped (batch errors): ${skippedCount}`)
  console.log(`  Failed batches: ${failedBatches.length}`)
  console.log(`  Total locations in DB: ${totalLocations}`)
  console.log(`  Dubai locations in DB: ${dubaiLocations}`)
  console.log(`  Location types in DB: ${totalTypes}`)

  if (failedBatches.length > 0) {
    console.log('\n  Failed batch details:')
    for (const fb of failedBatches) {
      console.log(`    Batch ${fb.batchNum}: ${fb.error}`)
    }
    console.log('\n  Script is idempotent — re-run to retry failed batches.')
  }

  console.log('\n=== Done ===')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
