import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { parse } from 'csv-parse/sync'

dotenv.config({ path: '.env.local' })

const BATCH_SIZE = 500
const PRICING_BATCH_SIZE = 200
const BATCH_DELAY_MS = 100

interface CsvRecord {
  google_place_id: string
  name: string
  address: string
  city: string
  country_code: string
  latitude: string
  longitude: string
  location_type: string
  google_place_types: string
  zone_id: string
  zone_name: string
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function csvZoneIdToSlug(csvZoneId: string): string {
  return csvZoneId.replace(/_/g, '-')
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
  console.log('=== Zone & Location Seed Script ===\n')

  // Step 1: Parse CSV
  console.log('Step 1: Parsing CSV...')
  const csvPath = path.join(__dirname, '..', 'dubai_locations_zoned.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const records: CsvRecord[] = parse(csvContent, { columns: true, skip_empty_lines: true })
  console.log(`  Parsed ${records.length} rows`)

  // Step 2: Extract unique zones
  console.log('\nStep 2: Extracting zones...')
  const zoneMap = new Map<string, string>()
  for (const row of records) {
    if (row.zone_id && row.zone_name && !zoneMap.has(row.zone_id)) {
      zoneMap.set(row.zone_id, row.zone_name)
    }
  }
  console.log(`  Found ${zoneMap.size} unique zones:`)
  for (const [zid, zname] of [...zoneMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`    ${zid} → ${zname}`)
  }

  // Step 3: Fetch location type IDs
  console.log('\nStep 3: Fetching location types...')
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

  // Step 4: Validate location type coverage
  console.log('\nStep 4: Validating location type mappings...')
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

  // Step 5: Cleanup existing data (FK-safe order)
  console.log('\nStep 5: Cleaning up existing data...')

  // 5a: Null out bookings zone references
  const { count: bookingsUpdated } = await supabase
    .from('bookings')
    .update({ from_zone_id: null, to_zone_id: null })
    .not('from_zone_id', 'is', null)
    .select('*', { count: 'exact', head: true })
  console.log(`  Nulled booking zone refs: ${bookingsUpdated ?? 0} rows`)

  const { count: bookingsUpdated2 } = await supabase
    .from('bookings')
    .update({ to_zone_id: null })
    .not('to_zone_id', 'is', null)
    .select('*', { count: 'exact', head: true })
  console.log(`  Nulled booking to_zone refs: ${bookingsUpdated2 ?? 0} rows`)

  // 5b: Null out business_bookings zone references
  const { error: bbError } = await supabase
    .from('business_bookings')
    .update({ from_zone_id: null, to_zone_id: null })
    .not('from_zone_id', 'is', null)
  if (bbError) {
    console.log(`  business_bookings cleanup note: ${bbError.message}`)
  } else {
    console.log('  Nulled business_booking zone refs')
  }

  const { error: bbError2 } = await supabase
    .from('business_bookings')
    .update({ to_zone_id: null })
    .not('to_zone_id', 'is', null)
  if (bbError2) {
    console.log(`  business_bookings to_zone cleanup note: ${bbError2.message}`)
  }

  // 5c: Delete all zone_pricing
  const { error: pricingDeleteError } = await supabase
    .from('zone_pricing')
    .delete()
    .not('id', 'is', null)
  if (pricingDeleteError) {
    throw new Error(`Failed to delete zone_pricing: ${pricingDeleteError.message}`)
  }
  console.log('  Deleted all zone_pricing rows')

  // 5d: Null out locations.zone_id
  const { error: locZoneError } = await supabase
    .from('locations')
    .update({ zone_id: null })
    .not('zone_id', 'is', null)
  if (locZoneError) {
    throw new Error(`Failed to null location zone_ids: ${locZoneError.message}`)
  }
  console.log('  Nulled all location zone_ids')

  // 5e: Delete all zones
  const { error: zonesDeleteError } = await supabase
    .from('zones')
    .delete()
    .not('id', 'is', null)
  if (zonesDeleteError) {
    throw new Error(`Failed to delete zones: ${zonesDeleteError.message}`)
  }
  console.log('  Deleted all zones')

  // Step 6: Insert 29 zones
  console.log('\nStep 6: Inserting zones...')
  const sortedZoneEntries = [...zoneMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const zoneInsertData = sortedZoneEntries.map(([csvZoneId, zoneName], index) => ({
    name: zoneName,
    slug: csvZoneIdToSlug(csvZoneId),
    description: null,
    is_active: true,
    sort_order: index + 1,
  }))

  const { data: insertedZones, error: zoneInsertError } = await supabase
    .from('zones')
    .insert(zoneInsertData)
    .select('id, slug')

  if (zoneInsertError || !insertedZones) {
    throw new Error(`Failed to insert zones: ${zoneInsertError?.message}`)
  }

  const slugToUuid = new Map<string, string>()
  for (const zone of insertedZones) {
    slugToUuid.set(zone.slug, zone.id)
  }

  const csvZoneIdToUuid = new Map<string, string>()
  for (const [csvZoneId] of zoneMap) {
    const slug = csvZoneIdToSlug(csvZoneId)
    const uuid = slugToUuid.get(slug)
    if (!uuid) {
      throw new Error(`Zone slug "${slug}" not found after insert — data mismatch!`)
    }
    csvZoneIdToUuid.set(csvZoneId, uuid)
  }
  console.log(`  Inserted ${insertedZones.length} zones`)

  // Step 7: Create zone pricing (29x29 = 841 combinations)
  console.log('\nStep 7: Creating zone pricing...')
  const zoneUuids = [...slugToUuid.values()]
  const pricingData: Array<{
    from_zone_id: string
    to_zone_id: string
    base_price: number
    currency: string
    is_active: boolean
  }> = []

  for (const fromId of zoneUuids) {
    for (const toId of zoneUuids) {
      pricingData.push({
        from_zone_id: fromId,
        to_zone_id: toId,
        base_price: fromId === toId ? 50 : 100,
        currency: 'AED',
        is_active: true,
      })
    }
  }
  console.log(`  Generated ${pricingData.length} pricing entries`)

  const pricingBatches = Math.ceil(pricingData.length / PRICING_BATCH_SIZE)
  let pricingInserted = 0
  for (let i = 0; i < pricingData.length; i += PRICING_BATCH_SIZE) {
    const batch = pricingData.slice(i, i + PRICING_BATCH_SIZE)
    const batchNum = Math.floor(i / PRICING_BATCH_SIZE) + 1

    const { error } = await supabase.from('zone_pricing').insert(batch)
    if (error) {
      console.error(`  Pricing batch ${batchNum}/${pricingBatches} FAILED: ${error.message}`)
    } else {
      pricingInserted += batch.length
    }
  }
  console.log(`  Inserted ${pricingInserted}/${pricingData.length} pricing entries`)

  // Step 8: Fetch existing google_place_ids to separate update vs insert
  console.log('\nStep 8: Fetching existing locations...')
  const existingPlaceIds = new Set<string>()
  const existingSlugSet = new Set<string>()

  let fetchOffset = 0
  const FETCH_LIMIT = 1000
  while (true) {
    const { data: batch } = await supabase
      .from('locations')
      .select('google_place_id, slug')
      .range(fetchOffset, fetchOffset + FETCH_LIMIT - 1)

    if (!batch || batch.length === 0) break
    for (const row of batch) {
      if (row.google_place_id) existingPlaceIds.add(row.google_place_id)
      if (row.slug) existingSlugSet.add(row.slug)
    }
    fetchOffset += batch.length
    if (batch.length < FETCH_LIMIT) break
  }
  console.log(`  Found ${existingPlaceIds.size} existing locations, ${existingSlugSet.size} existing slugs`)

  // Split records into existing (update zone_id only) and new (insert with slug)
  const existingRecords: CsvRecord[] = []
  const newRecords: CsvRecord[] = []
  for (const row of records) {
    if (existingPlaceIds.has(row.google_place_id)) {
      existingRecords.push(row)
    } else {
      newRecords.push(row)
    }
  }
  console.log(`  Existing locations to update: ${existingRecords.length}`)
  console.log(`  New locations to insert: ${newRecords.length}`)

  // Step 9: Update zone_id on existing locations (grouped by zone for efficiency)
  console.log('\nStep 9: Updating zone_id on existing locations...')
  const UPDATE_BATCH = 500
  let updatedCount = 0
  const updateFailedBatches: Array<{ batchNum: number; error: string }> = []

  const totalUpdateBatches = Math.ceil(existingRecords.length / UPDATE_BATCH)
  for (let i = 0; i < existingRecords.length; i += UPDATE_BATCH) {
    const batch = existingRecords.slice(i, i + UPDATE_BATCH)
    const batchNum = Math.floor(i / UPDATE_BATCH) + 1

    const zoneGroups = new Map<string, string[]>()
    for (const row of batch) {
      const zoneUuid = csvZoneIdToUuid.get(row.zone_id)
      if (zoneUuid) {
        const list = zoneGroups.get(zoneUuid) ?? []
        list.push(row.google_place_id)
        zoneGroups.set(zoneUuid, list)
      }
    }

    let batchFailed = false
    for (const [zoneUuid, placeIds] of Array.from(zoneGroups.entries())) {
      const { error } = await supabase
        .from('locations')
        .update({ zone_id: zoneUuid })
        .in('google_place_id', placeIds)

      if (error) {
        console.error(`  Update batch ${batchNum}/${totalUpdateBatches} FAILED: ${error.message}`)
        updateFailedBatches.push({ batchNum, error: error.message })
        batchFailed = true
        break
      }
    }

    if (!batchFailed) {
      updatedCount += batch.length
      if (batchNum % 20 === 0 || batchNum === totalUpdateBatches) {
        console.log(`  Update batch ${batchNum}/${totalUpdateBatches} complete (${updatedCount} rows so far)`)
      }
    }

    if (i + UPDATE_BATCH < existingRecords.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }
  console.log(`  Updated zone_id on ${updatedCount}/${existingRecords.length} existing locations`)

  // Step 10: Insert new locations (if any)
  let insertedCount = 0
  let skippedCount = 0
  const failedBatches: Array<{ batchNum: number; error: string }> = []

  if (newRecords.length > 0) {
    console.log('\nStep 10: Generating slugs for new locations...')
    const slugCounts = new Map<string, number>()
    for (const row of newRecords) {
      const baseSlug = generateSlug(row.name.trim())
      slugCounts.set(baseSlug, (slugCounts.get(baseSlug) ?? 0) + 1)
    }

    const slugAssignment = new Map<string, number>()
    const finalSlugs: string[] = []

    for (const row of newRecords) {
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
    console.log(`  Generated ${finalSlugs.length} unique slugs for new locations`)

    console.log('\n  Inserting new locations...')
    const totalBatches = Math.ceil(newRecords.length / BATCH_SIZE)

    for (let i = 0; i < newRecords.length; i += BATCH_SIZE) {
      const batch = newRecords.slice(i, i + BATCH_SIZE)
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
        zone_id: csvZoneIdToUuid.get(row.zone_id) ?? null,
      }))

      const { error } = await supabase
        .from('locations')
        .insert(insertData)

      if (error) {
        console.error(`  Insert batch ${batchNum}/${totalBatches} FAILED: ${error.message}`)
        failedBatches.push({ batchNum, error: error.message })
        skippedCount += batch.length
      } else {
        insertedCount += batch.length
        if (batchNum % 20 === 0 || batchNum === totalBatches) {
          console.log(`  Insert batch ${batchNum}/${totalBatches} complete (${insertedCount} rows so far)`)
        }
      }

      if (i + BATCH_SIZE < newRecords.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }
  } else {
    console.log('\nStep 10: No new locations to insert')
  }

  // Step 11: Verification
  console.log('\nStep 11: Verifying...')
  const { count: totalZones } = await supabase
    .from('zones')
    .select('*', { count: 'exact', head: true })

  const { count: totalPricing } = await supabase
    .from('zone_pricing')
    .select('*', { count: 'exact', head: true })

  const { count: totalLocations } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })

  const { count: locationsWithZone } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .not('zone_id', 'is', null)

  const { count: dubaiLocations } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .eq('city', 'Dubai')

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('\n=== Summary ===')
  console.log(`  Duration: ${elapsed}s`)
  console.log(`  CSV rows processed: ${records.length}`)
  console.log(`  Zones in DB: ${totalZones} (expected 29)`)
  console.log(`  Zone pricing entries: ${totalPricing} (expected 841)`)
  console.log(`  Existing locations updated: ${updatedCount}`)
  console.log(`  New locations inserted: ${insertedCount}`)
  console.log(`  Locations skipped (errors): ${skippedCount}`)
  console.log(`  Update failed batches: ${updateFailedBatches.length}`)
  console.log(`  Insert failed batches: ${failedBatches.length}`)
  console.log(`  Total locations in DB: ${totalLocations}`)
  console.log(`  Dubai locations in DB: ${dubaiLocations}`)
  console.log(`  Locations with zone_id: ${locationsWithZone}`)

  if (updateFailedBatches.length > 0 || failedBatches.length > 0) {
    console.log('\n  Failed batch details:')
    for (const fb of updateFailedBatches) {
      console.log(`    Update batch ${fb.batchNum}: ${fb.error}`)
    }
    for (const fb of failedBatches) {
      console.log(`    Insert batch ${fb.batchNum}: ${fb.error}`)
    }
    console.log('\n  Script is idempotent — re-run to retry failed batches.')
  }

  console.log('\n=== Done ===')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
