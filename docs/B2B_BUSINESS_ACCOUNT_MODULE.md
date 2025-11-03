# B2B Business Account Module - Implementation Plan

## 🎯 Overview

A simple business account system where **hotels and travel agencies** can create bookings **for their customers** using a **prepaid wallet system**.

### Real-World Scenario:
1. Customer goes to hotel front desk
2. Hotel staff logs into their business account
3. Staff creates booking for the customer (enters customer details)
4. Payment deducted from hotel's wallet balance
5. Customer receives booking confirmation
6. Admin assigns vendor (existing workflow)

---

## 📊 Database Schema - 4 Simple Tables

### 1. `business_accounts`
**Purpose:** Store business/hotel/agency information and wallet balance

```sql
CREATE TABLE business_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  business_email TEXT NOT NULL UNIQUE,
  business_phone TEXT,
  contact_person_name TEXT,
  address TEXT,
  city TEXT,
  country_code TEXT,
  wallet_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. `business_users`
**Purpose:** Link Supabase auth users to business accounts (one user per business initially)

```sql
CREATE TABLE business_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. `business_bookings`
**Purpose:** Store bookings created by businesses on behalf of their customers

```sql
CREATE TABLE business_bookings (
  -- All fields from existing bookings table
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number TEXT UNIQUE,

  -- Business reference
  business_account_id UUID NOT NULL REFERENCES business_accounts(id),
  created_by_user_id UUID REFERENCES business_users(id),
  reference_number TEXT, -- Business's own reference

  -- Actual customer (passenger) details
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,

  -- Route and location
  from_location_id UUID REFERENCES locations(id),
  to_location_id UUID REFERENCES locations(id),
  from_zone_id UUID,
  to_zone_id UUID,
  pickup_address TEXT,
  dropoff_address TEXT,
  pickup_datetime TIMESTAMPTZ NOT NULL,

  -- Vehicle and passengers
  vehicle_type_id UUID REFERENCES vehicle_types(id),
  passenger_count INTEGER DEFAULT 1,
  luggage_count INTEGER DEFAULT 0,

  -- Pricing
  base_price DECIMAL(10, 2),
  amenities_price DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  wallet_deduction_amount DECIMAL(10, 2) NOT NULL,

  -- Status
  booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN
    ('pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled', 'refunded')),

  -- Notes
  customer_notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. `wallet_transactions`
**Purpose:** Audit trail for all wallet balance changes

```sql
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL, -- Positive = credit, Negative = deduction
  transaction_type TEXT NOT NULL CHECK (transaction_type IN
    ('credit_added', 'booking_deduction', 'refund', 'admin_adjustment')),
  description TEXT NOT NULL,
  reference_id UUID, -- booking_id or other reference
  balance_after DECIMAL(10, 2) NOT NULL,
  created_by TEXT, -- 'admin', 'system', or user_id
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_transactions_business ON wallet_transactions(business_account_id);
CREATE INDEX idx_wallet_transactions_created ON wallet_transactions(created_at DESC);
```

---

## 🔄 Booking Flow

### Business Creates Booking for Customer:

1. **Search Route**
   - Reuse existing route search UI
   - Business user searches origin → destination
   - Shows available routes and prices

2. **Select Vehicle Type**
   - Choose from available vehicle types
   - See pricing per vehicle type

3. **Enter Customer Details** (Key difference from customer portal)
   - Customer name (the actual passenger)
   - Customer email
   - Customer phone
   - Pickup address
   - Dropoff address
   - Pickup date & time
   - Number of passengers
   - Number of luggage

4. **Add Amenities**
   - Child seats, ski box, wifi, etc.
   - Same as customer portal

5. **Review & Confirm**
   - Display summary:
     ```
     Total Price: $150.00

     Your Wallet:
     Current Balance: $500.00
     Amount to Deduct: $150.00
     Balance After: $350.00
     ```
   - Confirm button

6. **Wallet Deduction & Booking Creation**
   ```typescript
   // Pseudo-code
   if (business.wallet_balance < total_price) {
     return error("Insufficient wallet balance. Please recharge.")
   }

   // Atomic transaction
   BEGIN;
     // Deduct from wallet
     UPDATE business_accounts
     SET wallet_balance = wallet_balance - total_price
     WHERE id = business_id;

     // Create booking
     INSERT INTO business_bookings (...) VALUES (...);

     // Log transaction
     INSERT INTO wallet_transactions (
       business_account_id, amount, transaction_type,
       description, reference_id, balance_after
     ) VALUES (
       business_id, -total_price, 'booking_deduction',
       'Booking #' || booking_number, booking_id, new_balance
     );
   COMMIT;
   ```

7. **Send Confirmation**
   - Email sent to **customer's email** (not business email)
   - Booking confirmation with details
   - Business also gets notification

8. **Admin Assignment**
   - Booking appears in admin panel
   - Admin assigns to vendor (same existing workflow)
   - Uses existing `booking_assignments` table

---

## 💰 Wallet System

### How It Works:

**Prepaid Balance System**
- Business must maintain wallet balance
- All bookings deducted from wallet
- Cannot create booking if insufficient balance
- Real-time balance checking

### Wallet Operations:

#### 1. Recharge Wallet (Stripe)
```
Business → Clicks "Recharge Wallet"
       → Selects amount ($100, $500, $1000, custom)
       → Stripe Checkout session
       → Payment success
       → Webhook receives event
       → Add to wallet_balance
       → Create wallet_transaction (type: credit_added)
       → Send receipt email
```

#### 2. Booking Deduction
```
Business → Creates booking
       → Check balance >= price
       → Deduct from wallet (atomic)
       → Create wallet_transaction (type: booking_deduction)
       → Create booking record
```

#### 3. Cancellation Refund
```
User → Cancels booking
    → Return amount to wallet
    → Create wallet_transaction (type: refund)
    → Update booking status
```

#### 4. Admin Adjustment
```
Admin → Views business account
      → Add/Deduct credits manually
      → Enter amount + reason
      → Create wallet_transaction (type: admin_adjustment)
      → Update wallet_balance
```

### Transaction History:
- All changes logged in `wallet_transactions`
- Shows running balance (balance_after)
- Filterable by date, type
- Exportable to CSV/PDF

---

## 🖥️ Business Portal Routes

### Public Routes:
- `/business/register` - Business signup form
- `/business/login` - Business user login

### Protected Routes:

#### `/business/dashboard`
**Main Dashboard**

Components:
- **Wallet Balance Card** (prominent display)
  ```
  Your Wallet Balance
  $500.00 USD
  [Recharge Wallet] button
  ```
- **Quick Stats**
  - Bookings This Month: 24
  - Total Spent This Month: $3,600
  - Pending Bookings: 3
- **Recent Bookings Table** (last 5)
- **Quick Action Button**: "Create New Booking"

#### `/business/bookings`
**All Bookings List**

Table Columns:
- Booking Number
- Customer Name
- Route (From → To)
- Date
- Status
- Amount
- Actions (View, Cancel)

Features:
- Search by booking number or customer name
- Filter by status, date range
- Export to CSV
- Pagination

#### `/business/bookings/new`
**Create New Booking**

Multi-step form wizard:
1. Search Route
2. Select Vehicle
3. Enter Customer Details
4. Add Amenities
5. Review & Confirm (shows wallet deduction)

Shows wallet balance throughout the flow.

#### `/business/bookings/[id]`
**Booking Details**

Displays:
- Booking information
- Customer details
- Route and schedule
- Assigned vehicle and driver (if assigned)
- Status timeline
- Payment details (deducted from wallet)
- Cancel button (refunds to wallet)

#### `/business/wallet`
**Wallet Management**

Components:
- **Current Balance Display** (large, prominent)
  ```
  Current Balance
  $500.00 USD

  [Recharge Wallet] [Download Statement]
  ```

- **Recharge Wallet**
  - Select amount: $100, $500, $1000, Custom
  - Stripe checkout integration

- **Transaction History Table**
  - Columns: Date, Type, Description, Amount, Balance After
  - Filter by date range, transaction type
  - Export to CSV/PDF

#### `/business/profile`
**Business Profile & Settings**

Sections:
- **Company Information**
  - Business name
  - Email
  - Phone
  - Address
  - Contact person

- **Account Settings**
  - Change password
  - Email notifications preferences

- **Support**
  - Contact admin
  - Help documentation

---

## 🛠️ Admin Portal Integration

### New Admin Routes:

#### `/admin/business-accounts`
**List All Business Accounts**

Table Columns:
- Business Name
- Email
- Wallet Balance
- Status
- Total Bookings
- Created Date
- Actions

Features:
- Search by name/email
- Filter by status (active, suspended, inactive)
- Sort by balance, bookings, date
- Export to CSV

Actions:
- View Details
- Add Credits
- Suspend/Activate
- View Bookings

#### `/admin/business-accounts/[id]`
**Business Account Details**

Sections:

1. **Business Information**
   - All business details
   - Edit button

2. **Wallet Overview**
   - Current Balance (big display)
   - Total Credits Added
   - Total Spent
   - Total Refunded

3. **Manual Credit Adjustment**
   ```
   [Add Credits]  [Deduct Credits]

   Amount: $______
   Reason: _______________________
   [Confirm]
   ```

4. **Transaction History**
   - Full wallet_transactions for this business
   - Filter, export

5. **Bookings**
   - All business_bookings for this business
   - Same table as main bookings view

6. **Actions**
   - Suspend Account
   - Activate Account
   - Delete Account (with confirmation)

#### Update `/admin/bookings`
**Unified Booking View**

Show both customer bookings AND business bookings in one unified table.

Add "Source" column:
- "Customer" (from `bookings` table)
- "Business: [Business Name]" (from `business_bookings` table)

Same assignment workflow for both types.

Filter options:
- All Bookings
- Customer Bookings Only
- Business Bookings Only
- By Business (dropdown)

---

## 🔌 API Routes

### Business APIs

#### `POST /api/business/register`
Register new business account
```typescript
Body: {
  business_name: string;
  business_email: string;
  business_phone: string;
  contact_person_name: string;
  password: string;
}
Response: { data: { business_id, user_id }, error? }
```

#### `GET /api/business/profile`
Get current business account info
```typescript
Response: {
  data: {
    business_account,
    user
  },
  error?
}
```

#### `PATCH /api/business/profile`
Update business account
```typescript
Body: { business_name?, business_phone?, address?, ... }
Response: { data: business_account, error? }
```

#### `GET /api/business/wallet/balance`
Get current wallet balance
```typescript
Response: { data: { balance: number, currency: string }, error? }
```

#### `GET /api/business/wallet/transactions`
Get wallet transaction history
```typescript
Query: { page?, limit?, type?, from_date?, to_date? }
Response: { data: transactions[], pagination, error? }
```

#### `POST /api/business/wallet/recharge`
Create Stripe checkout for wallet recharge
```typescript
Body: { amount: number }
Response: { data: { checkout_url: string }, error? }
```

#### `POST /api/business/bookings`
Create new booking (with wallet deduction)
```typescript
Body: {
  customer_name, customer_email, customer_phone,
  route, vehicle_type, pickup_datetime,
  amenities, ...
}
Response: { data: booking, error? }
```

#### `GET /api/business/bookings`
List business bookings
```typescript
Query: { page?, limit?, status?, from_date?, to_date?, search? }
Response: { data: bookings[], pagination, error? }
```

#### `GET /api/business/bookings/:id`
Get booking details
```typescript
Response: { data: booking, error? }
```

#### `DELETE /api/business/bookings/:id`
Cancel booking (refund to wallet)
```typescript
Body: { cancellation_reason: string }
Response: { data: { booking, refund_amount }, error? }
```

### Admin APIs

#### `GET /api/admin/business-accounts`
List all business accounts
```typescript
Query: { page?, limit?, status?, search? }
Response: { data: accounts[], pagination, error? }
```

#### `GET /api/admin/business-accounts/:id`
Get business account details
```typescript
Response: { data: { account, stats, recent_bookings }, error? }
```

#### `POST /api/admin/business-accounts/:id/adjust-wallet`
Add or deduct wallet credits
```typescript
Body: {
  amount: number, // positive = add, negative = deduct
  reason: string
}
Response: { data: { new_balance, transaction }, error? }
```

#### `PATCH /api/admin/business-accounts/:id/status`
Suspend or activate account
```typescript
Body: { status: 'active' | 'suspended' | 'inactive' }
Response: { data: account, error? }
```

### Webhook

#### `POST /api/webhooks/stripe`
Handle Stripe events (wallet recharge)
```typescript
Events:
- checkout.session.completed (wallet recharge successful)

Process:
1. Verify signature
2. Extract business_id from metadata
3. Add amount to wallet_balance
4. Create wallet_transaction
5. Send receipt email
```

---

## 💳 Stripe Integration

### Setup Required:

1. **Stripe Account Configuration**
   - Create Stripe account (or use existing)
   - Get API keys (test and live)
   - Enable Customer Portal (optional, for future)

2. **Environment Variables**
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_SITE_URL=http://localhost:3001
   ```

### Wallet Recharge Flow:

#### 1. Business Initiates Recharge
```typescript
// Frontend: /business/wallet
const handleRecharge = async (amount: number) => {
  const response = await fetch('/api/business/wallet/recharge', {
    method: 'POST',
    body: JSON.stringify({ amount })
  });

  const { checkout_url } = await response.json();
  window.location.href = checkout_url; // Redirect to Stripe
};
```

#### 2. Backend Creates Checkout Session
```typescript
// /api/business/wallet/recharge
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  const { amount } = await req.json();
  const businessUser = await getAuthenticatedBusinessUser();

  // Create or get Stripe customer
  let stripeCustomerId = businessUser.business.stripe_customer_id;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: businessUser.business.business_email,
      name: businessUser.business.business_name,
      metadata: { business_account_id: businessUser.business.id }
    });
    stripeCustomerId = customer.id;

    // Save to database
    await supabase
      .from('business_accounts')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', businessUser.business.id);
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Wallet Recharge',
          description: `Add $${amount} to your wallet`
        },
        unit_amount: amount * 100 // Convert to cents
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/business/wallet?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/business/wallet?cancelled=true`,
    metadata: {
      business_account_id: businessUser.business.id,
      transaction_type: 'wallet_recharge',
      amount: amount.toString()
    }
  });

  return Response.json({ checkout_url: session.url });
}
```

#### 3. Webhook Handler
```typescript
// /api/webhooks/stripe
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { business_account_id, amount } = session.metadata;

    // Add to wallet using database function
    const { data, error } = await supabase.rpc('add_to_wallet', {
      p_business_id: business_account_id,
      p_amount: parseFloat(amount),
      p_transaction_type: 'credit_added',
      p_description: `Wallet recharge via Stripe`,
      p_created_by: 'stripe'
    });

    if (!error) {
      // Send receipt email (optional)
      await sendWalletRechargeEmail(business_account_id, amount);
    }
  }

  return Response.json({ received: true });
}
```

#### 4. Configure Webhook in Stripe Dashboard
```
URL: https://yourdomain.com/api/webhooks/stripe
Events to listen:
- checkout.session.completed
```

---

## 🔒 Security & RLS Policies

### Row-Level Security Policies

#### business_users
```sql
-- Users can only view their own business user record
CREATE POLICY "Users view own record"
  ON business_users FOR SELECT
  USING (auth_user_id = auth.uid());

-- No direct INSERT/UPDATE (handled by signup/admin only)
```

#### business_accounts
```sql
-- Users can view their own business account
CREATE POLICY "Users view own business"
  ON business_accounts FOR SELECT
  USING (id IN (
    SELECT business_account_id
    FROM business_users
    WHERE auth_user_id = auth.uid()
  ));

-- Users can update their own business (limited fields)
CREATE POLICY "Users update own business"
  ON business_accounts FOR UPDATE
  USING (id IN (
    SELECT business_account_id
    FROM business_users
    WHERE auth_user_id = auth.uid()
  ))
  WITH CHECK (id IN (
    SELECT business_account_id
    FROM business_users
    WHERE auth_user_id = auth.uid()
  ));

-- Admins can view/manage all
CREATE POLICY "Admins manage all businesses"
  ON business_accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

#### business_bookings
```sql
-- Businesses can view their own bookings
CREATE POLICY "Business view own bookings"
  ON business_bookings FOR SELECT
  USING (business_account_id IN (
    SELECT business_account_id
    FROM business_users
    WHERE auth_user_id = auth.uid()
  ));

-- Businesses can create bookings
CREATE POLICY "Business create bookings"
  ON business_bookings FOR INSERT
  WITH CHECK (business_account_id IN (
    SELECT business_account_id
    FROM business_users
    WHERE auth_user_id = auth.uid()
  ));

-- Businesses can cancel their own bookings
CREATE POLICY "Business cancel own bookings"
  ON business_bookings FOR UPDATE
  USING (business_account_id IN (
    SELECT business_account_id
    FROM business_users
    WHERE auth_user_id = auth.uid()
  ));

-- Admins and vendors can view assigned bookings
CREATE POLICY "Admins view all business bookings"
  ON business_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'vendor')
    )
  );
```

#### wallet_transactions
```sql
-- Businesses can view their own transactions
CREATE POLICY "Business view own transactions"
  ON wallet_transactions FOR SELECT
  USING (business_account_id IN (
    SELECT business_account_id
    FROM business_users
    WHERE auth_user_id = auth.uid()
  ));

-- No direct INSERT (only via database functions)

-- Admins can view all
CREATE POLICY "Admins view all transactions"
  ON wallet_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## ⚙️ Database Functions

### 1. Atomic Wallet Deduction

```sql
CREATE OR REPLACE FUNCTION deduct_from_wallet(
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
  -- Get current balance with lock
  SELECT wallet_balance INTO v_current_balance
  FROM business_accounts
  WHERE id = p_business_id
  FOR UPDATE;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Deduct from wallet
  UPDATE business_accounts
  SET wallet_balance = wallet_balance - p_amount,
      updated_at = NOW()
  WHERE id = p_business_id
  RETURNING wallet_balance INTO v_new_balance;

  -- Log transaction
  INSERT INTO wallet_transactions (
    business_account_id,
    amount,
    transaction_type,
    description,
    reference_id,
    balance_after,
    created_by
  ) VALUES (
    p_business_id,
    -p_amount,
    'booking_deduction',
    p_description,
    p_booking_id,
    v_new_balance,
    'system'
  );

  RETURN v_new_balance;
END;
$$;
```

### 2. Atomic Wallet Credit

```sql
CREATE OR REPLACE FUNCTION add_to_wallet(
  p_business_id UUID,
  p_amount DECIMAL,
  p_transaction_type TEXT,
  p_description TEXT,
  p_created_by TEXT DEFAULT 'system',
  p_reference_id UUID DEFAULT NULL,
  p_stripe_payment_intent_id TEXT DEFAULT NULL
) RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  -- Add to wallet
  UPDATE business_accounts
  SET wallet_balance = wallet_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_business_id
  RETURNING wallet_balance INTO v_new_balance;

  -- Log transaction
  INSERT INTO wallet_transactions (
    business_account_id,
    amount,
    transaction_type,
    description,
    reference_id,
    balance_after,
    created_by,
    stripe_payment_intent_id
  ) VALUES (
    p_business_id,
    p_amount,
    p_transaction_type,
    p_description,
    p_reference_id,
    v_new_balance,
    p_created_by,
    p_stripe_payment_intent_id
  );

  RETURN v_new_balance;
END;
$$;
```

### 3. Booking Cancellation with Refund

```sql
CREATE OR REPLACE FUNCTION cancel_business_booking_with_refund(
  p_booking_id UUID,
  p_cancellation_reason TEXT
) RETURNS TABLE (
  refund_amount DECIMAL,
  new_balance DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_business_id UUID;
  v_refund_amount DECIMAL;
  v_new_balance DECIMAL;
  v_booking_number TEXT;
BEGIN
  -- Get booking details
  SELECT business_account_id, wallet_deduction_amount, booking_number
  INTO v_business_id, v_refund_amount, v_booking_number
  FROM business_bookings
  WHERE id = p_booking_id;

  -- Update booking status
  UPDATE business_bookings
  SET booking_status = 'cancelled',
      cancellation_reason = p_cancellation_reason,
      cancelled_at = NOW()
  WHERE id = p_booking_id;

  -- Refund to wallet
  SELECT * INTO v_new_balance
  FROM add_to_wallet(
    v_business_id,
    v_refund_amount,
    'refund',
    'Refund for cancelled booking ' || v_booking_number,
    'system',
    p_booking_id
  );

  RETURN QUERY SELECT v_refund_amount, v_new_balance;
END;
$$;
```

---

## 📦 Implementation Phases

### **Phase 1: Database Foundation** (3-4 days)

**Tasks:**
1. Create migration file for 4 tables
2. Add RLS policies
3. Create database functions (wallet operations)
4. Add indexes
5. Test with sample data

**Deliverables:**
- Migration file: `20250103_create_business_accounts.sql`
- Test script with sample business accounts

---

### **Phase 2: Business Authentication** (2-3 days)

**Tasks:**
1. Create business registration page
2. Implement signup API
3. Create business login page
4. Update middleware for `/business/*` routes
5. Create business context provider

**Deliverables:**
- `/business/register` page
- `/business/login` page
- `components/business/BusinessProvider.tsx`
- API: `/api/business/register`

---

### **Phase 3: Business Dashboard & Wallet** (3-4 days)

**Tasks:**
1. Create business dashboard layout
2. Implement wallet balance display
3. Create wallet transaction history page
4. Build Stripe recharge flow
5. Implement webhook handler

**Deliverables:**
- `/business/dashboard` page
- `/business/wallet` page
- Stripe integration
- Webhook: `/api/webhooks/stripe`

---

### **Phase 4: Booking Creation** (4-5 days)

**Tasks:**
1. Create booking creation wizard (reuse customer portal UI)
2. Add customer details form
3. Implement wallet deduction logic
4. Add booking confirmation
5. Email notifications to customers

**Deliverables:**
- `/business/bookings/new` page (multi-step)
- API: `/api/business/bookings` (POST)
- Email templates

---

### **Phase 5: Booking Management** (2-3 days)

**Tasks:**
1. Create bookings list page
2. Implement booking details page
3. Add cancellation with refund
4. Add export to CSV

**Deliverables:**
- `/business/bookings` page
- `/business/bookings/[id]` page
- API: `/api/business/bookings` (GET)
- Cancellation flow

---

### **Phase 6: Admin Integration** (3-4 days)

**Tasks:**
1. Create business accounts list page
2. Build business account details page
3. Implement manual credit adjustment
4. Update admin bookings view (unified)
5. Add business filters

**Deliverables:**
- `/admin/business-accounts` page
- `/admin/business-accounts/[id]` page
- Updated `/admin/bookings` page
- Admin APIs

---

### **Phase 7: Testing & Polish** (2-3 days)

**Tasks:**
1. End-to-end testing
2. Test wallet operations (race conditions)
3. Test Stripe integration (test mode)
4. UI polish and responsive design
5. Documentation

**Deliverables:**
- Test scenarios document
- Bug fixes
- Final documentation

---

## ⏱️ Total Timeline

**Estimated: 2.5 - 3 weeks** (19-26 working days)

---

## ✅ Features Summary

### Included:
✅ Business account registration & login
✅ Prepaid wallet system with Stripe recharge
✅ Create bookings on behalf of customers
✅ Wallet transaction history & export
✅ Booking management (list, view, cancel)
✅ Automatic refunds on cancellation
✅ Admin business account management
✅ Admin manual credit adjustment
✅ Unified booking view (customer + business)
✅ Email notifications to customers
✅ Audit trail for all wallet operations
✅ RLS policies for data security

### Not Included (Keep Simple):
❌ Multi-user teams per business
❌ User invitations and role management
❌ Custom domains or white-labeling
❌ Subscription billing
❌ Approval workflows
❌ Department/cost center tracking
❌ API access for third-party integration

---

## 🔮 Future Enhancements

When ready to expand, consider:

1. **Multi-User Support**
   - Add user roles per business (owner, manager, staff)
   - Invitation system
   - Permission management

2. **Advanced Billing**
   - Monthly invoicing instead of prepaid
   - Credit limits and terms (Net 30, etc.)
   - Automatic recharge when balance low

3. **Reporting & Analytics**
   - Dashboard charts (bookings over time, spend analysis)
   - Export reports (monthly statements)
   - Cost center/department tracking

4. **Approval Workflows**
   - Manager approval for high-value bookings
   - Spending limits per user

5. **API Access**
   - REST API for third-party integration
   - Webhooks for booking events
   - API key management

6. **White-Label Portal**
   - Custom branding (logo, colors)
   - Custom domain support
   - Email customization

---

## 📝 Notes

### Key Design Decisions:

1. **Prepaid Wallet vs. Invoicing**
   - Chose prepaid for simplicity and immediate payment
   - Reduces complexity of credit terms, collections
   - Can add invoicing later if needed

2. **One User Per Business Initially**
   - Simplifies authentication and permissions
   - Easy to extend to multi-user later
   - Most small businesses only need one login

3. **Reuse Existing Booking Infrastructure**
   - Separate table (business_bookings) but same structure
   - Vendor assignment workflow unchanged
   - Admin sees both types in unified view

4. **Stripe for Payments**
   - Industry standard, reliable
   - Easy integration
   - Handles PCI compliance
   - Good webhook support

5. **Database Functions for Wallet**
   - Ensures atomicity (no race conditions)
   - Centralized logic
   - Audit trail built-in

---

## 🚀 Getting Started

Once approved, implementation will begin with Phase 1 (Database Foundation).

**Next Steps:**
1. Review and approve this plan
2. Set up Stripe test account
3. Create database migrations
4. Begin Phase 1 implementation

---

**Document Version:** 1.0
**Last Updated:** 2025-01-03
**Status:** Pending Approval
