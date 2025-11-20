/**
 * Sync Verified Domains to Vercel
 *
 * One-time migration script to add existing verified custom domains to Vercel.
 * Run this after implementing Vercel API integration to sync domains that were
 * verified before the integration was added.
 *
 * Usage:
 *   npx tsx scripts/sync-verified-domains-to-vercel.ts
 *
 * Prerequisites:
 *   - VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_TEAM_ID (optional) in environment
 *   - NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in environment
 */

import { createClient } from '@supabase/supabase-js';
import { addDomainToVercel, checkDomainStatus, isVercelConfigured } from '../lib/vercel/api';

interface BusinessAccount {
  id: string;
  business_name: string;
  custom_domain: string;
  custom_domain_verified: boolean;
}

async function main() {
  console.log('🚀 Starting domain sync to Vercel...\n');

  // Check Vercel configuration
  if (!isVercelConfigured()) {
    console.error('❌ Vercel is not configured!');
    console.error('Please set VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables.');
    process.exit(1);
  }

  console.log('✅ Vercel configuration found\n');

  // Initialize Supabase admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase configuration missing!');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('✅ Supabase client initialized\n');

  // Fetch all verified custom domains
  console.log('📋 Fetching verified custom domains from database...');

  const { data: businesses, error } = await supabase
    .from('business_accounts')
    .select('id, business_name, custom_domain, custom_domain_verified')
    .not('custom_domain', 'is', null)
    .eq('custom_domain_verified', true)
    .eq('status', 'active');

  if (error) {
    console.error('❌ Failed to fetch business accounts:', error);
    process.exit(1);
  }

  if (!businesses || businesses.length === 0) {
    console.log('ℹ️  No verified custom domains found in database.');
    console.log('✅ Nothing to sync!');
    process.exit(0);
  }

  console.log(`✅ Found ${businesses.length} verified custom domain(s):\n`);

  // Display domains to be synced
  businesses.forEach((business: BusinessAccount, index) => {
    console.log(`${index + 1}. ${business.custom_domain} (${business.business_name})`);
  });

  console.log('\n🔄 Starting sync process...\n');

  // Sync each domain
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const business of businesses as BusinessAccount[]) {
    const domain = business.custom_domain;
    console.log(`\n📍 Processing: ${domain} (${business.business_name})`);

    // Check if domain already exists in Vercel
    console.log(`   Checking Vercel status...`);
    const statusResult = await checkDomainStatus(domain);

    if (statusResult.success && statusResult.domain) {
      console.log(`   ℹ️  Domain already exists in Vercel (verified: ${statusResult.domain.verified})`);
      console.log(`   ⏭️  Skipping...`);
      skipCount++;
      continue;
    }

    // Add domain to Vercel
    console.log(`   Adding to Vercel...`);
    const addResult = await addDomainToVercel(domain);

    if (addResult.success) {
      console.log(`   ✅ Successfully added to Vercel`);
      successCount++;
    } else {
      console.log(`   ❌ Failed to add: ${addResult.error}`);
      if (addResult.code) {
        console.log(`   Error code: ${addResult.code}`);
      }
      errorCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SYNC SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total domains processed: ${businesses.length}`);
  console.log(`✅ Successfully added:   ${successCount}`);
  console.log(`⏭️  Skipped (existing):  ${skipCount}`);
  console.log(`❌ Failed:               ${errorCount}`);
  console.log('='.repeat(60));

  if (errorCount > 0) {
    console.log('\n⚠️  Some domains failed to sync. Check error messages above.');
    process.exit(1);
  } else {
    console.log('\n✅ All domains synced successfully!');
    process.exit(0);
  }
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
