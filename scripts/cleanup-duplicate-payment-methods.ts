/**
 * One-time cleanup script to consolidate duplicate payment methods
 *
 * This script:
 * 1. Finds all duplicate payment methods (same stripe_payment_method_id + business_account_id)
 * 2. For each group of duplicates, keeps the most recently used/active one
 * 3. Soft-deletes the others (sets is_active = false)
 *
 * Usage:
 *   npx tsx scripts/cleanup-duplicate-payment-methods.ts
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Create admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface PaymentMethod {
  id: string;
  business_account_id: string;
  stripe_payment_method_id: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  card_last4: string;
  card_brand: string;
}

async function cleanupDuplicates() {
  console.log('🔍 Starting duplicate payment methods cleanup...\n');

  try {
    // Fetch all payment methods
    const { data: allPaymentMethods, error } = await supabase
      .from('payment_methods')
      .select('id, business_account_id, stripe_payment_method_id, is_active, last_used_at, created_at, card_last4, card_brand')
      .order('business_account_id')
      .order('stripe_payment_method_id')
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch payment methods: ${error.message}`);
    }

    if (!allPaymentMethods || allPaymentMethods.length === 0) {
      console.log('✅ No payment methods found in database.');
      return;
    }

    console.log(`📊 Found ${allPaymentMethods.length} total payment methods\n`);

    // Group by business_account_id + stripe_payment_method_id
    const duplicateGroups = new Map<string, PaymentMethod[]>();

    for (const pm of allPaymentMethods) {
      const key = `${pm.business_account_id}:${pm.stripe_payment_method_id}`;
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key)!.push(pm);
    }

    // Find groups with duplicates
    const duplicateEntries = Array.from(duplicateGroups.entries()).filter(
      ([_, pms]) => pms.length > 1
    );

    if (duplicateEntries.length === 0) {
      console.log('✅ No duplicates found! Database is clean.\n');
      return;
    }

    console.log(`🔍 Found ${duplicateEntries.length} groups with duplicates:\n`);

    let totalDeactivated = 0;

    // Process each duplicate group
    for (const [key, pms] of duplicateEntries) {
      const [businessId, stripeId] = key.split(':');

      console.log(`\n📦 Processing duplicate group:`);
      console.log(`   Business: ${businessId}`);
      console.log(`   Stripe PM: ${stripeId}`);
      console.log(`   Total copies: ${pms.length}`);

      // Find the one to keep (prefer active, then most recently used)
      const activePM = pms.find(pm => pm.is_active);
      const pmToKeep = activePM || pms[0]; // pms is already sorted by last_used_at desc

      console.log(`   ✅ Keeping: ${pmToKeep.id} (${pmToKeep.card_brand} ****${pmToKeep.card_last4})`);
      console.log(`      - is_active: ${pmToKeep.is_active}`);
      console.log(`      - last_used: ${pmToKeep.last_used_at || 'never'}`);

      // Get IDs of duplicates to deactivate
      const toDeactivate = pms.filter(pm => pm.id !== pmToKeep.id);

      if (toDeactivate.length > 0) {
        const idsToDeactivate = toDeactivate.map(pm => pm.id);

        // Soft-delete the duplicates
        const { error: updateError } = await supabase
          .from('payment_methods')
          .update({ is_active: false })
          .in('id', idsToDeactivate);

        if (updateError) {
          console.error(`   ❌ Error deactivating duplicates: ${updateError.message}`);
          continue;
        }

        console.log(`   🧹 Deactivated ${toDeactivate.length} duplicate(s):`);
        toDeactivate.forEach(pm => {
          console.log(`      - ${pm.id} (was_active: ${pm.is_active})`);
        });

        totalDeactivated += toDeactivate.length;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Cleanup completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Groups processed: ${duplicateEntries.length}`);
    console.log(`   - Payment methods deactivated: ${totalDeactivated}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupDuplicates()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
