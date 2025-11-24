# Custom Domain Automation Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable automated multi-tenant custom domain management by creating the missing RPC function and implementing Vercel API integration.

**Architecture:** The existing custom domain UI and DNS verification work correctly, but the system is missing two critical pieces: (1) a database RPC function that the middleware calls to identify which business owns a custom domain, and (2) Vercel API integration to automatically add verified domains to the Vercel project. This plan implements both missing pieces to complete the feature.

**Tech Stack:** Next.js 14.2.33 (App Router), TypeScript, Supabase (PostgreSQL + RPC), Vercel SDK, Node.js DNS module

---

## Root Cause Analysis

### Investigation Summary
- **Middleware calls** `supabase.rpc('get_business_by_custom_domain')` at line 50
- **Function does NOT exist** in any migration file (searched all 95 migrations)
- **Vercel integration missing** - only TODO comment at `app/api/business/domain/verify/route.ts:99`
- **Result:** Custom domains verified in database but never added to Vercel → 404 DEPLOYMENT_NOT_FOUND

### What Exists
✅ Database tables (`business_accounts` with custom_domain columns)
✅ Domain configuration UI (`app/business/(portal)/domain/`)
✅ DNS verification API (`app/api/business/domain/verify/route.ts`)
✅ Domain utilities (`lib/business/domain-utils.ts`)
✅ Route isolation middleware logic

### What's Missing
❌ RPC function `get_business_by_custom_domain`
❌ Vercel API integration (`lib/vercel/api.ts`)
❌ Environment variables (VERCEL_TOKEN, VERCEL_PROJECT_ID)
❌ Domain sync utility for existing verified domains

---

## Implementation Tasks

### Task 1: Create RPC Function Migration

**Files:**
- Create: `supabase/migrations/$(date +%Y%m%d%H%M%S)_create_get_business_by_custom_domain.sql`

**Step 1: Write the migration SQL**

```sql
-- Create RPC function to lookup business by custom domain
-- Called by middleware to identify business from incoming hostname

CREATE OR REPLACE FUNCTION get_business_by_custom_domain(p_domain TEXT)
RETURNS TABLE (
  id UUID,
  subdomain TEXT,
  custom_domain TEXT,
  business_name TEXT,
  brand_name TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ba.id,
    ba.subdomain,
    ba.custom_domain,
    ba.business_name,
    ba.brand_name,
    ba.logo_url,
    ba.primary_color,
    ba.secondary_color,
    ba.accent_color
  FROM business_accounts ba
  WHERE ba.custom_domain = p_domain
    AND ba.custom_domain_verified = true
    AND ba.status = 'active'
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION get_business_by_custom_domain IS
  'Lookup business details by custom domain for middleware routing';
```

**Step 2: Apply migration to Supabase**

Run:
```bash
node scripts/run-migration.ts
```

Expected: Migration applied successfully

**Step 3: Test the function in Supabase SQL Editor**

```sql
-- Insert test data
INSERT INTO business_accounts (
  id, subdomain, custom_domain, custom_domain_verified,
  business_name, brand_name, status
) VALUES (
  gen_random_uuid(),
  'test-business',
  'test.infiniatransfers.com',
  true,
  'Test Business',
  'Test Brand',
  'active'
) ON CONFLICT (subdomain) DO NOTHING;

-- Test the function
SELECT * FROM get_business_by_custom_domain('test.infiniatransfers.com');
```

Expected: Returns business details with id, subdomain, custom_domain, business_name, etc.

**Step 4: Commit**

```bash
git add supabase/migrations/*_create_get_business_by_custom_domain.sql
git commit -m "feat: add get_business_by_custom_domain RPC function

- Creates SECURITY DEFINER function for middleware use
- Returns business details for verified custom domains
- Filters by custom_domain_verified = true AND status = 'active'
- Fixes middleware crash at line 50

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Create Vercel API Utilities

**Files:**
- Create: `lib/vercel/api.ts`

**Step 1: Write Vercel API utility functions**

```typescript
/**
 * Vercel Domain Management API
 *
 * Automates adding/removing business custom domains to/from Vercel project.
 * Requires VERCEL_TOKEN and VERCEL_PROJECT_ID environment variables.
 */

const VERCEL_API_BASE = 'https://api.vercel.com'
const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID // Optional

interface VercelDomainResponse {
  name: string
  verified: boolean
  verification?: Array<{
    type: string
    domain: string
    value: string
    reason: string
  }>
}

interface DomainResult {
  success: boolean
  error?: string
  data?: VercelDomainResponse
}

/**
 * Add a domain to the Vercel project
 *
 * @param domain - The custom domain to add (e.g., 'transfers.acmehotel.com')
 * @returns Success status and domain details or error message
 */
export async function addDomainToVercel(domain: string): Promise<DomainResult> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return {
      success: false,
      error: 'Missing Vercel configuration (VERCEL_TOKEN or VERCEL_PROJECT_ID)'
    }
  }

  try {
    const url = `${VERCEL_API_BASE}/v9/projects/${VERCEL_PROJECT_ID}/domains`
    const params = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''

    const response = await fetch(`${url}${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.error?.message || `Vercel API error: ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error adding domain',
    }
  }
}

/**
 * Remove a domain from the Vercel project
 *
 * @param domain - The custom domain to remove
 * @returns Success status or error message
 */
export async function removeDomainFromVercel(domain: string): Promise<DomainResult> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return {
      success: false,
      error: 'Missing Vercel configuration (VERCEL_TOKEN or VERCEL_PROJECT_ID)'
    }
  }

  try {
    const url = `${VERCEL_API_BASE}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`
    const params = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''

    const response = await fetch(`${url}${params}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    })

    if (!response.ok && response.status !== 404) {
      const error = await response.json()
      return {
        success: false,
        error: error.error?.message || `Vercel API error: ${response.status}`,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error removing domain',
    }
  }
}

/**
 * Check domain status in Vercel
 *
 * @param domain - The domain to check
 * @returns Domain details including verification status
 */
export async function checkDomainStatus(domain: string): Promise<DomainResult> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return {
      success: false,
      error: 'Missing Vercel configuration (VERCEL_TOKEN or VERCEL_PROJECT_ID)'
    }
  }

  try {
    const url = `${VERCEL_API_BASE}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`
    const params = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''

    const response = await fetch(`${url}${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: 'Domain not found in Vercel project',
        }
      }
      const error = await response.json()
      return {
        success: false,
        error: error.error?.message || `Vercel API error: ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error checking domain',
    }
  }
}
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add lib/vercel/api.ts
git commit -m "feat: add Vercel domain management API utilities

- addDomainToVercel: POST /v9/projects/:id/domains
- removeDomainFromVercel: DELETE /v9/projects/:id/domains/:domain
- checkDomainStatus: GET domain details from Vercel
- Uses VERCEL_TOKEN and VERCEL_PROJECT_ID from env
- Supports team IDs for Vercel teams

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Update Verify Endpoint - Add Vercel Integration

**Files:**
- Modify: `app/api/business/domain/verify/route.ts:99`

**Step 1: Import Vercel utilities**

Add at top of file:
```typescript
import { addDomainToVercel } from '@/lib/vercel/api'
```

**Step 2: Replace TODO comment with Vercel integration**

Find line 99 (TODO comment) and replace with:

```typescript
      // Add domain to Vercel project via API
      console.log('Adding domain to Vercel:', domain)
      const vercelResult = await addDomainToVercel(domain)

      if (!vercelResult.success) {
        console.error('Failed to add domain to Vercel:', vercelResult.error)
        return NextResponse.json({
          verified: false,
          cnameValid,
          txtValid,
          error: 'DNS records verified but failed to configure domain in Vercel',
          details: vercelResult.error
        }, { status: 500 })
      }

      console.log('Domain added to Vercel successfully:', vercelResult.data)
```

**Step 3: Test compilation**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add app/api/business/domain/verify/route.ts
git commit -m "feat: integrate Vercel domain addition in verify endpoint

- Replace TODO comment with actual Vercel API integration
- Add domain to Vercel after DNS verification succeeds
- Return detailed error if Vercel API fails
- Log success/failure for debugging

Fixes: #[LINEAR-ISSUE-ID]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Update Delete Endpoint - Add Vercel Cleanup

**Files:**
- Modify: `app/api/business/domain/route.ts` (DELETE handler)

**Step 1: Import Vercel utilities**

Add at top of file:
```typescript
import { removeDomainFromVercel } from '@/lib/vercel/api'
```

**Step 2: Add Vercel cleanup before database removal**

Find the DELETE handler and add cleanup logic:

```typescript
// DELETE /api/business/domain - Remove custom domain
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business user with current domain
    const { data: businessUser, error: businessError } = await supabase
      .from('business_users')
      .select('business_id, business_accounts(custom_domain)')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError || !businessUser) {
      return NextResponse.json({ error: 'Business user not found' }, { status: 404 })
    }

    const currentDomain = businessUser.business_accounts?.custom_domain

    // Remove domain from Vercel if it exists
    if (currentDomain) {
      console.log('Removing domain from Vercel:', currentDomain)
      const vercelResult = await removeDomainFromVercel(currentDomain)

      if (!vercelResult.success) {
        console.error('Failed to remove domain from Vercel:', vercelResult.error)
        // Continue anyway - clean up database even if Vercel fails
      } else {
        console.log('Domain removed from Vercel successfully')
      }
    }

    // Remove from database (existing code continues here...)
    const adminClient = createAdminClient()
    const { error: updateError } = await adminClient
      .from('business_accounts')
      .update({
        custom_domain: null,
        custom_domain_verified: false,
        custom_domain_verified_at: null,
        domain_verification_token: null,
      })
      .eq('id', businessUser.business_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing custom domain:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 3: Test compilation**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add app/api/business/domain/route.ts
git commit -m "feat: add Vercel cleanup to domain deletion

- Remove domain from Vercel before database cleanup
- Continue database cleanup even if Vercel removal fails
- Log Vercel API results for debugging

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Update .env.example with Vercel Variables

**Files:**
- Modify: `.env.example` (create if doesn't exist)

**Step 1: Add Vercel configuration section**

```bash
# Vercel Domain Management (Required for custom domain automation)
VERCEL_TOKEN=your_vercel_api_token_here
VERCEL_PROJECT_ID=your_project_id_here
VERCEL_TEAM_ID=your_team_id_here_optional

# Platform Configuration
NEXT_PUBLIC_SITE_URL=https://test.infiniatransfers.com
```

**Step 2: Add instructions comment**

```bash
# How to get Vercel credentials:
# 1. VERCEL_TOKEN: Vercel Dashboard → Settings → Tokens → Create Token
# 2. VERCEL_PROJECT_ID: Vercel Dashboard → Project Settings → General
# 3. VERCEL_TEAM_ID: Only needed if using Vercel Teams
# 4. NEXT_PUBLIC_SITE_URL: Your main platform domain
```

**Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add Vercel environment variables to .env.example

- VERCEL_TOKEN for API authentication
- VERCEL_PROJECT_ID for domain management
- VERCEL_TEAM_ID for team accounts (optional)
- NEXT_PUBLIC_SITE_URL for platform domain
- Include setup instructions in comments

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Create Domain Sync Utility

**Files:**
- Create: `scripts/sync-verified-domains-to-vercel.ts`

**Step 1: Write sync utility script**

```typescript
/**
 * One-time utility to sync existing verified custom domains to Vercel
 *
 * Run this after implementing Vercel integration to add any domains
 * that were verified in the database but never added to Vercel.
 *
 * Usage: npx tsx scripts/sync-verified-domains-to-vercel.ts
 */

import { createClient } from '@supabase/supabase-js'
import { addDomainToVercel, checkDomainStatus } from '../lib/vercel/api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function syncDomainsToVercel() {
  console.log('🔄 Starting domain sync to Vercel...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get all verified custom domains
  const { data: accounts, error } = await supabase
    .from('business_accounts')
    .select('id, business_name, custom_domain, custom_domain_verified')
    .not('custom_domain', 'is', null)
    .eq('custom_domain_verified', true)
    .eq('status', 'active')

  if (error) {
    console.error('❌ Error fetching business accounts:', error)
    process.exit(1)
  }

  if (!accounts || accounts.length === 0) {
    console.log('✅ No verified custom domains found. Nothing to sync.')
    process.exit(0)
  }

  console.log(`Found ${accounts.length} verified custom domain(s):\n`)

  let added = 0
  let alreadyExists = 0
  let failed = 0

  for (const account of accounts) {
    const domain = account.custom_domain
    console.log(`\n📍 Processing: ${domain} (${account.business_name})`)

    // Check if already in Vercel
    const statusResult = await checkDomainStatus(domain)

    if (statusResult.success) {
      console.log(`   ✓ Already in Vercel - skipping`)
      alreadyExists++
      continue
    }

    // Add to Vercel
    console.log(`   → Adding to Vercel...`)
    const addResult = await addDomainToVercel(domain)

    if (addResult.success) {
      console.log(`   ✓ Successfully added to Vercel`)
      added++
    } else {
      console.log(`   ✗ Failed: ${addResult.error}`)
      failed++
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Sync Summary:')
  console.log(`   • Total domains: ${accounts.length}`)
  console.log(`   • Added to Vercel: ${added}`)
  console.log(`   • Already in Vercel: ${alreadyExists}`)
  console.log(`   • Failed: ${failed}`)
  console.log('='.repeat(60) + '\n')

  if (failed > 0) {
    console.log('⚠️  Some domains failed to sync. Check Vercel credentials and try again.')
    process.exit(1)
  } else {
    console.log('✅ Domain sync completed successfully!')
    process.exit(0)
  }
}

// Run the sync
syncDomainsToVercel().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
```

**Step 2: Test script runs**

Run:
```bash
npx tsx scripts/sync-verified-domains-to-vercel.ts
```

Expected: Script executes (may fail if env vars not set yet - that's okay)

**Step 3: Commit**

```bash
git add scripts/sync-verified-domains-to-vercel.ts
git commit -m "feat: add utility to sync verified domains to Vercel

- One-time migration script for existing verified domains
- Checks Vercel status before adding (skip duplicates)
- Provides detailed progress and summary
- Run with: npx tsx scripts/sync-verified-domains-to-vercel.ts

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Configure Vercel Environment Variables

**Manual Step - Vercel Dashboard**

**Step 1: Get Vercel API Token**

1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: "Custom Domain Management"
4. Scope: Full Account
5. Copy the token

**Step 2: Get Project ID**

1. Go to your Vercel project dashboard
2. Settings → General
3. Copy "Project ID"

**Step 3: Add to Vercel**

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add for **Production** environment:
   - `VERCEL_TOKEN` = [your token]
   - `VERCEL_PROJECT_ID` = [your project id]
   - `NEXT_PUBLIC_SITE_URL` = `https://test.infiniatransfers.com`

3. Add all existing env vars from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `ADMIN_NOTIFICATION_EMAIL`
   - `STRIPE_WEBHOOK_SECRET`

**Step 4: Verify in Vercel**

Expected: All variables show in Production environment

---

### Task 8: Deploy to Vercel

**Step 1: Push to Git**

```bash
git push origin main
```

**Step 2: Monitor Vercel Deployment**

- Vercel auto-deploys on push to main
- Watch deployment in Vercel dashboard
- Wait for "Ready" status

Expected: Deployment succeeds

**Step 3: Check deployment logs**

Look for any errors in deployment logs

Expected: No errors, deployment successful

---

### Task 9: Run Domain Sync Script

**Step 1: Set local environment variables**

Add to `.env.local`:
```bash
VERCEL_TOKEN=your_token_from_vercel
VERCEL_PROJECT_ID=your_project_id
```

**Step 2: Run sync script**

```bash
npx tsx scripts/sync-verified-domains-to-vercel.ts
```

Expected: Script adds `test.infiniatransfers.com` to Vercel (if it's in database as verified)

**Step 3: Verify in Vercel Dashboard**

Go to Vercel → Your Project → Settings → Domains

Expected: `test.infiniatransfers.com` appears in domains list

---

### Task 10: Test Complete Flow - New Domain

**Step 1: Create test business account**

Via Supabase SQL Editor:
```sql
INSERT INTO business_accounts (
  subdomain, business_name, status
) VALUES (
  'test-flow', 'Test Flow Business', 'active'
) RETURNING id;
```

**Step 2: Configure custom domain in app**

1. Login as business user
2. Navigate to `/business/domain`
3. Enter custom domain: `flow-test.yourdomain.com`
4. Click "Set Custom Domain"

Expected: Domain saved, verification token generated

**Step 3: Configure DNS (in your registrar)**

Add records:
- CNAME: `flow-test.yourdomain.com` → `cname.vercel-dns.com`
- TXT: `_verify.flow-test.yourdomain.com` → [verification token from UI]

**Step 4: Verify DNS in app**

Click "Verify DNS Configuration"

Expected:
- DNS records verified ✅
- Domain added to Vercel ✅
- Domain marked as verified in database ✅

**Step 5: Visit custom domain**

Open: `https://flow-test.yourdomain.com`

Expected: Site loads, redirects to `/business/login` or `/business/dashboard`

---

### Task 11: Test Middleware Recognition

**Step 1: Visit custom domain**

Open: `https://test.infiniatransfers.com`

**Step 2: Check browser console**

Expected: No RPC errors (previously would crash)

**Step 3: Verify branding headers**

Open DevTools → Network → Pick any request → Response Headers

Expected headers:
```
x-business-id: [uuid]
x-business-name: [business name]
x-custom-domain: true
x-primary-color: #3b82f6
```

**Step 4: Test route isolation**

Try accessing: `https://test.infiniatransfers.com/admin`

Expected: Redirect to `/business/dashboard` or `/business/login` (admin routes blocked)

---

### Task 12: Test Domain Removal

**Step 1: Delete custom domain in app**

1. Login as business user
2. Navigate to `/business/domain`
3. Click "Remove Custom Domain"

Expected: Confirmation prompt

**Step 2: Confirm deletion**

Expected:
- Domain removed from Vercel ✅
- Domain removed from database ✅
- Subdomain still works

**Step 3: Verify in Vercel Dashboard**

Vercel → Settings → Domains

Expected: Custom domain no longer in list

**Step 4: Visit removed domain**

Open: `https://test.infiniatransfers.com`

Expected: 404 (Vercel doesn't recognize domain anymore)

---

### Task 13: Final Integration Test

**Step 1: Test end-to-end with real business**

1. Business owner signs up
2. Configures custom domain
3. Adds DNS records
4. Verifies DNS
5. Domain works immediately

**Step 2: Verify scalability**

Configure 2-3 more test domains to ensure system handles multiple businesses

Expected: Each domain routes to correct business

**Step 3: Check logs for errors**

Vercel → Logs, Supabase → Logs

Expected: No errors related to custom domains

---

## Environment Variables Required

### Local Development (.env.local)
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3001
VERCEL_TOKEN=your_token
VERCEL_PROJECT_ID=your_project_id
# ... existing vars
```

### Vercel Production
```bash
NEXT_PUBLIC_SITE_URL=https://test.infiniatransfers.com
VERCEL_TOKEN=your_token
VERCEL_PROJECT_ID=your_project_id
VERCEL_TEAM_ID=your_team_id (optional)
# ... all existing vars from .env.local
```

---

## Rollback Plan

If issues occur:

1. **Revert Vercel integration:**
   ```bash
   git revert HEAD~3  # Revert last 3 commits
   git push origin main
   ```

2. **Remove domains from Vercel manually:**
   - Vercel Dashboard → Settings → Domains → Delete each

3. **Keep RPC function:**
   - The RPC function is safe to keep (doesn't break anything)

---

## Success Criteria

✅ RPC function exists and middleware can call it
✅ Custom domains automatically added to Vercel after DNS verification
✅ Custom domains automatically removed from Vercel on deletion
✅ Middleware correctly identifies business from custom domain
✅ Route isolation works (only `/business/*` accessible)
✅ Business branding headers injected correctly
✅ Multiple businesses can use custom domains simultaneously
✅ No manual Vercel configuration needed per domain

---

## Estimated Time

- Setup & RPC function: 30 minutes
- Vercel integration: 45 minutes
- Testing & verification: 30 minutes
- **Total: ~2 hours**

---

## Notes

- The existing UI and DNS verification code is solid - we're just connecting the final pieces
- Vercel API is rate-limited (be mindful if syncing many domains)
- DNS propagation can take 24-48 hours (CNAME records)
- TXT records typically propagate within minutes
- Test with a domain you control before using production domains
