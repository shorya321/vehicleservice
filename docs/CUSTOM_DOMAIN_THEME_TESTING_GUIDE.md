# Custom Domain & Theme Testing Guide

**Project**: VIK-29 Business Wallet Enhancement - White-labeling Module
**Date**: November 7, 2025
**Status**: Ready for Testing
**Purpose**: Comprehensive testing guide for custom domain identification and dynamic theme application

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture Verification](#architecture-verification)
4. [Test 1: Database Schema Verification](#test-1-database-schema-verification)
5. [Test 2: RPC Function Testing](#test-2-rpc-function-testing)
6. [Test 3: Custom Domain Setup](#test-3-custom-domain-setup)
7. [Test 4: DNS Configuration](#test-4-dns-configuration)
8. [Test 5: Domain Verification](#test-5-domain-verification)
9. [Test 6: Middleware Domain Identification](#test-6-middleware-domain-identification)
10. [Test 7: Theme Injection](#test-7-theme-injection)
11. [Test 8: Logo Upload & Display](#test-8-logo-upload--display)
12. [Test 9: Cross-Domain Testing](#test-9-cross-domain-testing)
13. [Test 10: Subdomain Fallback](#test-10-subdomain-fallback)
14. [Troubleshooting](#troubleshooting)
15. [Production Checklist](#production-checklist)

---

## Overview

The white-labeling module allows business accounts to:
- Configure custom domains (e.g., `transfers.acmehotel.com`)
- Customize branding (logo, colors, brand name)
- Provide branded experience to their customers
- Maintain separate brand identity while using platform services

### Key Components

1. **Database**: `business_accounts` table with branding columns
2. **RPC Function**: `get_business_by_custom_domain()` for domain lookup
3. **Middleware**: Domain identification and header injection (middleware.ts:39-77)
4. **Business Portal**: Domain configuration UI
5. **DNS**: CNAME records pointing custom domains to platform

---

## Prerequisites

### Required Access

- [ ] Admin access to platform
- [ ] Business account login credentials
- [ ] DNS management access for test domain
- [ ] Database query access (Supabase)

### Test Domain

**Option 1: Use a test subdomain**
- Example: `test.yourdomain.com`
- Requires: CNAME record to platform domain

**Option 2: Use localhost with hosts file**
- Example: `acme.local`
- Requires: Modifying `/etc/hosts` file
- Note: DNS verification will not work

### Environment Configuration

Verify environment variables:
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3001  # Platform URL
NEXT_PUBLIC_APP_URL=http://localhost:3001   # App URL
```

---

## Architecture Verification

### System Flow

```
Custom Domain Request
        ↓
Middleware (domain identification)
        ↓
RPC: get_business_by_custom_domain()
        ↓
Database Lookup (business_accounts)
        ↓
Inject Headers (x-business-id, x-primary-color, etc.)
        ↓
Layout/Components Read Headers
        ↓
Apply Dynamic Theme
```

### Files Involved

| File | Purpose |
|------|---------|
| `middleware.ts:39-77` | Domain identification & header injection |
| `supabase/migrations/20250103_create_business_accounts.sql` | Database schema |
| `app/business/(portal)/domain/page.tsx` | Domain configuration UI |
| `app/api/business/domain/route.ts` | Domain CRUD API |
| `app/api/business/domain/verify/route.ts` | DNS verification API |
| `app/layout.tsx` | Theme application from headers |

---

## Test 1: Database Schema Verification

**Objective**: Verify all required columns exist in `business_accounts` table

### Step 1.1: Check Branding Columns

**Query**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'business_accounts'
  AND column_name IN (
    'brand_name',
    'logo_url',
    'primary_color',
    'secondary_color',
    'accent_color',
    'custom_domain',
    'custom_domain_verified',
    'custom_domain_verified_at',
    'domain_verification_token'
  )
ORDER BY column_name;
```

**Expected Results**:
```
✅ accent_color         | character varying | YES
✅ brand_name          | text             | YES
✅ custom_domain       | text             | YES
✅ custom_domain_verified | boolean       | YES
✅ custom_domain_verified_at | timestamptz | YES
✅ domain_verification_token | text       | YES
✅ logo_url            | text             | YES
✅ primary_color       | character varying | YES
✅ secondary_color     | character varying | YES
```

**Status**: ✅ **VERIFIED** - All columns exist

### Step 1.2: Check Indexes

**Query**:
```sql
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'business_accounts'
  AND indexname LIKE '%domain%';
```

**Expected Results**:
```
✅ idx_business_accounts_custom_domain
   CREATE INDEX ... ON business_accounts(custom_domain) WHERE custom_domain IS NOT NULL
```

### Step 1.3: Check Constraints

**Query**:
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'business_accounts'
  AND constraint_name LIKE '%domain%';
```

**Expected Results**:
```
✅ business_accounts_custom_domain_key | UNIQUE
```

---

## Test 2: RPC Function Testing

**Objective**: Verify `get_business_by_custom_domain()` function works correctly

### Step 2.1: Verify Function Exists

**Query**:
```sql
SELECT
  proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname = 'get_business_by_custom_domain'
  AND n.nspname = 'public';
```

**Expected Results**:
```
✅ function_name: get_business_by_custom_domain
✅ arguments: p_domain text
✅ return_type: SETOF record
```

**Status**: ✅ **VERIFIED** - Function exists

### Step 2.2: Test Function with Mock Data

**Setup - Create Test Business**:
```sql
-- Create test business account
INSERT INTO business_accounts (
  business_name,
  business_email,
  subdomain,
  custom_domain,
  custom_domain_verified,
  brand_name,
  logo_url,
  primary_color,
  secondary_color,
  accent_color,
  status
) VALUES (
  'Acme Hotel',
  'contact@acmehotel.test',
  'acme',
  'transfers.acmehotel.test',
  true,  -- Verified for testing
  'Acme Transfers',
  'https://example.com/logo.png',
  '#FF6B35',  -- Orange
  '#004E89',  -- Blue
  '#F77F00',  -- Amber
  'active'
) RETURNING id, business_name, custom_domain;
```

**Test Function Call**:
```sql
SELECT * FROM get_business_by_custom_domain('transfers.acmehotel.test');
```

**Expected Results**:
```
✅ Returns 1 row
✅ business_name: Acme Hotel
✅ brand_name: Acme Transfers
✅ custom_domain: transfers.acmehotel.test
✅ custom_domain_verified: true
✅ primary_color: #FF6B35
✅ secondary_color: #004E89
✅ accent_color: #F77F00
```

### Step 2.3: Test Non-Existent Domain

**Query**:
```sql
SELECT * FROM get_business_by_custom_domain('nonexistent.domain.test');
```

**Expected Results**:
```
✅ Returns 0 rows (empty result set)
```

### Step 2.4: Test Unverified Domain

**Setup - Create Unverified Domain**:
```sql
INSERT INTO business_accounts (
  business_name,
  business_email,
  subdomain,
  custom_domain,
  custom_domain_verified,
  status
) VALUES (
  'Pending Hotel',
  'contact@pendinghotel.test',
  'pending',
  'transfers.pendinghotel.test',
  false,  -- NOT verified
  'active'
) RETURNING id;
```

**Test**:
```sql
SELECT * FROM get_business_by_custom_domain('transfers.pendinghotel.test');
```

**Expected Results**:
```
✅ Returns 0 rows (unverified domains not returned)
```

### Step 2.5: Test Inactive Business

**Setup - Create Inactive Business**:
```sql
INSERT INTO business_accounts (
  business_name,
  business_email,
  subdomain,
  custom_domain,
  custom_domain_verified,
  status
) VALUES (
  'Inactive Hotel',
  'contact@inactivehotel.test',
  'inactive',
  'transfers.inactivehotel.test',
  true,
  'inactive'  -- NOT active
) RETURNING id;
```

**Test**:
```sql
SELECT * FROM get_business_by_custom_domain('transfers.inactivehotel.test');
```

**Expected Results**:
```
✅ Returns 0 rows (inactive businesses not returned)
```

---

## Test 3: Custom Domain Setup

**Objective**: Configure custom domain for a business account

### Step 3.1: Access Domain Configuration Page

1. **Login to Business Portal**:
   ```
   URL: http://localhost:3001/business/login
   Credentials: Use test business account
   ```

2. **Navigate to Domain Settings**:
   ```
   URL: http://localhost:3001/business/domain
   ```

**Expected Results**:
- ✅ Page loads successfully
- ✅ Shows current subdomain (e.g., `acme.yourdomain.com`)
- ✅ Shows custom domain configuration form
- ✅ Shows DNS instructions

**Screenshot**: Save screenshot of domain configuration page

### Step 3.2: Configure Custom Domain

1. **Enter Custom Domain**:
   - Input: `transfers.acmehotel.test`
   - Click "Save Domain"

2. **Verify Domain Saved**:

**Query**:
```sql
SELECT
  business_name,
  custom_domain,
  custom_domain_verified,
  domain_verification_token
FROM business_accounts
WHERE id = 'YOUR_BUSINESS_ID';
```

**Expected Results**:
```
✅ custom_domain: transfers.acmehotel.test
✅ custom_domain_verified: false
✅ domain_verification_token: [random-token]
```

**Screenshot**: Save screenshot showing saved domain

---

## Test 4: DNS Configuration

**Objective**: Configure DNS records for custom domain

### Step 4.1: DNS Record Requirements

For custom domain `transfers.acmehotel.test`:

**CNAME Record** (Required):
```
Type:  CNAME
Host:  transfers.acmehotel.test  (or just "transfers" if managing acmehotel.test)
Value: yourdomain.com  (platform domain)
TTL:   3600 (1 hour) or 300 (5 minutes for testing)
```

**TXT Record** (For verification):
```
Type:  TXT
Host:  _infinia-verification.transfers.acmehotel.test
Value: [verification-token from database]
TTL:   300 (5 minutes for faster verification)
```

### Step 4.2: Add DNS Records

**Using Cloudflare**:
1. Login to Cloudflare dashboard
2. Select domain `acmehotel.test`
3. Go to DNS → Records
4. Add CNAME record:
   - Type: CNAME
   - Name: transfers
   - Target: yourdomain.com
   - Proxy status: DNS only (gray cloud)
   - TTL: Auto
5. Add TXT record:
   - Type: TXT
   - Name: _infinia-verification.transfers
   - Content: [verification token]
   - TTL: Auto

**Using Other DNS Providers**:
- AWS Route 53: Create Record Set
- GoDaddy: DNS Management → Add Record
- Namecheap: Advanced DNS → Add New Record

### Step 4.3: Verify DNS Propagation

**Method 1: Using dig**:
```bash
# Check CNAME record
dig transfers.acmehotel.test CNAME +short

# Expected output:
yourdomain.com.

# Check TXT record
dig _infinia-verification.transfers.acmehotel.test TXT +short

# Expected output:
"your-verification-token"
```

**Method 2: Using nslookup**:
```bash
nslookup transfers.acmehotel.test

# Expected output includes:
# Non-authoritative answer:
# transfers.acmehotel.test canonical name = yourdomain.com
```

**Method 3: Online Tools**:
- https://dnschecker.org/
- https://www.whatsmydns.net/
- Enter domain: `transfers.acmehotel.test`
- Check CNAME record globally

**Wait Time**: DNS propagation can take 5 minutes to 48 hours (usually < 1 hour)

---

## Test 5: Domain Verification

**Objective**: Verify custom domain ownership

### Step 5.1: Trigger Verification

**Via UI**:
1. Navigate to `/business/domain`
2. Click "Verify Domain" button
3. Wait for verification result

**Via API**:
```bash
curl -X POST http://localhost:3001/api/business/domain/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "domain": "transfers.acmehotel.test"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "verified": true,
  "message": "Domain verified successfully",
  "verified_at": "2025-11-07T10:30:00Z"
}
```

### Step 5.2: Verify in Database

**Query**:
```sql
SELECT
  custom_domain,
  custom_domain_verified,
  custom_domain_verified_at
FROM business_accounts
WHERE id = 'YOUR_BUSINESS_ID';
```

**Expected Results**:
```
✅ custom_domain_verified: true
✅ custom_domain_verified_at: 2025-11-07 10:30:00+00
```

### Step 5.3: Test Failed Verification

**Scenario**: DNS not configured correctly

1. Enter custom domain without DNS records
2. Click "Verify Domain"

**Expected Results**:
```
❌ Error: "DNS records not found. Please configure CNAME record."
✅ custom_domain_verified: false (remains false)
✅ User-friendly error message displayed
```

---

## Test 6: Middleware Domain Identification

**Objective**: Verify middleware correctly identifies custom domains

### Step 6.1: Test Custom Domain Request

**Prerequisites**:
- Custom domain verified (Test 5 complete)
- DNS configured and propagated

**Test Request**:
```bash
curl -v http://transfers.acmehotel.test:3001/ \
  -H "Host: transfers.acmehotel.test"
```

**Check Response Headers**:
```
✅ x-business-id: [business-uuid]
✅ x-business-name: Acme Hotel
✅ x-brand-name: Acme Transfers
✅ x-logo-url: https://example.com/logo.png
✅ x-primary-color: #FF6B35
✅ x-secondary-color: #004E89
✅ x-accent-color: #F77F00
✅ x-custom-domain: true
```

**Check Server Logs**:
```
✅ Log: "Custom domain identified: { hostname: 'transfers.acmehotel.test', businessId: '...', businessName: 'Acme Hotel' }"
```

### Step 6.2: Test Platform Domain Request

**Test Request**:
```bash
curl -v http://localhost:3001/ \
  -H "Host: localhost:3001"
```

**Check Response Headers**:
```
✅ NO x-business-id header (platform domain, not white-labeled)
✅ NO x-custom-domain header
```

### Step 6.3: Test Unverified Domain

**Test Request**:
```bash
curl -v http://transfers.pendinghotel.test:3001/ \
  -H "Host: transfers.pendinghotel.test"
```

**Check Response Headers**:
```
✅ NO x-business-id header (unverified domain)
✅ NO x-custom-domain header
```

**Check Server Logs**:
```
✅ Log: "Custom domain not verified: transfers.pendinghotel.test"
```

---

## Test 7: Theme Injection

**Objective**: Verify dynamic theme application based on business branding

### Step 7.1: Check Theme Variables in DOM

**Access Custom Domain**:
```
Browser: http://transfers.acmehotel.test:3001/
```

**Open DevTools** → Elements → `<html>` or `<body>` tag

**Expected CSS Variables** (injected in `<head>` or `<style>`):
```css
:root {
  --primary-color: #FF6B35;
  --secondary-color: #004E89;
  --accent-color: #F77F00;
}
```

**Verification Methods**:

**Method 1: Inspect Element**
1. Right-click any element
2. Inspect
3. Check Computed styles
4. Look for custom CSS variables

**Method 2: Console**
```javascript
getComputedStyle(document.documentElement).getPropertyValue('--primary-color')
// Expected: "#FF6B35" or "rgb(255, 107, 53)"
```

**Screenshot**: Save screenshot of CSS variables in DevTools

### Step 7.2: Verify Button Styles

**Find Primary Button**:
```
Example: "Book Now" button, "Submit" button
```

**Check Styles**:
```
✅ Background color matches primary_color (#FF6B35)
✅ Hover state uses secondary_color or darker shade
✅ Active state uses accent_color
```

**Screenshot**: Save screenshot of styled buttons

### Step 7.3: Verify Link Colors

**Check Navigation Links**:
```
✅ Links use primary_color (#FF6B35)
✅ Hover state changes color (secondary or accent)
```

### Step 7.4: Compare to Platform Theme

**Open Platform Domain**:
```
Browser: http://localhost:3001/
```

**Verify Default Theme**:
```
✅ Uses default colors (NOT business custom colors)
✅ Default primary: #3b82f6 (blue)
✅ No x-custom-domain header
```

---

## Test 8: Logo Upload & Display

**Objective**: Verify business logo upload and display on custom domain

### Step 8.1: Upload Logo

1. **Navigate to Branding Settings**:
   ```
   URL: http://localhost:3001/business/settings/branding
   ```

2. **Upload Logo**:
   - Click "Upload Logo" button
   - Select image file (PNG, JPG, SVG)
   - Max size: 2MB
   - Recommended: 200x60px or similar

3. **Verify Upload**:

**Query**:
```sql
SELECT logo_url FROM business_accounts WHERE id = 'YOUR_BUSINESS_ID';
```

**Expected Results**:
```
✅ logo_url: https://[supabase-url]/storage/v1/object/public/business-logos/[uuid].png
```

**Screenshot**: Save screenshot of uploaded logo in settings

### Step 8.2: Verify Logo Display on Custom Domain

**Access Custom Domain**:
```
Browser: http://transfers.acmehotel.test:3001/
```

**Check Header Logo**:
```
✅ Logo displays in header/navigation
✅ Image src matches logo_url from database
✅ Logo links to home page
✅ Alt text includes business name
```

**DevTools Verification**:
```html
<img
  src="https://[supabase-url]/storage/v1/object/public/business-logos/[uuid].png"
  alt="Acme Transfers Logo"
  class="..."
/>
```

**Screenshot**: Save screenshot of logo displayed on custom domain

### Step 8.3: Verify Logo NOT Displayed on Platform

**Access Platform Domain**:
```
Browser: http://localhost:3001/
```

**Check Header**:
```
✅ Platform logo displayed (NOT business logo)
✅ Platform branding maintained
```

---

## Test 9: Cross-Domain Testing

**Objective**: Verify isolation between different business custom domains

### Step 9.1: Create Second Test Business

**Query**:
```sql
INSERT INTO business_accounts (
  business_name,
  business_email,
  subdomain,
  custom_domain,
  custom_domain_verified,
  brand_name,
  logo_url,
  primary_color,
  secondary_color,
  accent_color,
  status
) VALUES (
  'Beta Resort',
  'contact@betaresort.test',
  'beta',
  'transfers.betaresort.test',
  true,
  'Beta Transfers',
  'https://example.com/beta-logo.png',
  '#10B981',  -- Green
  '#059669',  -- Dark Green
  '#34D399',  -- Light Green
  'active'
) RETURNING id, custom_domain;
```

### Step 9.2: Configure DNS for Second Domain

**Add DNS Records** (following Test 4 steps):
```
CNAME: transfers.betaresort.test → yourdomain.com
TXT: _infinia-verification.transfers.betaresort.test → [token]
```

### Step 9.3: Test Both Domains Simultaneously

**Open Two Browser Tabs**:

**Tab 1: Acme Hotel**
```
URL: http://transfers.acmehotel.test:3001/
Theme: Orange/Blue (#FF6B35, #004E89)
Logo: Acme logo
Brand: "Acme Transfers"
```

**Tab 2: Beta Resort**
```
URL: http://transfers.betaresort.test:3001/
Theme: Green (#10B981, #059669)
Logo: Beta logo
Brand: "Beta Transfers"
```

**Verification**:
```
✅ Each domain shows its own branding
✅ No cross-contamination of themes
✅ Cookies/sessions isolated
✅ Correct business context in each tab
```

**Screenshot**: Save side-by-side screenshots of both domains

---

## Test 10: Subdomain Fallback

**Objective**: Verify subdomain access works when custom domain not configured

### Step 10.1: Create Business Without Custom Domain

**Query**:
```sql
INSERT INTO business_accounts (
  business_name,
  business_email,
  subdomain,
  brand_name,
  primary_color,
  status
) VALUES (
  'Gamma Inn',
  'contact@gammainn.test',
  'gamma',
  'Gamma Transfers',
  '#8B5CF6',  -- Purple
  'active'
) RETURNING id, subdomain;
```

### Step 10.2: Access via Subdomain

**URL**:
```
http://gamma.yourdomain.com/
```

**Expected Results**:
```
✅ Page loads successfully
✅ Shows Gamma branding (purple theme)
✅ No custom domain configured
✅ Subdomain works as primary access method
```

**Note**: Subdomain functionality depends on platform DNS configuration (wildcard subdomain).

---

## Troubleshooting

### Issue 1: Custom Domain Not Identified

**Symptoms**:
- Custom domain accessed but platform theme shown
- No x-business-id header in response

**Possible Causes**:

1. **Domain Not Verified**:
   ```sql
   SELECT custom_domain_verified FROM business_accounts WHERE custom_domain = 'your.domain';
   -- Should return: true
   ```

2. **DNS Not Configured**:
   ```bash
   dig your.domain CNAME +short
   # Should return: platform-domain.com
   ```

3. **Middleware Not Running**:
   - Check server logs for middleware errors
   - Verify middleware.ts deployed correctly

4. **RPC Function Error**:
   ```sql
   -- Test function directly
   SELECT * FROM get_business_by_custom_domain('your.domain');
   ```

### Issue 2: Theme Not Applied

**Symptoms**:
- Custom domain identified (headers present)
- But default theme still shown

**Possible Causes**:

1. **CSS Variables Not Injected**:
   - Check browser DevTools → Elements → `<style>` tag
   - Should contain `:root { --primary-color: ...; }`

2. **Components Not Using CSS Variables**:
   - Components must use `var(--primary-color)` instead of hardcoded colors
   - Check component styles

3. **Cache Issue**:
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Clear browser cache
   - Clear Next.js cache: `rm -rf .next`

### Issue 3: Logo Not Displaying

**Symptoms**:
- Logo uploaded successfully
- But not showing on custom domain

**Possible Causes**:

1. **Storage URL Incorrect**:
   ```sql
   SELECT logo_url FROM business_accounts WHERE id = 'your-id';
   -- Should be: https://[supabase-url]/storage/v1/object/public/...
   ```

2. **CORS Issue**:
   - Check browser console for CORS errors
   - Verify Supabase storage CORS settings

3. **Image Not Public**:
   - Verify storage bucket is public
   - Check file permissions in Supabase storage

### Issue 4: DNS Verification Fails

**Symptoms**:
- DNS configured correctly
- But verification still fails

**Possible Causes**:

1. **DNS Not Propagated Yet**:
   - Wait 10-30 minutes
   - Check propagation: https://dnschecker.org/

2. **Verification Token Mismatch**:
   ```sql
   SELECT domain_verification_token FROM business_accounts WHERE id = 'your-id';
   -- Must match TXT record value exactly
   ```

3. **TTL Too High**:
   - DNS TTL > 1 hour delays changes
   - Temporarily set TTL to 300 seconds (5 minutes)

### Issue 5: Middleware Headers Not Set

**Symptoms**:
- RPC function returns correct data
- But middleware not setting headers

**Debugging**:

1. **Check Middleware Logs**:
   ```
   Look for: "Custom domain identified: ..."
   Or: "Custom domain not verified: ..."
   ```

2. **Verify Middleware Runs**:
   - Add console.log in middleware.ts:44
   - Restart dev server

3. **Check Host Header**:
   ```bash
   curl -v http://localhost:3001/ \
     -H "Host: your.custom.domain"
   # Must send correct Host header
   ```

---

## Production Checklist

Before deploying custom domain feature to production:

### Infrastructure

- [ ] Wildcard SSL certificate configured (`*.yourdomain.com`)
- [ ] DNS wildcard CNAME configured (`*.yourdomain.com → platform-domain`)
- [ ] CDN/Load balancer supports multiple domains
- [ ] Server can handle custom Host headers

### Database

- [ ] All migrations applied
- [ ] RPC function `get_business_by_custom_domain()` deployed
- [ ] Indexes on `custom_domain` column exist
- [ ] Unique constraint on `custom_domain` exists

### Application

- [ ] Middleware deployed and tested
- [ ] Environment variables set (`NEXT_PUBLIC_SITE_URL`)
- [ ] Theme injection logic working
- [ ] Logo upload/storage configured
- [ ] Domain verification API tested

### Security

- [ ] HTTPS enforced for all custom domains
- [ ] DNS verification required before activation
- [ ] Unverified domains return 404 or redirect
- [ ] No sensitive data leaked in custom domain requests
- [ ] CORS configured correctly

### Documentation

- [ ] User guide for custom domain setup
- [ ] DNS configuration instructions
- [ ] Branding guidelines (logo specs, color formats)
- [ ] Troubleshooting guide for users

### Monitoring

- [ ] Domain verification success/failure metrics
- [ ] Custom domain request logs
- [ ] Theme application errors tracked
- [ ] Logo load failures monitored

---

## Test Results Template

```markdown
# Custom Domain & Theme Testing Results

**Tester**: [Name]
**Date**: [Date]
**Environment**: [Test/Staging/Production]

## Summary

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Schema Verification | ✅ Pass | All columns exist |
| Test 2: RPC Function | ✅ Pass | Function works correctly |
| Test 3: Domain Setup | ✅ Pass | Saved successfully |
| Test 4: DNS Configuration | ✅ Pass | CNAME configured |
| Test 5: Domain Verification | ✅ Pass | Verified successfully |
| Test 6: Middleware Identification | ✅ Pass | Headers set correctly |
| Test 7: Theme Injection | ✅ Pass | CSS variables applied |
| Test 8: Logo Display | ✅ Pass | Logo displays correctly |
| Test 9: Cross-Domain | ✅ Pass | No cross-contamination |
| Test 10: Subdomain Fallback | ✅ Pass | Subdomain works |

## Issues Found

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| | | | |

## Screenshots

- [Screenshot 1: Domain configuration page]
- [Screenshot 2: Theme applied on custom domain]
- [Screenshot 3: Logo display]
- [Screenshot 4: Side-by-side comparison]

## Recommendations

1. ...
2. ...
```

---

## Related Documentation

- `/docs/BUSINESS_WALLET_ENHANCEMENT_GUIDE.md` - Overall implementation guide
- `/middleware.ts:39-77` - Domain identification code
- `/app/business/(portal)/domain/page.tsx` - Domain configuration UI
- `/supabase/migrations/20250103_create_business_accounts.sql` - Database schema

---

**Document Version**: 1.0.0
**Last Updated**: November 7, 2025
**Status**: Ready for Testing
**Next Steps**: Create test business accounts and configure custom domains
