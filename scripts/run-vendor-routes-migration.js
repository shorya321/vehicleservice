const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fnrlzhrchuoiwwsugidz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucmx6aHJjaHVvaXd3c3VnaWR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc1NjEyMSwiZXhwIjoyMDY2MzMyMTIxfQ.htLE-ibgZ7PVOp6VeBQ1VizdsSCTwB9ay4OTOZSsgLo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runVendorRoutesMigration() {
  console.log('Adding vendor routes support columns...')
  
  try {
    // Add the missing columns
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add columns for vendor route creation
        ALTER TABLE routes 
        ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES vendor_applications(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS created_by_type VARCHAR(10) DEFAULT 'admin' CHECK (created_by_type IN ('admin', 'vendor')),
        ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;
      `
    })
    
    if (alterError) {
      console.error('Error adding columns:', alterError)
      return
    }
    
    console.log('✅ Columns added successfully')
    
    // Update existing routes to be admin-created
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Update existing routes to be admin-created
        UPDATE routes 
        SET created_by_type = 'admin', 
            is_shared = true 
        WHERE created_by_type IS NULL OR created_by_type = 'admin';
      `
    })
    
    if (updateError) {
      console.error('Error updating existing routes:', updateError)
    } else {
      console.log('✅ Existing routes updated as admin-created')
    }
    
  } catch (error) {
    console.error('Migration error:', error)
  }
}

runVendorRoutesMigration()