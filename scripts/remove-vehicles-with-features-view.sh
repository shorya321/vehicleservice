#!/bin/bash

# Script to remove the vehicles_with_features view and update types

echo "🗑️  Removing vehicles_with_features view..."

# Run the migration
echo "Running migration..."
node scripts/run-migration.ts

# Check if migration was successful
if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully"
    
    # Remind to regenerate types
    echo ""
    echo "📝 Don't forget to regenerate TypeScript types:"
    echo "npx supabase gen types typescript --project-id <your-project-id> > lib/supabase/types.ts"
else
    echo "❌ Migration failed"
    exit 1
fi