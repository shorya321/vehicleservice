import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('Running booking user references fix migration...')
    
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250131_fix_booking_user_references.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    console.log('\nMigration SQL to run:')
    console.log('='.repeat(50))
    console.log(migrationSQL)
    console.log('='.repeat(50))
    console.log('\nPlease run this migration manually in your Supabase dashboard SQL editor.')
    console.log('Go to: https://supabase.com/dashboard/project/[your-project]/sql/new')
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

runMigration()