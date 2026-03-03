# Fix: Admin Vendor Application Approval Returns "Application not found"

## Context
When admin clicks "Approve" on a vendor application, the server action returns "Application not found" even though the application exists and is visible in the admin UI.

## Root Cause
In `app/admin/vendor-applications/[id]/actions.ts`, both `approveVendorApplication()` and `rejectVendorApplication()` query columns that **don't exist** in the `vendor_applications` table:

```typescript
.select('id, email, applicant_name, application_reference')  // WRONG
```

The actual table columns (from `lib/supabase/types.ts` line 2227) are:
- `business_email` (not `email`)
- `business_name` (not `applicant_name`)
- No `application_reference` column exists at all

This causes a Supabase fetch error, which triggers the `if (fetchError || !application)` check, returning "Application not found".

## Fix

**File: `app/admin/vendor-applications/[id]/actions.ts`**

### Change 1: Fix the select query in `approveVendorApplication()` (line 29)
```
// FROM:
.select('id, email, applicant_name, application_reference')

// TO:
.select('id, business_email, business_name, user_id')
```

### Change 2: Fix email data mapping in `approveVendorApplication()` (lines 56-62)
```typescript
// Use correct column names for email:
email: application.business_email,
name: application.business_name,
applicationReference: application.id,  // use id as reference since no application_reference column
```

### Change 3: Fix the select query in `rejectVendorApplication()` (line 84)
```
// FROM:
.select('id, email, applicant_name, application_reference')

// TO:
.select('id, business_email, business_name, user_id')
```

### Change 4: Fix email data mapping in `rejectVendorApplication()` (lines 111-115)
```typescript
email: application.business_email,
name: application.business_name,
applicationReference: application.id,
```

## Verification
1. Run `npx tsc --noEmit` to check for type errors
2. Test in browser: navigate to admin vendor applications, click on a pending application, click Approve
3. Verify the application status changes to "approved" and no error toast appears
