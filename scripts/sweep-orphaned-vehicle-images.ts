/**
 * Delete vehicle images in the `vehicles` bucket that no row references.
 *
 * Orphans accumulate from vehicle deletions that predate storage cleanup, and
 * from abandoned add-vehicle forms (the image uploads before the row is saved).
 *
 * !! The `vehicles` bucket is SHARED. It also stores blog featured images,
 * vehicle-category images and vehicle-type images -- app/admin/blog/...,
 * app/admin/vehicle-categories/... and app/admin/vehicle-types/... all upload
 * into `.from('vehicles')`. A naive "not referenced by vehicles.primary_image_url"
 * sweep would delete every blog and category image on the site.
 *
 * Two independent guards:
 *
 *   1. The referenced set is built from EVERY table that stores a URL into this
 *      bucket (see REFERENCES below), not just `vehicles`.
 *   2. Only vehicle-owned path shapes are ever candidates:
 *        - `{uuid}/...`            current layout, folder = vendor_applications.id
 *        - `vehicles/{uuid}/...`   legacy doubled-prefix layout
 *      Everything else (`blog/`, `categories/`, `vehicle-types/`) is skipped
 *      outright, so a missed reference cannot destroy a non-vehicle image.
 *
 * Deletes via the Storage API, not `delete from storage.objects` -- the latter
 * removes the metadata row but leaves the file in the backend.
 *
 *   npx tsx scripts/sweep-orphaned-vehicle-images.ts            # dry run
 *   npx tsx scripts/sweep-orphaned-vehicle-images.ts --commit   # execute
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const BUCKET = 'vehicles'
const COMMIT = process.argv.includes('--commit')
const GRACE_MS = 60 * 60 * 1000 // never touch objects younger than an hour

/** Every table/column that stores a URL into this bucket. */
const REFERENCES: { table: string; column: string }[] = [
  { table: 'vehicles', column: 'primary_image_url' },
  { table: 'vehicle_types', column: 'image_url' },
  { table: 'vehicle_categories', column: 'image_url' },
  { table: 'blog_posts', column: 'featured_image_url' },
  { table: 'blog_categories', column: 'image_url' },
]

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

/** Guard 2: is this path a vehicle image at all? */
function isVehicleImagePath(path: string): boolean {
  const parts = path.split('/')
  if (UUID.test(parts[0])) return true // {businessId}/{uuid}.jpg
  if (parts[0] === 'vehicles' && parts.length > 1 && UUID.test(parts[1])) return true // legacy
  return false
}

/** Recursively walks the bucket; Storage `list` returns one directory at a time. */
async function listAll(prefix = ''): Promise<{ path: string; createdAt: string }[]> {
  const out: { path: string; createdAt: string }[] = []
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 })

  if (error) throw new Error(`list('${prefix}') failed: ${error.message}`)

  for (const entry of data ?? []) {
    const full = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.id === null) {
      out.push(...(await listAll(full))) // folder
    } else {
      out.push({ path: full, createdAt: entry.created_at ?? '' })
    }
  }

  return out
}

async function collectReferenced(): Promise<Set<string>> {
  const referenced = new Set<string>()

  for (const { table, column } of REFERENCES) {
    const { data, error } = await supabase.from(table).select(column)

    if (error) {
      // A missing table is fine to skip; a failed read is not -- we would
      // mistake its images for orphans.
      console.error(`Refusing to sweep: could not read ${table}.${column}: ${error.message}`)
      process.exit(1)
    }

    let found = 0
    for (const row of data ?? []) {
      const url = (row as unknown as Record<string, unknown>)[column]
      if (typeof url !== 'string' || !url) continue
      const path = storagePathFromUrl(url)
      if (path) {
        referenced.add(path)
        found++
      }
    }
    console.log(`  ${table}.${column}: ${found} referenced`)
  }

  return referenced
}

async function main(): Promise<void> {
  console.log(COMMIT ? '=== COMMIT MODE ===\n' : '=== DRY RUN (pass --commit to execute) ===\n')

  console.log('Collecting referenced objects:')
  const referenced = await collectReferenced()
  console.log(`  total referenced: ${referenced.size}\n`)

  const all = await listAll()
  const now = Date.now()

  const vehicleImages = all.filter((o) => isVehicleImagePath(o.path))
  const nonVehicle = all.length - vehicleImages.length

  const tooNew: string[] = []
  const orphans = vehicleImages.filter((o) => {
    if (referenced.has(o.path)) return false
    const age = o.createdAt ? now - new Date(o.createdAt).getTime() : Infinity
    if (age <= GRACE_MS) {
      tooNew.push(o.path)
      return false
    }
    return true
  })

  console.log(`Objects in bucket: ${all.length}`)
  console.log(`  not vehicle images (blog/categories/vehicle-types) -- skipped: ${nonVehicle}`)
  console.log(`  vehicle images: ${vehicleImages.length}`)
  console.log(`    still referenced (kept): ${vehicleImages.filter((o) => referenced.has(o.path)).length}`)
  console.log(`    younger than 1h (kept): ${tooNew.length}`)
  console.log(`    orphans to delete: ${orphans.length}\n`)

  if (orphans.length === 0) {
    console.log('Nothing to do.')
    return
  }

  for (const o of orphans) console.log(`  ${o.path}`)

  if (!COMMIT) {
    console.log('\nDry run only. Re-run with --commit to delete.')
    return
  }

  console.log('\nDeleting...')
  for (let i = 0; i < orphans.length; i += 100) {
    const chunk = orphans.slice(i, i + 100).map((o) => o.path)
    const { error } = await supabase.storage.from(BUCKET).remove(chunk)
    if (error) {
      console.error('Delete failed:', error.message)
      console.error('Safe to re-run: orphans are recomputed from the tables each time.')
      process.exit(1)
    }
    console.log(`  deleted ${Math.min(i + 100, orphans.length)}/${orphans.length}`)
  }

  console.log('\nDone.')
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
