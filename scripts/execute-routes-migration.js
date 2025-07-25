const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250115_create_routes_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Executing routes tables migration...');
    
    // Since Supabase doesn't provide direct SQL execution through the JS client,
    // we'll use the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query_json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Try alternative approach - execute via Supabase Dashboard API
      console.log('Direct RPC failed, please execute the following SQL in Supabase Dashboard:');
      console.log('\n--- SQL Migration ---\n');
      console.log(sql);
      console.log('\n--- End SQL Migration ---\n');
      
      console.log('\nTo execute this migration:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Paste the SQL above and execute');
      console.log('\nProject URL:', supabaseUrl);
      
      return;
    }

    const result = await response.json();
    console.log('Migration executed successfully!', result);
    
  } catch (error) {
    console.error('Error executing migration:', error);
    
    // Output the SQL for manual execution
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250115_create_routes_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('\nPlease execute the following SQL manually in Supabase Dashboard:');
    console.log('\n--- SQL Migration ---\n');
    console.log(sql);
    console.log('\n--- End SQL Migration ---\n');
  }
}

executeMigration();