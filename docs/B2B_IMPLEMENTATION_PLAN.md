# B2B Business Account Module - Implementation Plan

## 🎯 Core Requirements

### Functional Requirements
✅ **NO Subscription** - Simple prepaid wallet system only
✅ **Stripe One-Time Payments** - For wallet recharge (not recurring)
✅ **Custom Domain Support** - Businesses can use their own domain
✅ **Wallet-Based Payments** - Deduct from balance for each booking
✅ **Business Creates Bookings for Customers** - Hotel staff creates booking for guests
✅ **100% Isolated Module** - Zero impact on existing customer/vendor/admin flows

### Technical Requirements
✅ **Ultra-Correct Implementation** - Use Sequential Thinking MCP for complex logic
✅ **Small Files** - Max 150-200 lines per file, split if larger
✅ **No Code Duplication** - Extract shared logic into reusable modules
✅ **Complete Isolation** - No modifications to existing code
✅ **Atomic Operations** - Prevent race conditions in wallet operations
✅ **Comprehensive Error Handling** - Every edge case covered

---

## 📊 System Overview

### What We're Building

**Scenario:**
1. Customer walks into hotel
2. Hotel staff (logged into business account) creates booking for customer
3. Booking cost deducted from hotel's wallet balance
4. Customer receives booking confirmation via email
5. Admin assigns vendor (existing workflow)
6. Driver picks up customer

**Key Differences from Customer Portal:**
- Business pays, not customer
- Business enters customer details
- Payment from prepaid wallet, not Stripe checkout
- All else same: routes, vehicles, vendors, assignments

---

## 🗄️ Database Schema (All New Tables)

### Tables Created

#### 1. `business_accounts`
```sql
- id (UUID)
- business_name, business_email, business_phone
- contact_person_name
- address, city, country_code
- wallet_balance (DECIMAL) - Main payment source
- currency (default: USD)
- subdomain (UNIQUE) - Auto-generated (e.g., "acme")
- custom_domain (UNIQUE, nullable) - Optional custom domain
- custom_domain_verified (BOOLEAN)
- custom_domain_verified_at (TIMESTAMPTZ)
- dns_verification_token (TEXT)
- status (active, suspended, inactive)
- stripe_customer_id (for wallet recharge)
- created_at, updated_at
```

#### 2. `business_users`
```sql
- id (UUID)
- business_account_id (FK → business_accounts)
- auth_user_id (FK → auth.users, UNIQUE)
- email, full_name
- created_at
```

#### 3. `business_bookings`
```sql
- id, booking_number (unique)
- business_account_id (FK → business_accounts)
- created_by_user_id (FK → business_users)
- reference_number (optional, business's own reference)

-- Customer (actual passenger)
- customer_name, customer_email, customer_phone

-- Route (same as bookings table)
- from_location_id, to_location_id
- pickup_address, dropoff_address
- pickup_datetime

-- Vehicle & passengers
- vehicle_type_id
- passenger_count, luggage_count

-- Pricing
- base_price, amenities_price, total_price
- currency
- wallet_deduction_amount

-- Status
- booking_status (pending, confirmed, assigned, in_progress, completed, cancelled, refunded)

-- Notes
- customer_notes
- cancellation_reason, cancelled_at

- created_at, updated_at
```

#### 4. `wallet_transactions`
```sql
- id (UUID)
- business_account_id (FK → business_accounts)
- amount (DECIMAL) - positive = credit, negative = deduction
- transaction_type (credit_added, booking_deduction, refund, admin_adjustment)
- description (TEXT)
- reference_id (UUID) - booking_id if applicable
- balance_after (DECIMAL) - for audit trail
- created_by (TEXT) - 'system', 'admin', or user_id
- stripe_payment_intent_id (nullable)
- created_at
```

### Indexes
```sql
CREATE INDEX idx_business_subdomain ON business_accounts(subdomain);
CREATE INDEX idx_business_custom_domain ON business_accounts(custom_domain);
CREATE INDEX idx_wallet_transactions_business ON wallet_transactions(business_account_id);
CREATE INDEX idx_wallet_transactions_created ON wallet_transactions(created_at DESC);
CREATE INDEX idx_business_bookings_business ON business_bookings(business_account_id);
CREATE INDEX idx_business_bookings_status ON business_bookings(booking_status);
```

### RLS Policies

All tables have Row-Level Security enabled:
- Businesses can only see their own data
- Admins can see all data
- Isolation enforced at database level

---

## 🏗️ File Structure (All New Files)

### Database Migrations
```
supabase/migrations/
  20250103_create_business_accounts.sql          (150 lines)
  20250103_create_business_functions.sql         (200 lines)
```

### Shared Business Logic
```
lib/business/
  domain-utils.ts                                (80 lines)
    - generateSubdomain()
    - isValidDomain()
    - extractSubdomain()
    - generateVerificationToken()

  wallet-operations.ts                           (100 lines)
    - formatCurrency()
    - calculateBookingTotal()
    - validateWalletBalance()

  validators.ts                                  (120 lines)
    - businessRegistrationSchema (Zod)
    - bookingCreationSchema (Zod)
    - customDomainSchema (Zod)

  api-utils.ts                                   (80 lines)
    - getAuthenticatedBusinessUser()
    - createApiResponse()
    - handleApiError()
```

### Reusable UI Components
```
components/business/
  BusinessLayout.tsx                             (150 lines)
  BusinessSidebar.tsx                            (120 lines)
  BusinessHeader.tsx                             (100 lines)
  BusinessProvider.tsx                           (180 lines)

  wallet/
    WalletBalanceCard.tsx                        (80 lines)
    TransactionRow.tsx                           (60 lines)
    RechargeDialog.tsx                           (120 lines)

  bookings/
    BookingCard.tsx                              (100 lines)
    BookingStatusBadge.tsx                       (40 lines)
    BookingFilters.tsx                           (80 lines)

  domain/
    DNSInstructions.tsx                          (150 lines)
    DomainStatusCard.tsx                         (80 lines)
```

### Business Portal Pages
```
app/business/
  layout.tsx                                     (80 lines)

  (auth)/
    register/
      page.tsx                                   (180 lines)
    login/
      page.tsx                                   (120 lines)

  dashboard/
    page.tsx                                     (100 lines)
    components/
      DashboardStats.tsx                         (80 lines)
      RecentBookings.tsx                         (100 lines)
      QuickActions.tsx                           (60 lines)

  bookings/
    page.tsx                                     (120 lines)
    components/
      BookingsList.tsx                           (150 lines)
      BookingsHeader.tsx                         (80 lines)

    new/
      page.tsx                                   (100 lines)
      components/
        BookingWizard.tsx                        (120 lines)
        RouteSearchStep.tsx                      (150 lines)
        VehicleSelectStep.tsx                    (120 lines)
        CustomerDetailsStep.tsx                  (180 lines)
        AmenitiesStep.tsx                        (100 lines)
        ReviewStep.tsx                           (150 lines)

    [id]/
      page.tsx                                   (120 lines)
      components/
        BookingDetails.tsx                       (180 lines)
        BookingTimeline.tsx                      (100 lines)
        CancelBookingDialog.tsx                  (120 lines)

  wallet/
    page.tsx                                     (120 lines)
    components/
      WalletOverview.tsx                         (100 lines)
      TransactionHistory.tsx                     (150 lines)
      TransactionFilters.tsx                     (80 lines)

  settings/
    page.tsx                                     (100 lines)
    components/
      CompanySettings.tsx                        (150 lines)
      DomainSettings.tsx                         (180 lines)
      ProfileSettings.tsx                        (120 lines)
```

### Admin Integration
```
app/admin/business-accounts/
  page.tsx                                       (120 lines)
  components/
    BusinessAccountsTable.tsx                    (180 lines)
    BusinessFilters.tsx                          (80 lines)

  [id]/
    page.tsx                                     (150 lines)
    components/
      BusinessInfo.tsx                           (120 lines)
      WalletManagement.tsx                       (150 lines)
      CreditAdjustmentDialog.tsx                 (120 lines)
      BusinessBookings.tsx                       (150 lines)
```

### API Routes
```
app/api/business/
  register/route.ts                              (180 lines)
  profile/route.ts                               (120 lines)

  wallet/
    balance/route.ts                             (80 lines)
    transactions/route.ts                        (120 lines)
    recharge/route.ts                            (150 lines)

  bookings/
    route.ts                                     (180 lines)
    [id]/route.ts                                (150 lines)

  custom-domain/
    add/route.ts                                 (150 lines)
    verify/route.ts                              (200 lines)
    remove/route.ts                              (100 lines)

app/api/admin/business-accounts/
  route.ts                                       (150 lines)
  [id]/
    route.ts                                     (120 lines)
    adjust-wallet/route.ts                       (150 lines)
    status/route.ts                              (100 lines)

app/api/webhooks/stripe/
  route.ts                                       (180 lines)
```

### Middleware Update
```
middleware.ts                                    (ADD business routing logic)
  - Existing logic unchanged
  - Add business domain resolution
  - Route to /business/* for business domains
```

---

## 📦 Implementation Phases

### Phase 1: Database Foundation (Days 1-2)

**Objective:** Create database schema with atomic wallet operations

**Tasks:**
1. Create migration: tables + indexes
2. Create migration: RLS policies
3. Create migration: database functions
4. Test atomic wallet operations
5. Seed sample data

**Files Created:** 2 migration files

**Deliverables:**
- ✅ 4 tables created with RLS
- ✅ 3 database functions (atomic)
- ✅ Indexes for performance
- ✅ Sample businesses seeded

**Sequential Thinking Used:**
- Wallet deduction atomicity logic
- Race condition prevention
- Transaction rollback scenarios

**Validation:**
- Test concurrent wallet deductions
- Verify RLS isolation
- Check balance accuracy

---

### Phase 2: Shared Business Logic (Day 3)

**Objective:** Create reusable modules to prevent duplication

**Tasks:**
1. Create `lib/business/domain-utils.ts`
2. Create `lib/business/wallet-operations.ts`
3. Create `lib/business/validators.ts`
4. Create `lib/business/api-utils.ts`
5. Create `lib/stripe.ts` for Stripe client

**Files Created:** 5 utility files

**Deliverables:**
- ✅ Domain utilities (subdomain generation, validation)
- ✅ Wallet utilities (formatting, calculations)
- ✅ Zod schemas (validation)
- ✅ API helpers (auth, responses)
- ✅ Stripe client setup

**Code Reuse:**
- All business logic uses these utilities
- No duplication across API routes
- Consistent validation everywhere

---

### Phase 3: Authentication & Domain Routing (Days 4-5)

**Objective:** Business signup, login, domain routing

**Tasks:**
1. Update `middleware.ts` (add business routing)
2. Create business registration API
3. Create business login page
4. Create business register page
5. Create `BusinessProvider.tsx` (context)
6. Test subdomain routing
7. Test authentication flow

**Files Created:** 7 files

**Deliverables:**
- ✅ Registration flow (creates business + user)
- ✅ Login flow
- ✅ Subdomain auto-generation
- ✅ Middleware routes to /business/*
- ✅ Business context provider

**Sequential Thinking Used:**
- Middleware routing logic
- Business context resolution
- Session management

**Validation:**
- Test signup creates business + user
- Test subdomain uniqueness
- Test login redirects correctly
- Test middleware routes properly

---

### Phase 4: Business Portal UI Foundation (Days 6-7)

**Objective:** Layout, navigation, dashboard

**Tasks:**
1. Create `BusinessLayout.tsx`
2. Create `BusinessSidebar.tsx`
3. Create `BusinessHeader.tsx`
4. Create dashboard page
5. Create dashboard components (stats, recent bookings)
6. Create reusable wallet card component

**Files Created:** 10 files (all < 200 lines)

**Deliverables:**
- ✅ Business portal layout
- ✅ Navigation sidebar
- ✅ Dashboard with stats
- ✅ Wallet balance display
- ✅ Recent bookings

**Code Reuse:**
- `WalletBalanceCard.tsx` used in multiple places
- `BookingCard.tsx` reused across pages
- Consistent layout wrapper

---

### Phase 5: Wallet System (Days 8-9)

**Objective:** Wallet management, Stripe recharge, transactions

**Tasks:**
1. Create wallet balance API
2. Create wallet transactions API
3. Create Stripe recharge API
4. Create Stripe webhook handler
5. Create wallet page
6. Create transaction history components
7. Create recharge dialog
8. Test Stripe integration

**Files Created:** 12 files

**Deliverables:**
- ✅ Wallet balance endpoint
- ✅ Transaction history endpoint
- ✅ Stripe checkout for recharge
- ✅ Webhook handler (signature verification)
- ✅ Wallet management UI
- ✅ Transaction history with filters

**Sequential Thinking Used:**
- Webhook signature verification logic
- Race condition prevention
- Error handling for Stripe failures
- Idempotency for webhook events

**Validation:**
- Test Stripe checkout flow
- Test webhook signature verification
- Test duplicate webhook handling
- Test wallet balance updates correctly
- Stress test concurrent recharges

---

### Phase 6: Booking Creation Wizard (Days 10-12)

**Objective:** Multi-step booking wizard with wallet deduction

**Tasks:**
1. Create booking creation API (with wallet deduction)
2. Create booking wizard page
3. Create 5 step components (small files)
4. Create customer details form
5. Implement wallet balance checking
6. Test booking creation flow
7. Test wallet deduction atomicity

**Files Created:** 15 files (all < 200 lines)

**Deliverables:**
- ✅ Multi-step wizard UI
- ✅ Route search (reuse existing)
- ✅ Vehicle selection
- ✅ Customer details form
- ✅ Amenities selection
- ✅ Review & confirm (shows wallet deduction)
- ✅ Atomic booking creation + wallet deduction

**Sequential Thinking Used:**
- Booking creation transaction flow
- Wallet deduction atomicity
- Error recovery scenarios
- Insufficient balance handling

**Validation:**
- Test entire wizard flow
- Test insufficient balance error
- Test concurrent booking creation
- Test wallet deduction accuracy
- Test email sent to customer
- Test booking appears for admin assignment

---

### Phase 7: Booking Management (Days 13-14)

**Objective:** List, view, cancel bookings

**Tasks:**
1. Create bookings list API
2. Create booking details API
3. Create cancel booking API (with refund)
4. Create bookings list page
5. Create booking details page
6. Create cancellation dialog
7. Test cancellation refund flow

**Files Created:** 12 files

**Deliverables:**
- ✅ Bookings list with filters
- ✅ Booking details page
- ✅ Cancellation with wallet refund
- ✅ Status timeline
- ✅ Export to CSV

**Sequential Thinking Used:**
- Cancellation refund atomicity
- Status transition validation
- Refund calculation logic

**Validation:**
- Test booking list filters
- Test cancellation refunds correctly
- Test cannot cancel completed bookings
- Test wallet balance updates on refund

---

### Phase 8: Custom Domain Setup (Days 15-16)

**Objective:** Custom domain configuration and DNS verification

**Tasks:**
1. Create custom domain add API
2. Create DNS verification API
3. Create domain remove API
4. Create domain settings UI
5. Create DNS instructions component
6. Integrate Vercel API (optional)
7. Test DNS verification flow

**Files Created:** 10 files

**Deliverables:**
- ✅ Custom domain UI
- ✅ DNS instructions (CNAME + TXT)
- ✅ DNS verification (checks CNAME + TXT)
- ✅ Vercel domain management
- ✅ Domain status display

**Sequential Thinking Used:**
- DNS verification security
- Domain ownership validation
- Vercel API error handling
- DNS propagation edge cases

**Validation:**
- Test domain format validation
- Test duplicate domain prevention
- Test DNS verification (CNAME + TXT)
- Test domain routing via middleware
- Test SSL provisioning (Vercel)

---

### Phase 9: Admin Integration (Days 17-18)

**Objective:** Admin management of business accounts

**Tasks:**
1. Create admin business accounts list API
2. Create admin business details API
3. Create manual credit adjustment API
4. Create business accounts list page
5. Create business details page
6. Update admin bookings view (add filter)
7. Test admin credit adjustment

**Files Created:** 12 files

**Deliverables:**
- ✅ Admin can list all businesses
- ✅ Admin can view business details
- ✅ Admin can manually adjust wallet
- ✅ Admin can suspend/activate business
- ✅ Admin sees business bookings
- ✅ Unified bookings view (customer + business)

**Validation:**
- Test admin can see all businesses
- Test manual credit adjustment
- Test suspend/activate status
- Test unified bookings view shows both types
- Test admin can assign business bookings

---

### Phase 10: Testing & Bug Fixes (Days 19-21)

**Objective:** Comprehensive testing and polish

**Testing Scenarios:**
1. **Wallet Operations**
   - Concurrent recharge attempts
   - Concurrent booking creations
   - Race condition testing
   - Balance accuracy verification

2. **Business Isolation**
   - Business A cannot see Business B data
   - RLS policies enforced
   - No data leakage

3. **Custom Domain**
   - Domain routing works
   - DNS verification secure
   - SSL provisioning
   - No domain hijacking possible

4. **Booking Flow**
   - End-to-end booking creation
   - Customer receives email
   - Admin can assign to vendor
   - Vendor workflow unchanged

5. **Error Handling**
   - Insufficient balance
   - Invalid inputs
   - Network failures
   - Stripe errors

6. **Integration**
   - Existing customer portal works
   - Existing vendor portal works
   - Existing admin portal works
   - No tests broken

**Bug Fixes:**
- Fix any issues found during testing
- Performance optimization
- UI polish

**Deliverables:**
- ✅ Zero race conditions
- ✅ Complete business isolation
- ✅ All error cases handled
- ✅ Existing system unaffected
- ✅ Production-ready code

---

## 🛡️ Correctness Strategies

### 1. Atomic Wallet Operations

**Problem:** Race conditions in wallet deductions

**Solution:**
```sql
-- Database function with FOR UPDATE lock
CREATE FUNCTION deduct_from_wallet(
  p_business_id UUID,
  p_amount DECIMAL,
  p_booking_id UUID,
  p_description TEXT
) RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_balance DECIMAL;
  v_current_balance DECIMAL;
BEGIN
  -- Lock row for update
  SELECT wallet_balance INTO v_current_balance
  FROM business_accounts
  WHERE id = p_business_id
  FOR UPDATE;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Deduct atomically
  UPDATE business_accounts
  SET wallet_balance = wallet_balance - p_amount
  WHERE id = p_business_id
  RETURNING wallet_balance INTO v_new_balance;

  -- Log transaction
  INSERT INTO wallet_transactions (...) VALUES (...);

  RETURN v_new_balance;
END;
$$;
```

**Why This Works:**
- `FOR UPDATE` locks the row
- Check and deduct in same transaction
- No other transaction can modify balance until commit
- Guarantees no race conditions

### 2. Input Validation

**Every API validates inputs:**
```typescript
// Zod schema validation
const bookingSchema = z.object({
  customer_name: z.string().min(2).max(100),
  customer_email: z.string().email(),
  customer_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  pickup_datetime: z.string().datetime(),
  // ... all fields validated
});

// Use in API
const validated = bookingSchema.parse(body);
```

### 3. Error Handling Pattern

**Consistent error handling:**
```typescript
// API route pattern
export async function POST(req: Request) {
  try {
    // Validate input
    const validated = schema.parse(await req.json());

    // Business logic
    const result = await doSomething(validated);

    // Success response
    return Response.json({ data: result });

  } catch (error) {
    // Log error
    console.error('[API Error]:', error);

    // User-friendly message
    if (error instanceof z.ZodError) {
      return Response.json({
        error: 'Invalid input',
        details: error.errors
      }, { status: 400 });
    }

    return Response.json({
      error: error.message || 'Something went wrong'
    }, { status: 500 });
  }
}
```

### 4. Security Checks

**Never trust client data:**
```typescript
// Always derive business from authenticated user
async function getAuthenticatedBusinessUser() {
  const session = await getSession();

  const { data: businessUser } = await supabase
    .from('business_users')
    .select('*, business_accounts(*)')
    .eq('auth_user_id', session.user.id)
    .single();

  if (!businessUser) {
    throw new Error('Unauthorized');
  }

  return businessUser;
}

// Use in APIs
const businessUser = await getAuthenticatedBusinessUser();
const business_id = businessUser.business_account_id; // Never from client!
```

### 5. Sequential Thinking Checklist

**Before implementing complex logic, think through:**

1. **What can go wrong?**
   - List all edge cases
   - Network failures
   - Invalid inputs
   - Race conditions

2. **How do we handle errors?**
   - Graceful degradation
   - User feedback
   - Retry logic
   - Rollback strategy

3. **Is the operation atomic?**
   - Multiple database operations?
   - Use database functions
   - Transaction boundaries

4. **Can this be exploited?**
   - SQL injection?
   - Authentication bypass?
   - Data leakage?
   - CSRF/XSS?

5. **Is it testable?**
   - How to test edge cases?
   - Can we simulate failures?
   - Isolation in tests?

---

## 🔒 Isolation Guarantees

### Database Level
- ❌ No foreign keys from business tables to existing tables
- ✅ Separate tables: `business_bookings` (not `bookings`)
- ✅ RLS policies prevent cross-business data access
- ✅ All queries scoped to business_account_id

### Code Level
- ❌ No modifications to existing files
- ❌ No changes to existing components
- ❌ No changes to existing APIs
- ✅ All new files in `/business/` namespace
- ✅ Separate API routes: `/api/business/*`
- ✅ Middleware only adds logic, doesn't modify existing

### UI Level
- ❌ No changes to customer portal routes
- ❌ No changes to vendor portal routes
- ❌ No changes to admin portal (except new pages)
- ✅ Separate layout: `BusinessLayout.tsx`
- ✅ Separate components: `components/business/*`
- ✅ Separate context: `BusinessProvider.tsx`

### Integration Points (READ-ONLY)
- ✅ Reuse: `locations`, `routes`, `vehicle_types` (read-only)
- ✅ Reuse: `booking_assignments` table (admin creates assignments)
- ✅ Admin sees both booking types (filter added, logic unchanged)

---

## 📏 File Size Discipline

### Rules
1. **Max 150-200 lines per file**
2. If file exceeds limit, split into smaller files
3. Extract utilities to `lib/`
4. Create sub-components for complex UI

### Examples

**Before (280 lines):**
```typescript
// app/business/bookings/new/page.tsx - TOO LONG
export default function NewBookingPage() {
  // 280 lines of code
  // All 5 steps in one file
}
```

**After (split into 6 files):**
```typescript
// app/business/bookings/new/page.tsx (100 lines)
export default function NewBookingPage() {
  return <BookingWizard />;
}

// components/BookingWizard.tsx (120 lines)
// components/RouteSearchStep.tsx (150 lines)
// components/VehicleSelectStep.tsx (120 lines)
// components/CustomerDetailsStep.tsx (180 lines)
// components/AmenitiesStep.tsx (100 lines)
// components/ReviewStep.tsx (150 lines)
```

---

## 🚫 Anti-Patterns to Avoid

### 1. Code Duplication
❌ **Don't:**
```typescript
// In multiple files
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}
```

✅ **Do:**
```typescript
// lib/business/wallet-operations.ts
export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

// Import everywhere
import { formatCurrency } from '@/lib/business/wallet-operations';
```

### 2. Large Files
❌ **Don't:**
```typescript
// One 500-line component
export default function Dashboard() {
  // Too much code
}
```

✅ **Do:**
```typescript
// Split into smaller components
export default function Dashboard() {
  return (
    <>
      <DashboardStats />
      <RecentBookings />
      <QuickActions />
    </>
  );
}
```

### 3. Mixing Concerns
❌ **Don't:**
```typescript
// API route with business logic
export async function POST(req: Request) {
  // 200 lines of business logic inline
}
```

✅ **Do:**
```typescript
// API route (thin)
export async function POST(req: Request) {
  const validated = schema.parse(await req.json());
  const result = await createBooking(validated); // in lib/
  return Response.json({ data: result });
}

// lib/business/booking-service.ts
export async function createBooking(data) {
  // Business logic here
}
```

---

## ✅ Success Criteria

### Functional
- [ ] Business can signup and login
- [ ] Wallet system works (recharge, deduct, refund)
- [ ] Booking creation works (deducts from wallet)
- [ ] Customer receives email confirmation
- [ ] Admin can assign business bookings to vendors
- [ ] Custom domain setup works
- [ ] Admin can manage businesses

### Technical
- [ ] Zero race conditions in wallet operations
- [ ] All files < 200 lines
- [ ] No code duplication
- [ ] Comprehensive error handling
- [ ] All inputs validated
- [ ] RLS policies enforce isolation

### Isolation
- [ ] Existing customer portal unchanged
- [ ] Existing vendor portal unchanged
- [ ] Existing admin portal works as before
- [ ] No existing tests broken
- [ ] Can disable B2B module without breaking anything

---

## 📊 Timeline Summary

| Phase | Days | Description |
|-------|------|-------------|
| 1 | 1-2 | Database Foundation |
| 2 | 3 | Shared Business Logic |
| 3 | 4-5 | Authentication & Domain Routing |
| 4 | 6-7 | Business Portal UI Foundation |
| 5 | 8-9 | Wallet System |
| 6 | 10-12 | Booking Creation Wizard |
| 7 | 13-14 | Booking Management |
| 8 | 15-16 | Custom Domain Setup |
| 9 | 17-18 | Admin Integration |
| 10 | 19-21 | Testing & Bug Fixes |

**Total: 21 days (3 weeks)**

---

## 🚀 Pre-Implementation Checklist

Before starting Phase 1:

### Environment Setup
- [ ] Stripe test account created
- [ ] Stripe test API keys obtained
- [ ] Stripe webhook secret generated
- [ ] Vercel deployment confirmed (for custom domains)
- [ ] Vercel API token obtained (optional)
- [ ] Environment variables documented

### Development Setup
- [ ] Feature branch created
- [ ] Database backup created
- [ ] Local development environment tested
- [ ] Supabase CLI configured
- [ ] Migration folder structure ready

### Documentation
- [ ] Team briefed on requirements
- [ ] Implementation plan reviewed
- [ ] Code style guide reviewed (max 200 lines per file)
- [ ] Sequential Thinking MCP access confirmed

---

## 📝 Notes

### Why Sequential Thinking?
- Complex logic requires careful planning
- Prevents bugs before they happen
- Ensures all edge cases considered
- Documents decision-making process

### Why Small Files?
- Easier to understand
- Easier to test
- Easier to maintain
- Easier to review
- Forces good separation of concerns

### Why No Duplication?
- DRY principle
- Single source of truth
- Easier to fix bugs (fix once)
- Consistent behavior everywhere

### Why Complete Isolation?
- Zero risk to existing system
- Can be disabled without breaking anything
- Easier to test independently
- Clear boundaries

---

**Document Version:** 1.0
**Created:** 2025-01-03
**Status:** Ready for Implementation
**Approval Required:** Yes

---

## Approval

Once this plan is approved, implementation will begin with:
1. **Phase 1: Database Foundation**
2. Use Sequential Thinking MCP for complex logic
3. Keep all files under 200 lines
4. Extract shared logic to prevent duplication
5. Zero modifications to existing code

Ready to proceed?
