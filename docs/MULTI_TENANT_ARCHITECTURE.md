# Multi-Tenant Architecture

## Overview

This application implements a multi-tenant SaaS architecture where business accounts can access the platform through their own branded subdomains or custom domains. Each business tenant is completely isolated to ensure security, branding consistency, and proper multi-tenancy.

## Custom Domain Route Isolation

### Routing Behavior

#### Main Domain (yourdomain.com)
- **Purpose**: Primary platform access for all user types
- **Routes**: All routes accessible
  - Frontend: `/`, `/search`, `/booking`, etc.
  - Admin portal: `/admin/*`
  - Vendor portal: `/vendor/*`
  - Customer portal: `/customer/*`
  - Business portal: `/business/*`
- **Restrictions**: None

#### Business Subdomain/Custom Domain
Examples:
- Subdomain: `acme.yourdomain.com`
- Custom domain: `transfers.acmehotel.com`

**Purpose**: White-labeled business portal access

**Allowed Routes**:
- `/business/*` - All business portal routes
- `/_next/*` - Next.js static assets and internals
- `/api/business/*` - Business-specific API endpoints
- `/favicon.ico` - Favicon

**Blocked Routes** (automatically redirected):
- `/` - Frontend homepage
- `/admin/*` - Admin portal
- `/vendor/*` - Vendor portal
- `/customer/*` - Customer portal
- `/api/*` (non-business) - Other API endpoints
- All other frontend routes

**Root Path Behavior**:
- Authenticated users: `/` → `/business/dashboard`
- Unauthenticated users: `/` → `/business/login`

### Why This Matters

1. **Security**: Prevents business users from accidentally accessing other portals or platform routes
2. **Branding**: Ensures custom domains show only white-labeled business content
3. **Multi-Tenant Isolation**: Each business tenant has a completely isolated experience
4. **UX**: Clear, focused navigation without confusing cross-portal access

## Implementation

### Architecture Components

#### 1. Domain Routing Helper Utilities
**File**: `lib/business/domain-routing.ts`

**Functions**:
- `isAllowedOnCustomDomain(pathname)` - Checks if a path is allowed on custom domains
- `getBusinessRedirectPath(isAuthenticated)` - Returns appropriate redirect path based on auth state
- `shouldRestrictRoute(hostname, platformDomain)` - Determines if route restrictions should apply

**Usage**:
```typescript
import { isAllowedOnCustomDomain } from '@/lib/business/domain-routing'

const allowed = isAllowedOnCustomDomain('/business/dashboard') // true
const blocked = isAllowedOnCustomDomain('/admin') // false
```

#### 2. Middleware Implementation
**File**: `middleware.ts` (lines 79-107)

**Flow**:
1. Detect custom domain (not main platform domain, not localhost)
2. Check if path is root `/`
   - If yes: redirect to `/business/dashboard` or `/business/login` based on auth
3. Check if path is in allowed patterns
   - If no: redirect to business portal
4. If allowed: continue to business routes

**Code Location**:
```typescript
// middleware.ts, after custom domain detection (line 77)
const isCustomDomain = hostname !== platformDomain &&
                       !hostname.endsWith(`.${platformDomain}`) &&
                       !hostname.includes('localhost')

if (isCustomDomain) {
  // Route restriction logic
}
```

### Domain Detection

**How It Works**:
1. Extract hostname from request headers
2. Compare with platform domain from `NEXT_PUBLIC_SITE_URL`
3. Identify three scenarios:
   - Main domain: No restrictions
   - Localhost: No restrictions (development)
   - Other domain: Apply business route restrictions

**Platform Domain**:
```typescript
const platformDomain = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
).hostname
```

### Branding Integration

Custom domain detection works with the existing branding system:

1. **Domain Detection** (lines 39-77): Queries business by custom domain, sets branding headers
2. **Route Isolation** (lines 79-107): Restricts routes to business portal only
3. **Result**: Complete white-labeled experience

## Testing

### Manual Testing

#### Local Development Testing

1. **Edit `/etc/hosts` (macOS/Linux)**:
   ```
   127.0.0.1  testbusiness.localhost
   ```

2. **Test Scenarios**:

   **Scenario 1: Custom domain root**
   ```bash
   # Visit: http://testbusiness.localhost:3001/
   # Expected: Redirects to /business/login (or /business/dashboard if authenticated)
   ```

   **Scenario 2: Blocked routes**
   ```bash
   # Visit: http://testbusiness.localhost:3001/admin
   # Expected: Redirects to /business/login

   # Visit: http://testbusiness.localhost:3001/vendor
   # Expected: Redirects to /business/login
   ```

   **Scenario 3: Allowed routes**
   ```bash
   # Visit: http://testbusiness.localhost:3001/business/login
   # Expected: Shows business login page

   # Visit: http://testbusiness.localhost:3001/business/dashboard
   # Expected: Shows business dashboard (after auth)
   ```

   **Scenario 4: Main domain unchanged**
   ```bash
   # Visit: http://localhost:3001/
   # Expected: Shows frontend homepage

   # Visit: http://localhost:3001/admin
   # Expected: Shows admin login (or dashboard if authenticated)
   ```

### Production Testing

1. Configure real custom domain in database
2. Set up DNS (CNAME or A record)
3. Test all scenarios above on production domain
4. Verify branding headers are set correctly
5. Confirm complete route isolation

## Configuration

### Environment Variables

```bash
# Required for domain detection
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Database

Custom domains are stored in the `business_accounts` table:
- `custom_domain` - The custom domain (e.g., transfers.acmehotel.com)
- `domain_verified` - Boolean indicating if domain is verified
- `domain_verification_token` - Token for DNS verification

## Edge Cases Handled

1. **Static Assets**: `/_next/*` allowed for Next.js to function
2. **API Routes**: Only `/api/business/*` allowed on custom domains
3. **Favicon**: Allowed for browser tab icon
4. **Root Path**: Special handling with auth-aware redirects
5. **Development**: Localhost excluded from restrictions
6. **Main Domain**: No changes to existing behavior

## Security Implications

### What This Prevents

1. **Cross-Portal Access**: Business users can't access admin/vendor/customer portals
2. **Information Leakage**: Custom domains don't expose non-business functionality
3. **Confused Deputy**: Clear domain-to-portal mapping prevents authorization bypass
4. **Branding Leakage**: No platform branding visible on custom domains

### What This Enables

1. **Complete White-Labeling**: Custom domains show only business branding
2. **Tenant Isolation**: Each business has isolated access
3. **Security Through Obscurity**: Non-business routes not discoverable on custom domains
4. **Clear Authorization**: Domain determines available functionality

## Deployment

### Requirements

- ✅ No database migrations needed
- ✅ No environment variable changes
- ✅ No breaking changes to existing functionality
- ✅ Zero downtime deployment

### Steps

1. Deploy code changes to production
2. No additional configuration needed
3. Existing custom domains automatically get route restrictions
4. Main domain behavior unchanged

### Rollback

If issues arise:
1. Revert middleware.ts changes
2. Redeploy
3. Custom domains will return to showing all routes (previous behavior)

## Troubleshooting

### Issue: Custom domain shows 404 errors

**Cause**: Domain not found in database or not verified

**Solution**:
1. Check `business_accounts.custom_domain` in database
2. Verify `business_accounts.domain_verified = true`
3. Check middleware logs for "Custom domain not verified" warning

### Issue: Redirects not working

**Cause**: Platform domain misconfigured

**Solution**:
1. Verify `NEXT_PUBLIC_SITE_URL` is set correctly
2. Check that hostname matches expected format
3. Review middleware logs for custom domain detection

### Issue: Business routes blocked on main domain

**Cause**: Logic error in domain detection

**Solution**:
1. Verify `hostname !== platformDomain` check
2. Ensure localhost exclusion working
3. Check middleware.ts lines 81-83

## Future Enhancements

### Potential Improvements

1. **Whitelisted Subdomains**: Allow specific platform subdomains (e.g., `www`, `api`)
2. **Per-Business Route Customization**: Let businesses choose which routes to allow
3. **Analytics Integration**: Track custom domain usage and routes accessed
4. **Rate Limiting**: Add per-domain rate limits for security
5. **Custom Error Pages**: Show branded 404/500 pages on custom domains

## References

- **Next.js Middleware**: [Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- **Multi-Tenant SaaS Patterns**: Subdomain isolation best practices
- **Domain Utilities**: `lib/business/domain-utils.ts` (domain validation and generation)
- **Branding System**: Integration with custom domain branding headers

## Related Documentation

- [Business Account System](./B2B_IMPLEMENTATION_SUMMARY.md)
- [Domain Configuration Guide](./CUSTOM_DOMAIN_THEME_TESTING_GUIDE.md)
- [Multi-Tenant Architecture Diagrams](./MULTI_TENANT_ARCHITECTURE_DIAGRAMS.md)
