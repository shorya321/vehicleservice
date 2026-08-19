/**
 * Create (or remove) a throwaway business tenant for manual QA.
 *
 * Deliberately does NOT go through POST /api/business/auth/signup. That route is
 * correct for real registrations, but it creates the account as `pending` and
 * fires two emails - a welcome mail to the address given, and a registration
 * notification to the platform admin. Neither is wanted for a fake tenant, and
 * the pending status blocks login until someone approves it in the admin UI.
 *
 * So this writes the three rows a working business login actually needs, with
 * status already `active`:
 *
 *   1. auth.users        - via the admin API, email pre-confirmed. The
 *                          handle_new_user trigger reads user_type from the
 *                          metadata and creates profiles with role='business'.
 *   2. business_accounts - status 'active'; 'pending' (the column default) is
 *                          rejected by both proxy.ts and the login route.
 *   3. business_users    - role 'owner'; the column defaults to 'staff', which
 *                          cannot open Settings -> Branding at all.
 *
 * Usage:
 *   npx tsx scripts/create-test-business.ts
 *   npx tsx scripts/create-test-business.ts --delete
 *
 * Then sign in at http://localhost:3001/business/login. The main host needs no
 * subdomain - proxy.ts only enforces domain ownership on tenant hosts.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

/**
 * Note the name: isValidSubdomain in lib/business/domain-utils.ts treats "test"
 * and "demo" as reserved labels, so a business literally called "Test Co" cannot
 * exist. "QA Brand Lab" generates the subdomain below.
 */
const BUSINESS_NAME = 'QA Brand Lab'
const SUBDOMAIN = 'qa-brand-lab'
const EMAIL = 'qa.brandlab@example.com'
const PASSWORD = 'QaBrandLab!2026'
const CONTACT_NAME = 'QA Brand Lab Owner'
const PHONE = '+971500000000'

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Find the auth user for EMAIL, or null. The admin API has no getByEmail. */
async function findAuthUserId(
  supabase: ReturnType<typeof client>
): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (error) throw new Error(`Failed to list auth users: ${error.message}`)

  const match = data.users.find((user) => user.email === EMAIL)
  return match?.id ?? null
}

async function create(): Promise<void> {
  const supabase = client()

  // Refuse to run against a subdomain or email that is not ours. Two real
  // tenants live in this database and neither may be touched.
  const { data: clash } = await supabase
    .from('business_accounts')
    .select('id, business_name, subdomain, business_email')
    .or(`subdomain.eq.${SUBDOMAIN},business_email.eq.${EMAIL}`)
    .maybeSingle()

  if (clash) {
    console.log(`Test tenant already exists: ${clash.business_name} (${clash.id})`)
    console.log(`Sign in at http://localhost:3001/business/login`)
    console.log(`  email:    ${EMAIL}`)
    console.log(`  password: ${PASSWORD}`)
    return
  }

  let authUserId = await findAuthUserId(supabase)

  if (authUserId) {
    console.log(`Reusing existing auth user ${authUserId}`)
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        business_name: BUSINESS_NAME,
        contact_person_name: CONTACT_NAME,
        user_type: 'business',
      },
    })

    if (error || !data.user) {
      throw new Error(`Failed to create auth user: ${error?.message}`)
    }

    authUserId = data.user.id
    console.log(`Created auth user ${authUserId}`)
  }

  const { data: account, error: accountError } = await supabase
    .from('business_accounts')
    .insert({
      business_name: BUSINESS_NAME,
      business_email: EMAIL,
      business_phone: PHONE,
      contact_person_name: CONTACT_NAME,
      subdomain: SUBDOMAIN,
      country_code: 'AE',
      status: 'active',
    })
    .select('id')
    .single()

  if (accountError || !account) {
    // Leave no orphaned auth user behind.
    await supabase.auth.admin.deleteUser(authUserId)
    throw new Error(`Failed to create business account: ${accountError?.message}`)
  }

  console.log(`Created business_accounts row ${account.id}`)

  const { error: memberError } = await supabase.from('business_users').insert({
    business_account_id: account.id,
    auth_user_id: authUserId,
    role: 'owner',
    is_active: true,
    email: EMAIL,
    full_name: CONTACT_NAME,
  })

  if (memberError) {
    await supabase.from('business_accounts').delete().eq('id', account.id)
    await supabase.auth.admin.deleteUser(authUserId)
    throw new Error(`Failed to create business user: ${memberError.message}`)
  }

  console.log('Created business_users row (owner)')
  console.log('')
  console.log('Sign in at http://localhost:3001/business/login')
  console.log(`  email:    ${EMAIL}`)
  console.log(`  password: ${PASSWORD}`)
}

async function remove(): Promise<void> {
  const supabase = client()

  const { data: account } = await supabase
    .from('business_accounts')
    .select('id, business_name')
    .eq('subdomain', SUBDOMAIN)
    .maybeSingle()

  if (account) {
    // Belt and braces: only ever delete the row this script created.
    if (account.business_name !== BUSINESS_NAME) {
      throw new Error(
        `Refusing to delete: subdomain ${SUBDOMAIN} belongs to "${account.business_name}"`
      )
    }

    await supabase.from('business_users').delete().eq('business_account_id', account.id)
    await supabase.from('business_accounts').delete().eq('id', account.id)
    console.log(`Deleted business account ${account.id}`)
  } else {
    console.log('No test business account found')
  }

  const authUserId = await findAuthUserId(supabase)
  if (authUserId) {
    await supabase.auth.admin.deleteUser(authUserId)
    console.log(`Deleted auth user ${authUserId}`)
  }
}

const shouldDelete = process.argv.includes('--delete')

;(shouldDelete ? remove() : create()).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
