# Custom Domain Setup for Business Accounts

## 🌐 Overview

This document explains how custom domain functionality works for business accounts in the B2B module, allowing businesses to access their portal via their own domain (e.g., `transfers.acmehotel.com`) instead of a subdomain.

---

## 📋 Table of Contents

1. [Domain Options](#domain-options)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [DNS Configuration](#dns-configuration)
5. [Middleware Implementation](#middleware-implementation)
6. [Custom Domain Setup Flow](#custom-domain-setup-flow)
7. [DNS Verification](#dns-verification)
8. [SSL Certificate Management](#ssl-certificate-management)
9. [Deployment Configuration](#deployment-configuration)
10. [API Endpoints](#api-endpoints)
11. [UI Components](#ui-components)
12. [Testing](#testing)
13. [Troubleshooting](#troubleshooting)

---

## Domain Options

### Option 1: Subdomain (Default, Automatic)

**Example:** `acme.yourdomain.com`

**Features:**
- ✅ Auto-generated on business signup
- ✅ Works immediately, no setup needed
- ✅ Automatic SSL via Vercel/platform
- ✅ No DNS configuration required
- ✅ Free for all businesses

**Format:**
- Business name "Acme Hotel" → Slug "acme" → `acme.yourdomain.com`

### Option 2: Custom Domain (Optional)

**Example:** `transfers.acmehotel.com`

**Features:**
- ✅ Business uses their own domain
- ✅ Professional branding
- ✅ SSL automatic via Vercel
- ⚙️ Requires DNS configuration
- ⚙️ Requires verification

**Requirements:**
- Business must own the domain
- Business must have access to DNS settings
- DNS propagation time: 24-48 hours

---

## Architecture Overview

### How Domain Routing Works

```
1. Request comes in with hostname
   ↓
2. Middleware extracts hostname
   ↓
3. Check if custom domain exists in database
   ↓
4. If not found, check if subdomain exists
   ↓
5. If business found, inject business context
   ↓
6. Rewrite URL to /business/* routes
   ↓
7. Render business portal
```

### Domain Resolution Priority

```typescript
Priority 1: Custom Domain
  transfers.acmehotel.com → business_accounts WHERE custom_domain = 'transfers.acmehotel.com'

Priority 2: Subdomain
  acme.yourdomain.com → business_accounts WHERE subdomain = 'acme'

Priority 3: Main Platform
  yourdomain.com → Regular customer/admin/vendor portal
```

---

## Database Schema

### Updated `business_accounts` Table

```sql
CREATE TABLE business_accounts (
  -- ... existing fields ...

  -- Subdomain (default)
  subdomain TEXT UNIQUE NOT NULL,

  -- Custom domain (optional)
  custom_domain TEXT UNIQUE,
  custom_domain_verified BOOLEAN DEFAULT false,
  custom_domain_verified_at TIMESTAMPTZ,
  dns_verification_token TEXT,

  -- ... other fields ...
);

-- Indexes for fast lookup
CREATE INDEX idx_business_subdomain ON business_accounts(subdomain);
CREATE INDEX idx_business_custom_domain ON business_accounts(custom_domain);
CREATE INDEX idx_business_verified_domains ON business_accounts(custom_domain)
  WHERE custom_domain_verified = true;
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `subdomain` | TEXT | Auto-generated subdomain (e.g., "acme") |
| `custom_domain` | TEXT | Full custom domain (e.g., "transfers.acmehotel.com") |
| `custom_domain_verified` | BOOLEAN | Whether DNS has been verified |
| `custom_domain_verified_at` | TIMESTAMPTZ | When verification completed |
| `dns_verification_token` | TEXT | Unique token for TXT record verification |

---

## DNS Configuration

### Subdomain Setup (Platform Owner - One Time)

**Required DNS Record:**

```
Type: A Record (or CNAME)
Host: *
Points to: Your Vercel deployment / Server IP
TTL: 3600

OR

Type: CNAME
Host: *
Points to: cname.vercel-dns.com
TTL: 3600
```

This wildcard record enables all subdomains (`*.yourdomain.com`) to work automatically.

### Custom Domain Setup (Business Owner)

When a business wants to use `transfers.acmehotel.com`, they must add:

#### 1. CNAME Record (for routing)

```
Type: CNAME
Host: transfers
Points to: cname.vercel-dns.com (or your platform domain)
TTL: 3600
```

**What this does:** Routes traffic from their domain to your platform

#### 2. TXT Record (for verification)

```
Type: TXT
Host: _verification.transfers (or _verification)
Value: [unique-verification-token]
TTL: 3600
```

**What this does:** Proves they own the domain

### DNS Provider Examples

#### GoDaddy
```
1. Login to GoDaddy
2. Go to "My Products" → "Domains"
3. Click DNS next to the domain
4. Add Record → CNAME
   - Host: transfers
   - Points to: cname.vercel-dns.com
   - TTL: 1 Hour
5. Add Record → TXT
   - Host: _verification
   - Value: [paste token]
   - TTL: 1 Hour
```

#### Cloudflare
```
1. Login to Cloudflare
2. Select your domain
3. Go to DNS → Records
4. Add record
   - Type: CNAME
   - Name: transfers
   - Target: cname.vercel-dns.com
   - Proxy status: DNS only (gray cloud)
5. Add record
   - Type: TXT
   - Name: _verification
   - Content: [paste token]
```

#### Namecheap
```
1. Login to Namecheap
2. Domain List → Manage → Advanced DNS
3. Add New Record
   - Type: CNAME Record
   - Host: transfers
   - Value: cname.vercel-dns.com
   - TTL: Automatic
4. Add New Record
   - Type: TXT Record
   - Host: _verification
   - Value: [paste token]
```

---

## Middleware Implementation

### Complete Middleware Code

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || '';
  const url = req.nextUrl;

  // Define main platform domains
  const mainDomains = [
    'yourdomain.com',
    'www.yourdomain.com',
    'app.yourdomain.com',
    'localhost:3001', // Development
  ];

  // Check if this is the main platform
  const isMainDomain = mainDomains.some(domain => {
    return hostname === domain || hostname.startsWith(domain);
  });

  // If main domain and accessing /business/* directly, allow it
  if (isMainDomain && url.pathname.startsWith('/business')) {
    return NextResponse.next();
  }

  // If main domain and NOT /business, it's customer/admin/vendor - skip
  if (isMainDomain) {
    return NextResponse.next();
  }

  // ========== BUSINESS DOMAIN RESOLUTION ==========

  const supabase = createClient(req);
  let business = null;

  // PRIORITY 1: Check if hostname is a verified custom domain
  const { data: customDomainBusiness, error: customError } = await supabase
    .from('business_accounts')
    .select('id, business_name, subdomain, custom_domain, status')
    .eq('custom_domain', hostname)
    .eq('custom_domain_verified', true)
    .eq('status', 'active')
    .single();

  if (customDomainBusiness && !customError) {
    business = customDomainBusiness;
    console.log(`[Middleware] Custom domain matched: ${hostname}`);
  }

  // PRIORITY 2: Check if hostname is a subdomain (e.g., acme.yourdomain.com)
  if (!business) {
    const subdomain = hostname.split('.')[0];

    // Skip if subdomain is a main domain variant
    if (mainDomains.some(d => subdomain === d.split('.')[0])) {
      return NextResponse.next();
    }

    const { data: subdomainBusiness, error: subError } = await supabase
      .from('business_accounts')
      .select('id, business_name, subdomain, custom_domain, status')
      .eq('subdomain', subdomain)
      .eq('status', 'active')
      .single();

    if (subdomainBusiness && !subError) {
      business = subdomainBusiness;
      console.log(`[Middleware] Subdomain matched: ${subdomain}`);
    }
  }

  // No business found - show 404
  if (!business) {
    console.log(`[Middleware] No business found for: ${hostname}`);
    return NextResponse.redirect(new URL('/404', req.url));
  }

  // ========== ROUTE TO BUSINESS PORTAL ==========

  const businessUrl = url.clone();

  // Route root to dashboard
  if (businessUrl.pathname === '/' || businessUrl.pathname === '') {
    businessUrl.pathname = '/business/dashboard';
  } else if (!businessUrl.pathname.startsWith('/business')) {
    // Prepend /business to other paths
    businessUrl.pathname = `/business${businessUrl.pathname}`;
  }

  // Rewrite to business portal
  const response = NextResponse.rewrite(businessUrl);

  // Store business ID in cookie for easy access
  response.cookies.set('business_id', business.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  });

  // Also set in header for server components
  response.headers.set('x-business-id', business.id);
  response.headers.set('x-business-name', business.business_name);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### Helper Functions

```typescript
// lib/business/domain-utils.ts

/**
 * Generate subdomain from business name
 */
export function generateSubdomain(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 63); // DNS label max length
}

/**
 * Validate domain format
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
  return domainRegex.test(domain.toLowerCase());
}

/**
 * Extract subdomain from full domain
 */
export function extractSubdomain(domain: string): string {
  return domain.split('.')[0];
}

/**
 * Generate unique verification token
 */
export function generateVerificationToken(): string {
  return `verify-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
```

---

## Custom Domain Setup Flow

### Step-by-Step Process

#### 1. Business Initiates Custom Domain Request

**Location:** `/business/settings`

```tsx
// User enters custom domain
<Input
  placeholder="transfers.yourhotel.com"
  value={customDomain}
  onChange={(e) => setCustomDomain(e.target.value)}
/>
<Button onClick={handleAddCustomDomain}>
  Add Custom Domain
</Button>
```

#### 2. Backend Validates and Generates Instructions

**API:** `POST /api/business/custom-domain/add`

```typescript
export async function POST(req: Request) {
  const { custom_domain } = await req.json();
  const businessUser = await getAuthenticatedBusinessUser();

  // Validate domain format
  if (!isValidDomain(custom_domain)) {
    return Response.json({
      error: 'Invalid domain format. Please enter a valid domain (e.g., transfers.yourhotel.com)'
    }, { status: 400 });
  }

  // Check if domain already in use
  const { data: existingBusiness } = await supabase
    .from('business_accounts')
    .select('id, business_name')
    .eq('custom_domain', custom_domain)
    .single();

  if (existingBusiness) {
    return Response.json({
      error: `This domain is already in use by ${existingBusiness.business_name}`
    }, { status: 400 });
  }

  // Generate verification token
  const verificationToken = generateVerificationToken();

  // Save to database (unverified)
  const { error } = await supabase
    .from('business_accounts')
    .update({
      custom_domain: custom_domain,
      custom_domain_verified: false,
      dns_verification_token: verificationToken,
      updated_at: new Date().toISOString()
    })
    .eq('id', businessUser.business.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Return DNS instructions
  return Response.json({
    data: {
      domain: custom_domain,
      subdomain: extractSubdomain(custom_domain),
      verification_token: verificationToken,
      dns_instructions: {
        cname: {
          type: 'CNAME',
          host: extractSubdomain(custom_domain),
          points_to: process.env.VERCEL_CNAME || 'cname.vercel-dns.com',
          ttl: 3600
        },
        txt: {
          type: 'TXT',
          host: '_verification',
          value: verificationToken,
          ttl: 3600
        }
      }
    }
  });
}
```

#### 3. Display DNS Instructions to Business

```tsx
// components/business/DNSInstructions.tsx

export function DNSInstructions({
  domain,
  subdomain,
  verificationToken,
  cnameTarget
}: DNSInstructionsProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>DNS Configuration Required</AlertTitle>
        <AlertDescription>
          Add these records in your domain's DNS settings (e.g., GoDaddy, Cloudflare, Namecheap)
        </AlertDescription>
      </Alert>

      {/* CNAME Record */}
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-3">1. Add CNAME Record (for routing)</h4>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Type</TableCell>
              <TableCell><code>CNAME</code></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Host/Name</TableCell>
              <TableCell>
                <code className="bg-muted px-2 py-1 rounded">{subdomain}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(subdomain)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Points to / Target</TableCell>
              <TableCell>
                <code className="bg-muted px-2 py-1 rounded">{cnameTarget}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(cnameTarget)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">TTL</TableCell>
              <TableCell><code>3600</code> (or Automatic)</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* TXT Record */}
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-3">2. Add TXT Record (for verification)</h4>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Type</TableCell>
              <TableCell><code>TXT</code></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Host/Name</TableCell>
              <TableCell>
                <code className="bg-muted px-2 py-1 rounded">_verification</code>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Value / Content</TableCell>
              <TableCell>
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  {verificationToken}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(verificationToken)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">TTL</TableCell>
              <TableCell><code>3600</code> (or Automatic)</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <Alert variant="info">
        <Info className="h-4 w-4" />
        <AlertDescription>
          DNS changes can take 24-48 hours to propagate globally.
          You can verify once the records are added.
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

#### 4. Business Adds DNS Records

Business goes to their domain registrar (GoDaddy, Cloudflare, etc.) and adds the two records.

#### 5. Business Clicks "Verify DNS"

```tsx
<Button onClick={handleVerifyDNS} disabled={verifying}>
  {verifying ? 'Verifying...' : 'Verify DNS Configuration'}
</Button>
```

---

## DNS Verification

### Verification API Endpoint

**API:** `POST /api/business/custom-domain/verify`

```typescript
import dns from 'dns/promises';

export async function POST(req: Request) {
  const businessUser = await getAuthenticatedBusinessUser();
  const { custom_domain, dns_verification_token } = businessUser.business;

  if (!custom_domain) {
    return Response.json({
      error: 'No custom domain configured'
    }, { status: 400 });
  }

  if (businessUser.business.custom_domain_verified) {
    return Response.json({
      data: {
        verified: true,
        message: 'Domain already verified'
      }
    });
  }

  try {
    // STEP 1: Verify CNAME record
    let cnameValid = false;
    try {
      const cnameRecords = await dns.resolveCname(custom_domain);
      const expectedTargets = [
        'cname.vercel-dns.com',
        process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '').replace('http://', ''),
        process.env.VERCEL_CNAME
      ].filter(Boolean);

      cnameValid = cnameRecords.some(record =>
        expectedTargets.some(target => record.toLowerCase().includes(target.toLowerCase()))
      );
    } catch (error) {
      return Response.json({
        error: 'CNAME record not found. Please ensure you\'ve added the CNAME record and it has propagated (can take up to 48 hours).',
        step: 'cname',
        details: error.message
      }, { status: 400 });
    }

    if (!cnameValid) {
      return Response.json({
        error: 'CNAME record points to incorrect target. Please check your DNS settings.',
        step: 'cname'
      }, { status: 400 });
    }

    // STEP 2: Verify TXT record
    let txtValid = false;
    try {
      const txtRecords = await dns.resolveTxt(`_verification.${custom_domain}`);
      const flatRecords = txtRecords.flat();
      txtValid = flatRecords.some(record => record === dns_verification_token);
    } catch (error) {
      return Response.json({
        error: 'TXT verification record not found. Please ensure you\'ve added the TXT record with host "_verification".',
        step: 'txt',
        details: error.message
      }, { status: 400 });
    }

    if (!txtValid) {
      return Response.json({
        error: 'TXT record not found or incorrect. Please check that the value matches exactly.',
        step: 'txt'
      }, { status: 400 });
    }

    // STEP 3: Both verified! Update database
    const { error: updateError } = await supabase
      .from('business_accounts')
      .update({
        custom_domain_verified: true,
        custom_domain_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', businessUser.business.id);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    // STEP 4: Add domain to Vercel (if using Vercel)
    if (process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID) {
      try {
        await addDomainToVercel(custom_domain);
      } catch (vercelError) {
        console.error('[Vercel] Failed to add domain:', vercelError);
        // Don't fail the verification, domain is still verified
      }
    }

    // STEP 5: Send confirmation email
    await sendCustomDomainVerifiedEmail(businessUser.business);

    return Response.json({
      data: {
        verified: true,
        message: 'Custom domain verified successfully! Your portal is now accessible at ' + custom_domain,
        ssl_note: 'SSL certificate will be automatically provisioned within 24 hours.'
      }
    });

  } catch (error) {
    console.error('[DNS Verification Error]:', error);
    return Response.json({
      error: 'DNS verification failed. Please ensure records are added correctly and DNS has propagated (can take up to 48 hours).',
      details: error.message
    }, { status: 500 });
  }
}
```

### Vercel Domain Management

```typescript
// lib/vercel.ts

interface VercelDomainResponse {
  name: string;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
}

export async function addDomainToVercel(domain: string): Promise<VercelDomainResponse> {
  const response = await fetch(
    `https://api.vercel.com/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: domain,
        redirect: undefined, // No redirect
        redirectStatusCode: undefined
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Vercel API error: ${error.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

export async function removeDomainFromVercel(domain: string): Promise<void> {
  const response = await fetch(
    `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`
      }
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.json();
    throw new Error(`Vercel API error: ${error.error?.message || 'Unknown error'}`);
  }
}

export async function checkDomainStatus(domain: string): Promise<{
  configured: boolean;
  verified: boolean;
  verification?: any[];
}> {
  const response = await fetch(
    `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`
      }
    }
  );

  if (!response.ok) {
    return { configured: false, verified: false };
  }

  const data = await response.json();
  return {
    configured: true,
    verified: data.verified,
    verification: data.verification
  };
}
```

---

## SSL Certificate Management

### Automatic SSL via Vercel

When using Vercel, SSL certificates are provisioned automatically:

1. Business adds CNAME record
2. DNS propagates (24-48 hours)
3. Business verifies in your platform
4. Your platform adds domain to Vercel via API
5. Vercel automatically provisions SSL certificate
6. Certificate renews automatically every 90 days

**No manual intervention required!**

### SSL Status Checking

```typescript
// Check SSL status after verification
export async function checkSSLStatus(domain: string): Promise<{
  ssl_enabled: boolean;
  ssl_issued_at?: string;
  ssl_expires_at?: string;
}> {
  try {
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      redirect: 'manual'
    });

    return {
      ssl_enabled: true,
      // Additional details can be extracted from certificate
    };
  } catch (error) {
    return {
      ssl_enabled: false
    };
  }
}
```

---

## Deployment Configuration

### Vercel Deployment

#### 1. Environment Variables

Add to Vercel project settings:

```env
# Vercel API (for domain management)
VERCEL_API_TOKEN=your_vercel_api_token
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx

# Domain configuration
VERCEL_CNAME=cname.vercel-dns.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

#### 2. Get Vercel API Token

```
1. Go to https://vercel.com/account/tokens
2. Create new token
3. Name: "Custom Domain Management"
4. Scope: Full Account
5. Copy token → Add to environment variables
```

#### 3. Get Project ID

```
1. Go to your Vercel project settings
2. Project ID is in the URL or settings page
3. Format: prj_xxxxxxxxxxxxx
```

### Local Development

```env
# .env.local
VERCEL_API_TOKEN=vercel_token_here
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# For testing, you can use /etc/hosts
# Add to /etc/hosts:
# 127.0.0.1 acme.localhost
# 127.0.0.1 test.acmehotel.com
```

---

## API Endpoints

### Summary of Custom Domain APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/business/custom-domain/add` | Add custom domain (unverified) |
| POST | `/api/business/custom-domain/verify` | Verify DNS configuration |
| DELETE | `/api/business/custom-domain/remove` | Remove custom domain |
| GET | `/api/business/custom-domain/status` | Check domain status |

### Remove Custom Domain

```typescript
// DELETE /api/business/custom-domain/remove
export async function DELETE(req: Request) {
  const businessUser = await getAuthenticatedBusinessUser();
  const { custom_domain } = businessUser.business;

  if (!custom_domain) {
    return Response.json({ error: 'No custom domain configured' }, { status: 400 });
  }

  // Remove from Vercel first
  if (process.env.VERCEL_API_TOKEN) {
    try {
      await removeDomainFromVercel(custom_domain);
    } catch (error) {
      console.error('[Vercel] Failed to remove domain:', error);
    }
  }

  // Remove from database
  const { error } = await supabase
    .from('business_accounts')
    .update({
      custom_domain: null,
      custom_domain_verified: false,
      custom_domain_verified_at: null,
      dns_verification_token: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', businessUser.business.id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    data: {
      success: true,
      message: 'Custom domain removed successfully. You can still access your portal at ' + businessUser.business.subdomain + '.yourdomain.com'
    }
  });
}
```

---

## UI Components

### Settings Page with Custom Domain

```tsx
// app/business/settings/page.tsx

export default function SettingsPage() {
  const { business } = useBusinessContext();
  const [customDomain, setCustomDomain] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddCustomDomain = async () => {
    setLoading(true);
    const response = await fetch('/api/business/custom-domain/add', {
      method: 'POST',
      body: JSON.stringify({ custom_domain: customDomain })
    });

    const result = await response.json();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Domain added! Please configure DNS.');
      // Refresh page to show DNS instructions
      window.location.reload();
    }
    setLoading(false);
  };

  const handleVerifyDNS = async () => {
    setLoading(true);
    const response = await fetch('/api/business/custom-domain/verify', {
      method: 'POST'
    });

    const result = await response.json();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.data.message);
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Domain Settings</h2>

      {/* Default Subdomain */}
      <Card>
        <CardHeader>
          <CardTitle>Your Portal URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <a
              href={`https://${business.subdomain}.yourdomain.com`}
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              {business.subdomain}.yourdomain.com
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            This is your default portal address
          </p>
        </CardContent>
      </Card>

      {/* Custom Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Domain</CardTitle>
          <CardDescription>
            Use your own domain for a professional branded experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!business.custom_domain ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="transfers.yourhotel.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                />
                <Button onClick={handleAddCustomDomain} disabled={loading}>
                  Add Domain
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Example: transfers.yourhotel.com or booking.yourcompany.com
              </p>
            </div>
          ) : !business.custom_domain_verified ? (
            <div className="space-y-4">
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>DNS Configuration Required</AlertTitle>
                <AlertDescription>
                  Domain: <strong>{business.custom_domain}</strong>
                </AlertDescription>
              </Alert>

              <DNSInstructions
                domain={business.custom_domain}
                subdomain={extractSubdomain(business.custom_domain)}
                verificationToken={business.dns_verification_token}
                cnameTarget="cname.vercel-dns.com"
              />

              <div className="flex gap-2">
                <Button onClick={handleVerifyDNS} disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify DNS Configuration'}
                </Button>
                <Button variant="outline" onClick={() => {/* Remove domain */}}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant="success">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Custom Domain Active</AlertTitle>
                <AlertDescription>
                  Your portal is now accessible at{' '}
                  <a
                    href={`https://${business.custom_domain}`}
                    target="_blank"
                    className="font-medium underline"
                  >
                    {business.custom_domain}
                  </a>
                </AlertDescription>
              </Alert>

              <div className="text-sm text-muted-foreground">
                Verified on: {new Date(business.custom_domain_verified_at).toLocaleDateString()}
              </div>

              <Button variant="outline" onClick={() => {/* Remove domain */}}>
                Remove Custom Domain
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Testing

### Manual Testing Checklist

#### Subdomain Testing
- [ ] Business signs up
- [ ] Subdomain auto-generated
- [ ] Access `{subdomain}.yourdomain.com`
- [ ] Portal loads correctly
- [ ] Business context injected
- [ ] Cookie set properly

#### Custom Domain Testing
- [ ] Business adds custom domain
- [ ] DNS instructions displayed
- [ ] Add CNAME record to test domain
- [ ] Add TXT record to test domain
- [ ] Wait for DNS propagation (dig command)
- [ ] Click "Verify DNS"
- [ ] Verification succeeds
- [ ] Domain added to Vercel
- [ ] Access custom domain
- [ ] Portal loads correctly
- [ ] SSL certificate issued (may take 24h)
- [ ] HTTPS works

#### Edge Cases
- [ ] Invalid domain format → Shows error
- [ ] Domain already in use → Shows error
- [ ] DNS not propagated → Shows helpful error
- [ ] Wrong CNAME target → Shows error
- [ ] Wrong TXT value → Shows error
- [ ] Multiple businesses on same platform
- [ ] Remove custom domain → Fallback to subdomain

### DNS Propagation Testing

```bash
# Check CNAME record
dig transfers.acmehotel.com CNAME +short

# Expected output:
# cname.vercel-dns.com

# Check TXT record
dig _verification.transfers.acmehotel.com TXT +short

# Expected output:
# "verify-1234567890-abcdef"

# Check from different DNS servers
dig @8.8.8.8 transfers.acmehotel.com CNAME +short
dig @1.1.1.1 transfers.acmehotel.com CNAME +short
```

### Automated Tests

```typescript
// __tests__/custom-domain.test.ts

describe('Custom Domain', () => {
  it('should generate valid subdomain from business name', () => {
    expect(generateSubdomain('Acme Hotel')).toBe('acme-hotel');
    expect(generateSubdomain('ABC-123 Company!')).toBe('abc-123-company');
  });

  it('should validate domain format', () => {
    expect(isValidDomain('transfers.acmehotel.com')).toBe(true);
    expect(isValidDomain('booking.company.co.uk')).toBe(true);
    expect(isValidDomain('invalid domain')).toBe(false);
    expect(isValidDomain('http://example.com')).toBe(false);
  });

  it('should extract subdomain correctly', () => {
    expect(extractSubdomain('transfers.acmehotel.com')).toBe('transfers');
    expect(extractSubdomain('booking.test.com')).toBe('booking');
  });
});
```

---

## Troubleshooting

### Common Issues

#### 1. "Domain already in use"

**Problem:** Another business is using this domain

**Solution:**
- Check if you already added this domain
- Contact support if you believe it's an error
- Verify you own the domain

#### 2. "CNAME record not found"

**Problem:** DNS hasn't propagated or record not added correctly

**Solutions:**
- Wait 24-48 hours for DNS propagation
- Check you added record to correct domain
- Verify CNAME points to `cname.vercel-dns.com`
- Use `dig` command to verify:
  ```bash
  dig transfers.yourhotel.com CNAME +short
  ```

#### 3. "TXT record not found"

**Problem:** Verification record not added or incorrect

**Solutions:**
- Ensure host is exactly `_verification`
- Ensure value matches token exactly (no extra spaces)
- Wait for DNS propagation
- Use `dig` command:
  ```bash
  dig _verification.transfers.yourhotel.com TXT +short
  ```

#### 4. "SSL Certificate not issued"

**Problem:** Certificate provisioning takes time

**Solutions:**
- Wait up to 24 hours after verification
- Ensure CNAME record is correct
- Check Vercel domain settings
- Contact Vercel support if > 48 hours

#### 5. "Portal shows 404"

**Problem:** Middleware not routing correctly

**Solutions:**
- Check custom_domain_verified = true in database
- Verify middleware is deployed
- Check browser console for errors
- Clear cookies and try again

#### 6. "Redirect loop"

**Problem:** Middleware configuration issue

**Solutions:**
- Check middleware matcher config
- Ensure /business routes are not being double-rewritten
- Check Vercel deployment logs
- Verify no redirect rules in DNS (Cloudflare proxy off)

### Debug Commands

```bash
# Check DNS propagation globally
https://www.whatsmydns.net/

# Check CNAME
dig transfers.acmehotel.com CNAME +short

# Check TXT
dig _verification.transfers.acmehotel.com TXT +short

# Check SSL certificate
openssl s_client -connect transfers.acmehotel.com:443 -servername transfers.acmehotel.com

# Test from different locations
curl -I https://transfers.acmehotel.com
```

### Support Checklist for Businesses

When business contacts support about custom domain:

1. **Verify domain ownership**
   - Can they access DNS settings?
   - Do they own the domain?

2. **Check DNS records**
   - Run dig commands
   - Check from multiple DNS servers
   - Verify exact values

3. **Check database**
   ```sql
   SELECT custom_domain, custom_domain_verified, dns_verification_token
   FROM business_accounts
   WHERE id = '[business-id]';
   ```

4. **Check Vercel**
   - Is domain added to Vercel project?
   - Is SSL certificate issued?
   - Any errors in Vercel dashboard?

5. **Re-verify**
   - Trigger verification API manually
   - Check error response
   - Update business on status

---

## Summary

### Quick Reference

**Subdomain Setup:**
- Auto-generated on signup
- Format: `{slug}.yourdomain.com`
- Works immediately
- No configuration needed

**Custom Domain Setup:**
1. Business enters domain in settings
2. Add CNAME: `subdomain` → `cname.vercel-dns.com`
3. Add TXT: `_verification` → `[token]`
4. Wait for DNS propagation (24-48h)
5. Click "Verify"
6. SSL issued automatically (24h)
7. Done!

**Key Files:**
- `middleware.ts` - Domain routing
- `/api/business/custom-domain/*` - Domain APIs
- `business_accounts` table - Domain storage
- `/business/settings` - Domain UI

**External Dependencies:**
- Vercel (hosting + SSL)
- DNS provider (business's)
- Node.js `dns/promises` module

---

**Document Version:** 1.0
**Last Updated:** 2025-01-03
**Author:** Development Team
