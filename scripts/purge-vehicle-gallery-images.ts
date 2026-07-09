/**
 * Purge the orphaned `vehicles.gallery_images` Storage objects.
 *
 * Gallery images were written on every vehicle save but rendered nowhere.
 * Commit 4eb1c45 removed the last writer. This deletes the leftover files and
 * clears the column so the drop migration's guard passes.
 *
 * Run ONLY after 4eb1c45 is live in production. While the old code is serving
 * traffic it still reads gallery_images to populate the edit form, and would
 * render broken image previews.
 *
 * Deletes via the Storage API, not `delete from storage.objects` -- the latter
 * removes the metadata row but leaves the file in the backend.
 *
 *   npx tsx scripts/purge-vehicle-gallery-images.ts            # dry run
 *   npx tsx scripts/purge-vehicle-gallery-images.ts --commit   # execute
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const BUCKET = 'vehicles'
const COMMIT = process.argv.includes('--commit')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/** Mirrors lib/storage/paths.ts -- handles the legacy doubled `vehicles/` prefix. */
function storagePathFromUrl(url: string): string | null {
  const marker = `/${BUCKET}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  const path = url.slice(index + marker.length)
  return path.length > 0 ? path : null
}

interface VehicleRow {
  id: string
  registration_number: string
  primary_image_url: string | null
  gallery_images: unknown
}

async function main(): Promise<void> {
  console.log(COMMIT ? '=== COMMIT MODE ===\n' : '=== DRY RUN (pass --commit to execute) ===\n')

  const { data, error } = await supabase
    .from('vehicles')
    .select('id, registration_number, primary_image_url, gallery_images')

  if (error) {
    console.error('Failed to read vehicles:', error.message)
    process.exit(1)
  }

  const rows = (data ?? []) as VehicleRow[]

  // Every primary image, so the purge can never delete a live thumbnail.
  const primaryUrls = new Set(
    rows.map((r) => r.primary_image_url).filter((u): u is string => Boolean(u))
  )

  const targets: { vehicleId: string; reg: string; url: string; path: string }[] = []
  const rowsWithGallery: string[] = []

  for (const row of rows) {
    const gallery = Array.isArray(row.gallery_images) ? (row.gallery_images as unknown[]) : []
    if (gallery.length === 0) continue
    rowsWithGallery.push(row.id)

    for (const entry of gallery) {
      if (typeof entry !== 'string') continue

      if (primaryUrls.has(entry)) {
        console.error(`REFUSING: ${entry}\n  is also a primary_image_url. Aborting, nothing deleted.`)
        process.exit(1)
      }

      const path = storagePathFromUrl(entry)
      if (!path) {
        console.error(`REFUSING: cannot derive a storage path from ${entry}. Aborting.`)
        process.exit(1)
      }

      targets.push({ vehicleId: row.id, reg: row.registration_number, url: entry, path })
    }
  }

  console.log(`Vehicles: ${rows.length}`)
  console.log(`Rows with a gallery: ${rowsWithGallery.length}`)
  console.log(`Objects to delete: ${targets.length}`)
  console.log(`Sanity: 0 of them are a primary_image_url\n`)

  if (targets.length === 0) {
    console.log('Nothing to do.')
    return
  }

  for (const t of targets) console.log(`  ${t.reg}  ${t.path}`)

  if (!COMMIT) {
    console.log('\nDry run only. Re-run with --commit to delete.')
    return
  }

  console.log('\nDeleting storage objects...')
  const { error: removeError } = await supabase.storage.from(BUCKET).remove(targets.map((t) => t.path))

  if (removeError) {
    console.error('Storage delete failed:', removeError.message)
    console.error('Column left intact; nothing else changed. Safe to re-run.')
    process.exit(1)
  }
  console.log(`Deleted ${targets.length} object(s).`)

  // Clear the column so the drop migration's guard passes. Only after the
  // files are gone -- the column is the only record of their paths.
  console.log('Clearing gallery_images...')
  const { error: updateError } = await supabase
    .from('vehicles')
    .update({ gallery_images: [] })
    .in('id', rowsWithGallery)

  if (updateError) {
    console.error('Failed to clear gallery_images:', updateError.message)
    console.error('Objects were deleted. Re-running is safe (it will find nothing to delete).')
    process.exit(1)
  }

  console.log(`Cleared on ${rowsWithGallery.length} row(s).`)
  console.log('\nDone. Next: apply 20260709_drop_vehicles_gallery_images.sql')
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
