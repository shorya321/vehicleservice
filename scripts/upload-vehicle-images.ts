/**
 * Bulk-upload vehicle category and vehicle type images, then write the public
 * URL back to the matching row's `image_url`.
 *
 * Reproduces exactly what the admin forms do (app/admin/vehicle-categories/actions/upload.ts
 * and app/admin/vehicle-types/actions/upload.ts) minus the base64 round trip, so 20 images
 * land in one command instead of 20 rounds of clicking through the admin UI.
 *
 * Storage layout -- the path is derived from the slug, so the filename on disk
 * decides which row it belongs to:
 *
 *   <dir>/categories/<category-slug>.jpg  ->  vehicles/categories/<slug>/category-image.jpg
 *   <dir>/types/<type-slug>.jpg           ->  vehicles/vehicle-types/<slug>/vehicle-type-image.jpg
 *
 * A slug with no matching DB row is reported and skipped rather than uploaded,
 * so a typo in a filename cannot leave an orphaned object in the bucket. Note
 * that `vehicles` is a SHARED bucket (blog images live there too) -- this script
 * only ever writes under `categories/` and `vehicle-types/`.
 *
 * No resizing happens here or server-side. Size images before running:
 * JPG/PNG/WebP, ~600x400 for types, under 5MB.
 *
 *   npx tsx scripts/upload-vehicle-images.ts ./fleet-images            # dry run
 *   npx tsx scripts/upload-vehicle-images.ts ./fleet-images --commit   # execute
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

dotenv.config({ path: '.env.local' })

const BUCKET = 'vehicles'
const COMMIT = process.argv.includes('--commit')
const ROOT = process.argv.find((a) => !a.startsWith('--') && !a.includes('node') && !a.endsWith('.ts'))

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

type Target = {
  /** Subdirectory under ROOT holding the files. */
  dir: string
  table: 'vehicle_categories' | 'vehicle_types'
  /** Storage prefix; must stay in sync with the admin upload actions. */
  prefix: string
  /** Fixed filename the admin actions use, sans extension. */
  filename: string
}

const TARGETS: Target[] = [
  { dir: 'categories', table: 'vehicle_categories', prefix: 'categories', filename: 'category-image' },
  { dir: 'types', table: 'vehicle_types', prefix: 'vehicle-types', filename: 'vehicle-type-image' },
]

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set -- add it to .env.local`)
  return value
}

async function main(): Promise<void> {
  if (!ROOT) {
    throw new Error('Usage: npx tsx scripts/upload-vehicle-images.ts <image-dir> [--commit]')
  }
  if (!fs.existsSync(ROOT)) {
    throw new Error(`Image directory not found: ${ROOT}`)
  }

  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } }
  )

  console.log(COMMIT ? 'MODE: commit\n' : 'MODE: dry run (pass --commit to execute)\n')

  let uploaded = 0
  let skipped = 0

  for (const target of TARGETS) {
    const dir = path.join(ROOT, target.dir)
    if (!fs.existsSync(dir)) {
      console.log(`${target.dir}/ -- directory absent, skipping`)
      continue
    }

    // Fetch valid slugs up front so a misnamed file fails loudly instead of
    // uploading an object no row will ever point at.
    const { data: rows, error: rowsError } = await supabase.from(target.table).select('id, slug')
    if (rowsError) throw new Error(`Failed to read ${target.table}: ${rowsError.message}`)

    const slugToId = new Map((rows ?? []).map((r) => [r.slug as string, r.id as string]))

    const files = fs.readdirSync(dir).filter((f) => MIME[path.extname(f).toLowerCase()])
    console.log(`${target.dir}/ -- ${files.length} image(s) found`)

    for (const file of files) {
      const ext = path.extname(file).toLowerCase()
      const slug = path.basename(file, ext)
      const id = slugToId.get(slug)

      if (!id) {
        console.log(`  SKIP  ${file} -- no ${target.table} row with slug "${slug}"`)
        skipped++
        continue
      }

      const storagePath = `${target.prefix}/${slug}/${target.filename}${ext}`

      if (!COMMIT) {
        console.log(`  would upload  ${file} -> ${BUCKET}/${storagePath}`)
        uploaded++
        continue
      }

      const buffer = fs.readFileSync(path.join(dir, file))
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: MIME[ext], upsert: true })

      if (uploadError) {
        console.error(`  FAIL  ${file} -- upload: ${uploadError.message}`)
        skipped++
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

      const { error: updateError } = await supabase
        .from(target.table)
        .update({ image_url: publicUrl })
        .eq('id', id)

      if (updateError) {
        console.error(`  FAIL  ${file} -- row update: ${updateError.message}`)
        skipped++
        continue
      }

      console.log(`  OK    ${file} -> ${storagePath}`)
      uploaded++
    }
  }

  console.log(`\n${COMMIT ? 'Uploaded' : 'Would upload'}: ${uploaded}   Skipped: ${skipped}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
