const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fnrlzhrchuoiwwsugidz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucmx6aHJjaHVvaXd3c3VnaWR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc1NjEyMSwiZXhwIjoyMDY2MzMyMTIxfQ.htLE-ibgZ7PVOp6VeBQ1VizdsSCTwB9ay4OTOZSsgLo'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log(`
To fix the RLS policy error for vendor route creation, run this SQL in your Supabase Dashboard:

-- Temporary fix: Allow vendors to create routes until full migration is run
CREATE POLICY IF NOT EXISTS "Vendors can create routes (temporary)"
    ON routes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendor_applications 
            WHERE user_id = auth.uid() 
            AND status = 'approved'
        )
    );

-- Also allow vendors to view all routes temporarily
CREATE POLICY IF NOT EXISTS "Vendors can view all routes (temporary)"
    ON routes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vendor_applications 
            WHERE user_id = auth.uid()
        )
    );

-- Allow vendors to update routes temporarily
CREATE POLICY IF NOT EXISTS "Vendors can update routes (temporary)"
    ON routes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vendor_applications 
            WHERE user_id = auth.uid() 
            AND status = 'approved'
        )
    );

-- Allow vendors to delete routes temporarily
CREATE POLICY IF NOT EXISTS "Vendors can delete routes (temporary)"
    ON routes
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vendor_applications 
            WHERE user_id = auth.uid() 
            AND status = 'approved'
        )
    );

Note: These are temporary policies. The full vendor routes migration will create proper policies that check the created_by column.
`)