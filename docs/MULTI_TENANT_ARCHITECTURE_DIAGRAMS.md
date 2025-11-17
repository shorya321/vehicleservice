# Multi-Tenant Architecture Diagrams

**Document Version:** 1.0
**Created:** 2025-01-11
**Related:** [Clerk vs Supabase Analysis](./CLERK_VS_SUPABASE_MULTI_TENANT_ANALYSIS.md)

---

## Table of Contents

1. [Current System Architecture](#current-system-architecture)
2. [Custom Domain Routing Flow](#custom-domain-routing-flow)
3. [Booking Creation Flow](#booking-creation-flow)
4. [Clerk Organizations Architecture](#clerk-organizations-architecture)
5. [Comparison: Domain Verification](#comparison-domain-verification)
6. [Comparison: Authentication Flow](#comparison-authentication-flow)

---

## Current System Architecture

### High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USERS / BUSINESSES                               │
│                                                                          │
│  Hotel A               Hotel B               Hotel C                     │
│  (acme-hotel          (grand-plaza         (beach-resort                │
│   subdomain)          subdomain)           subdomain)                    │
│                                                                          │
│  transfers.acme.com   transfers.gp.com    beach-transfers.com           │
│  (custom domain)      (custom domain)     (custom domain)               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTPS Requests
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       VERCEL EDGE NETWORK                                │
│                                                                          │
│  • SSL Termination (automatic per domain)                               │
│  • CDN (global edge locations)                                          │
│  • DDoS protection                                                      │
│  • Domain routing to Next.js app                                        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS MIDDLEWARE                                    │
│                     (middleware.ts)                                      │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ 1. Extract host from request                               │         │
│  │    const host = request.headers.get('host')                │         │
│  │                                                            │         │
│  │ 2. Check if custom domain or subdomain                    │         │
│  │    • Custom: transfers.acme.com                           │         │
│  │    • Subdomain: acme-hotel.yourdomain.com                 │         │
│  │                                                            │         │
│  │ 3. Query business_accounts table                          │         │
│  │    WHERE custom_domain = host OR subdomain = host         │         │
│  │                                                            │         │
│  │ 4. If match found:                                        │         │
│  │    • Set business_account_id in headers                   │         │
│  │    • Rewrite URL to /business/* routes                    │         │
│  │    • Forward to application                               │         │
│  │                                                            │         │
│  │ 5. If no match:                                           │         │
│  │    • Serve public routes (/, /search)                     │         │
│  └────────────────────────────────────────────────────────────┘         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                                   │
│                      (App Router)                                        │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │  /business/* Routes (Business Portal)                        │       │
│  │  ├── /business/dashboard                                     │       │
│  │  ├── /business/bookings                                      │       │
│  │  ├── /business/bookings/new (Create Booking)                 │       │
│  │  ├── /business/wallet (Wallet Management)                    │       │
│  │  ├── /business/domain (Custom Domain Setup)                  │       │
│  │  └── /business/settings                                      │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │  API Routes                                                  │       │
│  │  ├── /api/business/bookings (Create, List)                   │       │
│  │  ├── /api/business/wallet/checkout (Stripe)                  │       │
│  │  ├── /api/business/wallet/webhook (Stripe)                   │       │
│  │  └── /api/business/domain/verify (DNS Check)                 │       │
│  └──────────────────────────────────────────────────────────────┘       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  SUPABASE (Backend Services)                             │
│                                                                          │
│  ┌──────────────────────────┐    ┌──────────────────────────┐          │
│  │   Supabase Auth          │    │   PostgreSQL Database    │          │
│  │                          │    │                          │          │
│  │  • User authentication   │    │  ┌────────────────────┐  │          │
│  │  • Session management    │    │  │ business_accounts  │  │          │
│  │  • JWT tokens            │    │  │  - wallet_balance  │  │          │
│  │  • Email verification    │    │  │  - custom_domain   │  │          │
│  └────────────┬─────────────┘    │  │  - subdomain       │  │          │
│               │                  │  │  - verified        │  │          │
│               │                  │  └────────────────────┘  │          │
│               │                  │                          │          │
│               │                  │  ┌────────────────────┐  │          │
│               └──────────────────┼─▶│ business_users     │  │          │
│                                  │  │  - auth_user_id    │  │          │
│                                  │  │  - business_id     │  │          │
│                                  │  └────────────────────┘  │          │
│                                  │                          │          │
│                                  │  ┌────────────────────┐  │          │
│                                  │  │ business_bookings  │  │          │
│                                  │  │  - customer info   │  │          │
│                                  │  │  - route details   │  │          │
│                                  │  │  - total_price     │  │          │
│                                  │  └────────────────────┘  │          │
│                                  │                          │          │
│                                  │  ┌────────────────────┐  │          │
│                                  │  │ wallet_transactions│  │          │
│                                  │  │  - amount          │  │          │
│                                  │  │  - type            │  │          │
│                                  │  │  - balance_after   │  │          │
│                                  │  └────────────────────┘  │          │
│                                  │                          │          │
│                                  │  Row Level Security (RLS)│          │
│                                  │  • Tenant isolation     │          │
│                                  │  • Role-based access    │          │
│                                  └──────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                                   │
│                                                                          │
│  ┌──────────────────────┐    ┌──────────────────────┐                  │
│  │   Stripe Payments    │    │   DNS Providers      │                  │
│  │  • Checkout sessions │    │  • Cloudflare        │                  │
│  │  • Webhook events    │    │  • GoDaddy           │                  │
│  │  • Payment intents   │    │  • Namecheap         │                  │
│  └──────────────────────┘    └──────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Custom Domain Routing Flow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Business Configures Custom Domain                       │
│ Location: /business/domain                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Business enters: transfers.acmehotel.com
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ POST /api/business/domain                                        │
│                                                                  │
│ 1. Validate domain format                                       │
│ 2. Check if domain already exists (UNIQUE constraint)           │
│ 3. Generate verification token:                                 │
│    verify-1704240000000-abc123xyz789                           │
│ 4. Save to database:                                            │
│    UPDATE business_accounts SET                                 │
│      custom_domain = 'transfers.acmehotel.com',                │
│      domain_verification_token = 'verify-...',                 │
│      custom_domain_verified = false                            │
│                                                                  │
│ Response: { token, dns_instructions }                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Business Adds DNS Records                               │
│ Location: DNS Provider (Cloudflare, GoDaddy, etc.)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Business adds TWO records:
                           │
                           ▼
      ┌────────────────────────────────────────────────┐
      │ CNAME Record                                   │
      │ Name:  transfers.acmehotel.com                 │
      │ Value: cname.vercel-dns.com                    │
      │ TTL:   Auto (or 3600)                          │
      └────────────────────────────────────────────────┘
                           │
                           ▼
      ┌────────────────────────────────────────────────┐
      │ TXT Record                                     │
      │ Name:  _verify.transfers.acmehotel.com         │
      │ Value: verify-1704240000000-abc123xyz789       │
      │ TTL:   Auto (or 3600)                          │
      └────────────────────────────────────────────────┘
                           │
                           │ DNS Propagation (5-30 minutes)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Business Clicks "Verify DNS"                            │
│ Location: /business/domain                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Click "Verify DNS" button
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ POST /api/business/domain/verify                                 │
│                                                                  │
│ 1. Fetch business custom_domain and verification_token          │
│                                                                  │
│ 2. DNS CNAME Lookup:                                            │
│    import { resolveCname } from 'dns/promises';                │
│    const records = await resolveCname('transfers.acmehotel.com')│
│    ✅ Check if includes 'vercel-dns.com'                        │
│                                                                  │
│ 3. DNS TXT Lookup:                                              │
│    import { resolveTxt } from 'dns/promises';                  │
│    const records = await resolveTxt('_verify.transfers...')    │
│    ✅ Check if matches verification_token                       │
│                                                                  │
│ 4. If BOTH valid:                                               │
│    UPDATE business_accounts SET                                 │
│      custom_domain_verified = true,                            │
│      custom_domain_verified_at = NOW()                         │
│                                                                  │
│ 5. If NOT valid:                                                │
│    Return: { verified: false, cname_valid: ?, txt_valid: ? }   │
│                                                                  │
│ Response: { verified: true, message: 'Domain verified!' }       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Vercel SSL Provisioning (Automatic)                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Vercel detects CNAME → auto-provisions SSL
                           │ Certificate issued by Let's Encrypt
                           │ HTTPS enabled automatically
                           │ (within 24 hours, usually < 1 hour)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Domain Routing Active                                   │
│ Location: middleware.ts                                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ User visits: https://transfers.acmehotel.com
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ middleware.ts                                                    │
│                                                                  │
│ const host = request.headers.get('host');                       │
│ // host = 'transfers.acmehotel.com'                             │
│                                                                  │
│ const { data: business } = await supabase                       │
│   .from('business_accounts')                                    │
│   .select('id, business_name')                                  │
│   .eq('custom_domain', host)                                    │
│   .eq('custom_domain_verified', true)                           │
│   .single();                                                    │
│                                                                  │
│ if (business) {                                                 │
│   // ✅ Match found! This is Acme Hotel                         │
│   request.headers.set('x-business-id', business.id);           │
│   return NextResponse.rewrite('/business/dashboard');           │
│ }                                                               │
│                                                                  │
│ // User sees Acme Hotel's branded booking portal                │
└─────────────────────────────────────────────────────────────────┘
```

### DNS Records Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  DNS Zone: acmehotel.com                         │
└─────────────────────────────────────────────────────────────────┘

Record Type: CNAME
┌──────────────────────────┐              ┌────────────────────────┐
│ transfers.acmehotel.com  │  ──────────▶ │ cname.vercel-dns.com   │
└──────────────────────────┘              └────────────────────────┘
        (Host/Name)                              (Value/Target)

Record Type: TXT
┌──────────────────────────────────┐    ┌──────────────────────────┐
│ _verify.transfers.acmehotel.com  │ ─▶ │ verify-170424-abc123xyz  │
└──────────────────────────────────┘    └──────────────────────────┘
        (Host/Name)                            (Value/Content)
                                           (Verification Token)
```

---

## Booking Creation Flow

### Complete Atomic Transaction Process

```
┌─────────────────────────────────────────────────────────────────┐
│ USER ACTION: Business staff creates booking for customer        │
│ Location: /business/bookings/new                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Booking Wizard - Route Selection                        │
│                                                                  │
│ Form Fields:                                                     │
│ • From Location: [Dropdown] ───▶ Dubai International Airport    │
│ • To Location: [Dropdown] ─────▶ Burj Al Arab Hotel             │
│ • Pickup Address: [Text] ──────▶ Terminal 3, Arrivals           │
│ • Dropoff Address: [Text] ─────▶ Jumeirah St, Dubai             │
│ • Pickup DateTime: [DateTime] ─▶ 2025-01-15 10:00 AM            │
│                                                                  │
│ [Next Step] Button                                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Vehicle Selection                                       │
│                                                                  │
│ Available Vehicles:                                              │
│ ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│ │ Sedan            │  │ SUV              │  │ Van            │ │
│ │ 4 passengers     │  │ 6 passengers     │  │ 8 passengers   │ │
│ │ 3 luggage        │  │ 5 luggage        │  │ 10 luggage     │ │
│ │ $80.00           │  │ $120.00          │  │ $150.00        │ │
│ │ [Select] ✓       │  │ [Select]         │  │ [Select]       │ │
│ └──────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                  │
│ [Next Step] Button                                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Customer Details                                        │
│                                                                  │
│ Customer Information:                                            │
│ • Customer Name: [Text] ──────────▶ John Smith                  │
│ • Customer Email: [Email] ─────────▶ john@example.com           │
│ • Customer Phone: [Phone] ─────────▶ +1 234 567 8900            │
│                                                                  │
│ Booking Details:                                                 │
│ • Passengers: [Number] ────────────▶ 2 adults                   │
│ • Luggage: [Number] ───────────────▶ 3 bags                     │
│ • Special Notes: [Textarea] ───────▶ Flight arrives at 9:30 AM  │
│                                                                  │
│ Price Calculation:                                               │
│ • Base Price: $80.00                                            │
│ • Amenities: $0.00                                              │
│ • Total: $80.00                                                 │
│                                                                  │
│ [Next Step] Button                                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Review & Confirm                                        │
│                                                                  │
│ Booking Summary:                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Route: Dubai Airport → Burj Al Arab                         │ │
│ │ Date: Jan 15, 2025 at 10:00 AM                              │ │
│ │ Vehicle: Sedan (4 passengers, 3 luggage)                    │ │
│ │ Customer: John Smith (john@example.com)                     │ │
│ │ Passengers: 2 adults, 3 bags                                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Wallet Balance Check:                                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Current Balance: $500.00                                    │ │
│ │ Booking Cost:    $80.00                                     │ │
│ │ ────────────────────────────────                            │ │
│ │ Remaining:       $420.00 ✅                                  │ │
│ │                                                             │ │
│ │ ✅ Sufficient balance to create booking                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [Create Booking] Button (ENABLED)                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ User clicks "Create Booking"
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ API CALL: POST /api/business/bookings                           │
│                                                                  │
│ Request Body:                                                    │
│ {                                                               │
│   "customer_name": "John Smith",                                │
│   "customer_email": "john@example.com",                         │
│   "customer_phone": "+1234567890",                              │
│   "from_location_id": "uuid-from",                              │
│   "to_location_id": "uuid-to",                                  │
│   "pickup_address": "Terminal 3, Arrivals",                     │
│   "dropoff_address": "Jumeirah St, Dubai",                      │
│   "pickup_datetime": "2025-01-15T10:00:00Z",                    │
│   "vehicle_type_id": "uuid-sedan",                              │
│   "passenger_count": 2,                                         │
│   "luggage_count": 3,                                           │
│   "total_price": 80.00,                                         │
│   "customer_notes": "Flight arrives at 9:30 AM"                 │
│ }                                                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ SERVER: Validate Input (Zod Schema)                             │
│                                                                  │
│ const validated = bookingCreationSchema.parse(body);            │
│                                                                  │
│ Checks:                                                          │
│ ✅ customer_name: min 2 chars, max 100                          │
│ ✅ customer_email: valid email format                           │
│ ✅ customer_phone: valid phone format                           │
│ ✅ pickup_datetime: at least 2 hours in future                  │
│ ✅ total_price: positive number                                 │
│ ✅ passenger_count: 1-20                                        │
│ ✅ luggage_count: 0-50                                          │
│                                                                  │
│ If validation fails → 400 Bad Request                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ DATABASE: Atomic Transaction                                    │
│ Function: create_booking_with_wallet_deduction()                │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ BEGIN TRANSACTION; ────────────────────────────────────────┐│ │
│ │                                                            ││ │
│ │ 1. Lock business_accounts row (FOR UPDATE)                 ││ │
│ │    SELECT wallet_balance                                   ││ │
│ │    FROM business_accounts                                  ││ │
│ │    WHERE id = 'business-uuid'                              ││ │
│ │    FOR UPDATE;  ◀──── Other transactions WAIT here        ││ │
│ │                                                            ││ │
│ │    Result: wallet_balance = $500.00                        ││ │
│ │                                                            ││ │
│ │ 2. Check sufficient balance                                ││ │
│ │    IF wallet_balance < total_price THEN                    ││ │
│ │      RAISE EXCEPTION 'Insufficient wallet balance';        ││ │
│ │    END IF;                                                 ││ │
│ │                                                            ││ │
│ │    Check: $500.00 >= $80.00 ✅ PASS                        ││ │
│ │                                                            ││ │
│ │ 3. Generate booking number                                 ││ │
│ │    booking_number = 'BB-20250115-0001'                     ││ │
│ │                                                            ││ │
│ │ 4. Create booking record                                   ││ │
│ │    INSERT INTO business_bookings (                         ││ │
│ │      id,                                                   ││ │
│ │      booking_number,                                       ││ │
│ │      business_account_id,                                  ││ │
│ │      customer_name,                                        ││ │
│ │      customer_email,                                       ││ │
│ │      customer_phone,                                       ││ │
│ │      from_location_id,                                     ││ │
│ │      to_location_id,                                       ││ │
│ │      pickup_address,                                       ││ │
│ │      dropoff_address,                                      ││ │
│ │      pickup_datetime,                                      ││ │
│ │      vehicle_type_id,                                      ││ │
│ │      passenger_count,                                      ││ │
│ │      luggage_count,                                        ││ │
│ │      total_price,                                          ││ │
│ │      wallet_deduction_amount,                              ││ │
│ │      booking_status,                                       ││ │
│ │      customer_notes,                                       ││ │
│ │      created_at                                            ││ │
│ │    ) VALUES (                                              ││ │
│ │      uuid_generate_v4(),                                   ││ │
│ │      'BB-20250115-0001',                                   ││ │
│ │      'business-uuid',                                      ││ │
│ │      'John Smith',                                         ││ │
│ │      'john@example.com',                                   ││ │
│ │      '+1234567890',                                        ││ │
│ │      'uuid-from',                                          ││ │
│ │      'uuid-to',                                            ││ │
│ │      'Terminal 3, Arrivals',                               ││ │
│ │      'Jumeirah St, Dubai',                                 ││ │
│ │      '2025-01-15 10:00:00+00',                             ││ │
│ │      'uuid-sedan',                                         ││ │
│ │      2,                                                    ││ │
│ │      3,                                                    ││ │
│ │      80.00,                                                ││ │
│ │      80.00,                                                ││ │
│ │      'pending',                                            ││ │
│ │      'Flight arrives at 9:30 AM',                          ││ │
│ │      NOW()                                                 ││ │
│ │    )                                                       ││ │
│ │    RETURNING id INTO v_booking_id;                         ││ │
│ │                                                            ││ │
│ │    Result: booking created with ID = booking-uuid          ││ │
│ │                                                            ││ │
│ │ 5. Deduct from wallet                                      ││ │
│ │    UPDATE business_accounts                                ││ │
│ │    SET wallet_balance = wallet_balance - 80.00            ││ │
│ │    WHERE id = 'business-uuid'                              ││ │
│ │    RETURNING wallet_balance INTO v_new_balance;            ││ │
│ │                                                            ││ │
│ │    Result: new wallet_balance = $420.00                    ││ │
│ │                                                            ││ │
│ │ 6. Log transaction                                         ││ │
│ │    INSERT INTO wallet_transactions (                       ││ │
│ │      id,                                                   ││ │
│ │      business_account_id,                                  ││ │
│ │      amount,                                               ││ │
│ │      transaction_type,                                     ││ │
│ │      description,                                          ││ │
│ │      reference_id,                                         ││ │
│ │      balance_after,                                        ││ │
│ │      created_by,                                           ││ │
│ │      created_at                                            ││ │
│ │    ) VALUES (                                              ││ │
│ │      uuid_generate_v4(),                                   ││ │
│ │      'business-uuid',                                      ││ │
│ │      -80.00,  ◀─── Negative = deduction                   ││ │
│ │      'booking_deduction',                                  ││ │
│ │      'Booking BB-20250115-0001',                           ││ │
│ │      v_booking_id,                                         ││ │
│ │      420.00,  ◀─── Audit trail: balance after            ││ │
│ │      'system',                                             ││ │
│ │      NOW()                                                 ││ │
│ │    );                                                      ││ │
│ │                                                            ││ │
│ │ 7. Return booking ID                                       ││ │
│ │    RETURN v_booking_id;                                    ││ │
│ │                                                            ││ │
│ │ COMMIT; ◀──────────────────────────────────────────────────││ │
│ │ All changes saved permanently                              ││ │
│ │                                                            ││ │
│ │ IF ANY STEP FAILS:                                         ││ │
│ │   ROLLBACK; ◀──── All changes undone                      ││ │
│ │   RAISE EXCEPTION with error message;                      ││ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ API RESPONSE: Success                                            │
│                                                                  │
│ Status: 200 OK                                                   │
│ Body:                                                            │
│ {                                                               │
│   "success": true,                                              │
│   "data": {                                                     │
│     "id": "booking-uuid",                                       │
│     "booking_number": "BB-20250115-0001",                       │
│     "message": "Booking created successfully"                   │
│   }                                                             │
│ }                                                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT: Handle Success                                           │
│                                                                  │
│ 1. Show success toast notification                              │
│    "Booking created successfully!"                              │
│                                                                  │
│ 2. Redirect to booking details page                             │
│    /business/bookings/BB-20250115-0001                          │
│                                                                  │
│ 3. Dashboard stats auto-update                                  │
│    • Total bookings: +1                                         │
│    • Wallet balance: $500.00 → $420.00                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKGROUND: Send Email to Customer                              │
│                                                                  │
│ To: john@example.com                                            │
│ Subject: Booking Confirmation - BB-20250115-0001                │
│ Body:                                                            │
│   • Booking details                                             │
│   • Pickup location & time                                      │
│   • Vehicle details                                             │
│   • Contact information                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Race Condition Prevention

```
SCENARIO: Two staff members try to create bookings simultaneously

┌──────────────────┐                        ┌──────────────────┐
│  Staff Member A  │                        │  Staff Member B  │
│  (Terminal 1)    │                        │  (Terminal 2)    │
└────────┬─────────┘                        └────────┬─────────┘
         │                                           │
         │ Create Booking ($80)                      │
         │ t=0ms                                     │
         ▼                                           │
   ┌─────────────┐                                   │
   │ Database    │                                   │
   │ LOCK row    │◀─── FOR UPDATE                   │
   │ Balance:    │                                   │
   │ $100.00     │                                   │
   └─────────────┘                                   │
         │                                           │
         │ Check: $100 >= $80 ✅                     │ Create Booking ($60)
         │                                           │ t=10ms
         │ Deduct: $100 - $80 = $20                  │
         │                                           ▼
         │                                     ┌─────────────┐
         │ Commit & Release Lock               │ WAITING...  │
         │ t=50ms                               │ (blocked)   │
         ▼                                     └─────────────┘
   ┌─────────────┐                                   │
   │ Database    │                                   │
   │ Balance:    │                                   │
   │ $20.00      │                                   │
   └─────────────┘                                   │
                                                     │ NOW can proceed
                                                     ▼
                                               ┌─────────────┐
                                               │ LOCK row    │
                                               │ Balance:    │
                                               │ $20.00      │
                                               └─────────────┘
                                                     │
                                                     │ Check: $20 >= $60 ❌
                                                     │
                                                     ▼
                                               ┌─────────────┐
                                               │ ROLLBACK    │
                                               │ Error:      │
                                               │ Insufficient│
                                               │ balance     │
                                               └─────────────┘

RESULT: Only ONE booking succeeds. Second booking correctly rejects.
✅ No race condition
✅ Wallet balance accurate
✅ Complete audit trail
```

---

## Clerk Organizations Architecture

### If You Migrated to Clerk

```
┌─────────────────────────────────────────────────────────────────┐
│                    USERS / BUSINESSES                            │
│                                                                  │
│  Hotel A                Hotel B                Hotel C           │
│  (Clerk Org ID:        (Clerk Org ID:        (Clerk Org ID:     │
│   org_2abc123)          org_2def456)          org_2ghi789)      │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           │ ⚠️ PROBLEM: How to route custom domains?
                           │ Clerk doesn't provide this functionality
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│             CUSTOM IMPLEMENTATION NEEDED                         │
│         (You would need to build this yourself)                  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Custom Domains Table (YOUR DATABASE)                      │  │
│  │                                                            │  │
│  │ CREATE TABLE custom_domains (                             │  │
│  │   id UUID PRIMARY KEY,                                    │  │
│  │   clerk_org_id TEXT NOT NULL,                             │  │
│  │   domain TEXT UNIQUE NOT NULL,                            │  │
│  │   verified BOOLEAN DEFAULT false,                         │  │
│  │   verification_token TEXT,                                │  │
│  │   created_at TIMESTAMPTZ DEFAULT NOW()                    │  │
│  │ );                                                        │  │
│  │                                                            │  │
│  │ INSERT VALUES:                                            │  │
│  │ ('uuid1', 'org_2abc123', 'transfers.acme.com', true, ...) │  │
│  │ ('uuid2', 'org_2def456', 'transfers.gp.com', true, ...)   │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              NEXT.JS MIDDLEWARE (Custom)                         │
│                                                                  │
│  const host = request.headers.get('host');                      │
│                                                                  │
│  // Query YOUR custom table                                     │
│  const { data: domainConfig } = await supabase                  │
│    .from('custom_domains')                                      │
│    .select('clerk_org_id')                                      │
│    .eq('domain', host)                                          │
│    .eq('verified', true)                                        │
│    .single();                                                   │
│                                                                  │
│  if (domainConfig) {                                            │
│    // Set active org in Clerk session                           │
│    await clerk.setActive({                                      │
│      organization: domainConfig.clerk_org_id                    │
│    });                                                          │
│    return NextResponse.rewrite('/business/dashboard');          │
│  }                                                              │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLERK AUTHENTICATION                        │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Clerk Session & Organization Context                      │  │
│  │                                                            │  │
│  │ const { userId, orgId } = auth();                         │  │
│  │ // userId: 'user_2xyz123'                                 │  │
│  │ // orgId: 'org_2abc123'                                   │  │
│  │                                                            │  │
│  │ const { organization } = useOrganization();               │  │
│  │ // organization.name: 'Acme Hotel'                        │  │
│  │ // organization.membersCount: 5                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│            YOUR APPLICATION DATABASE (Supabase)                  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ business_accounts                                         │  │
│  │  - id                                                     │  │
│  │  - clerk_org_id ◀──── Maps to Clerk organization         │  │
│  │  - wallet_balance                                         │  │
│  │  - business_name                                          │  │
│  │  - ...                                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ business_bookings                                         │  │
│  │  - id                                                     │  │
│  │  - business_account_id ◀──── Still needed                │  │
│  │  - created_by_clerk_user_id ◀──── Clerk user ID          │  │
│  │  - customer_name                                          │  │
│  │  - total_price                                            │  │
│  │  - ...                                                    │  │
│  │                                                            │  │
│  │ ⚠️ Atomic operations STILL needed                         │  │
│  │ ⚠️ Wallet logic STILL in your database                    │  │
│  │ ⚠️ RLS policies STILL needed                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Clerk Organizations Features You WOULD Get:

```
┌─────────────────────────────────────────────────────────────────┐
│                CLERK ORGANIZATION MANAGEMENT                     │
└─────────────────────────────────────────────────────────────────┘

Feature 1: Multi-User Teams
┌───────────────────────────────────────┐
│ Acme Hotel Organization               │
│ org_2abc123                           │
│                                       │
│ Members:                              │
│ ├─ John Manager (admin)               │
│ ├─ Sarah Receptionist (member)        │
│ ├─ Mike BookingAgent (member)         │
│ └─ Lisa Finance (member)              │
└───────────────────────────────────────┘

Feature 2: Role-Based Permissions
┌───────────────────────────────────────┐
│ Roles & Permissions                   │
│                                       │
│ Admin Role:                           │
│ ✅ Create bookings                    │
│ ✅ View wallet                        │
│ ✅ Recharge wallet                    │
│ ✅ Invite members                     │
│ ✅ Manage settings                    │
│                                       │
│ Member Role:                          │
│ ✅ Create bookings                    │
│ ✅ View wallet                        │
│ ❌ Recharge wallet                    │
│ ❌ Invite members                     │
│ ❌ Manage settings                    │
└───────────────────────────────────────┘

Feature 3: Built-in Invitation System
┌───────────────────────────────────────┐
│ Invite Team Member                    │
│                                       │
│ Email: sarah@acmehotel.com            │
│ Role:  [Member ▼]                     │
│                                       │
│ [Send Invitation]                     │
│                                       │
│ • Email sent automatically            │
│ • Sarah clicks link                   │
│ • Signs up with Clerk                 │
│ • Automatically joins Acme Hotel org  │
└───────────────────────────────────────┘

Feature 4: Verified Domains (Email-based)
┌───────────────────────────────────────┐
│ ⚠️ NOT for custom domain routing!     │
│                                       │
│ Purpose: Auto-invite users with       │
│          matching email domains       │
│                                       │
│ Example:                              │
│ 1. Verify domain: acmehotel.com       │
│ 2. Email code to admin@acmehotel.com  │
│ 3. Admin enters verification code     │
│ 4. Domain verified ✅                 │
│                                       │
│ Now any user with @acmehotel.com      │
│ email gets invited automatically      │
│                                       │
│ ⚠️ Does NOT enable custom domain      │
│    routing (transfers.acmehotel.com)  │
└───────────────────────────────────────┘

Feature 5: Pre-built UI Components
┌───────────────────────────────────────┐
│ <OrganizationSwitcher />              │
│ ┌─────────────────────────────────┐   │
│ │ Acme Hotel                  ▼  │   │
│ │ ─────────────────────────────  │   │
│ │ ✓ Acme Hotel                   │   │
│ │   Grand Plaza Hotel            │   │
│ │   Beach Resort                 │   │
│ │ ─────────────────────────────  │   │
│ │ + Create new organization      │   │
│ └─────────────────────────────────┘   │
│                                       │
│ <OrganizationProfile />               │
│ ┌─────────────────────────────────┐   │
│ │ Members:                        │   │
│ │ • John Manager (admin)          │   │
│ │ • Sarah Receptionist (member)   │   │
│ │                                 │   │
│ │ [+ Invite member]               │   │
│ │                                 │   │
│ │ Settings:                       │   │
│ │ • Organization name             │   │
│ │ • Domain verification           │   │
│ │ • Member permissions            │   │
│ └─────────────────────────────────┘   │
└───────────────────────────────────────┘
```

---

## Comparison: Domain Verification

### Current System (DNS-Based)

```
Purpose: Custom domain routing + white-labeling
Method: DNS records (CNAME + TXT)
Time: 5-30 minutes (DNS propagation)

┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Business Configures Domain                              │
│ Input: transfers.acmehotel.com                                   │
│ Action: Generate verification token                              │
│ Token: verify-1704240000000-abc123xyz789                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Add DNS Records                                         │
│                                                                  │
│ Record 1: CNAME                                                 │
│ Name:  transfers.acmehotel.com                                   │
│ Value: cname.vercel-dns.com                                      │
│ Purpose: Route traffic to your app                              │
│                                                                  │
│ Record 2: TXT                                                   │
│ Name:  _verify.transfers.acmehotel.com                           │
│ Value: verify-1704240000000-abc123xyz789                         │
│ Purpose: Prove domain ownership                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: System Verifies                                         │
│                                                                  │
│ Check 1: CNAME Lookup                                           │
│ dig CNAME transfers.acmehotel.com                                │
│ Expected: cname.vercel-dns.com ✅                                │
│                                                                  │
│ Check 2: TXT Lookup                                             │
│ dig TXT _verify.transfers.acmehotel.com                          │
│ Expected: verify-1704240000000-abc123xyz789 ✅                   │
│                                                                  │
│ Result: Both valid → Mark domain as verified                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Domain Active                                           │
│ • Middleware routes transfers.acmehotel.com → Acme Hotel portal  │
│ • SSL certificate auto-provisioned by Vercel                    │
│ • Full white-labeling enabled                                   │
└─────────────────────────────────────────────────────────────────┘

Benefits:
✅ Proves domain ownership (TXT record)
✅ Routes traffic correctly (CNAME record)
✅ Automatic SSL provisioning
✅ Full control over verification process
✅ Industry standard method
```

### Clerk Organizations (Email-Based)

```
Purpose: Email-based organization membership (NOT domain routing)
Method: Email verification code
Time: Immediate (email delivery)

┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Create Domain in Clerk                                  │
│ API: organization.createDomain('acmehotel.com')                  │
│ Purpose: Enable auto-invite for @acmehotel.com emails           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Prepare Verification                                    │
│ API: domain.prepareAffiliationVerification({                    │
│   affiliationEmailAddress: 'admin@acmehotel.com'                │
│ })                                                              │
│                                                                  │
│ Action: Clerk sends email with 6-digit code                     │
│ To: admin@acmehotel.com                                         │
│ Subject: Verify your organization domain                        │
│ Body: Your verification code is: 123456                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Enter Code                                              │
│ API: domain.attemptAffiliationVerification({                    │
│   code: '123456'                                                │
│ })                                                              │
│                                                                  │
│ Check: Does code match? ✅                                       │
│ Result: Domain verified in Clerk                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Domain Verified                                         │
│ Purpose: Now users with @acmehotel.com emails can:              │
│ • Be auto-invited to organization                               │
│ • Be suggested to join organization                             │
│ • Manually invited by admins                                    │
│                                                                  │
│ ⚠️ Does NOT enable custom domain routing                        │
│ ⚠️ Does NOT set up transfers.acmehotel.com                      │
│ ⚠️ Unrelated to white-labeling                                  │
└─────────────────────────────────────────────────────────────────┘

Limitations:
❌ Does NOT prove domain ownership (anyone with email access)
❌ Does NOT route traffic
❌ Does NOT enable SSL
❌ Different purpose (membership management, not domain routing)
```

### Side-by-Side Comparison

| Aspect | Current (DNS) | Clerk (Email) |
|--------|--------------|---------------|
| **Purpose** | Custom domain routing | Email-based org membership |
| **Verification Method** | DNS records (CNAME + TXT) | Email verification code |
| **Proves Domain Ownership** | ✅ Yes (TXT record) | ⚠️ No (only email access) |
| **Enables Domain Routing** | ✅ Yes | ❌ No |
| **White-Labeling Support** | ✅ Yes | ❌ No |
| **SSL Provisioning** | ✅ Automatic (Vercel) | ❌ N/A |
| **Setup Time** | 5-30 minutes (DNS propagation) | Immediate (email) |
| **Complexity** | Medium (DNS configuration) | Low (enter code) |
| **Use Case** | `transfers.acme.com` → Hotel portal | Auto-invite `user@acme.com` |

---

## Comparison: Authentication Flow

### Current System (Supabase Auth)

```
┌─────────────────────────────────────────────────────────────────┐
│ User Login Flow                                                  │
└─────────────────────────────────────────────────────────────────┘

1. User Visit: https://transfers.acmehotel.com
   ↓
2. Middleware: Identifies business (custom_domain match)
   ↓
3. Login Page: /business/login
   ├─ Email: john@acmehotel.com
   └─ Password: ••••••••••
   ↓
4. Supabase Auth: signInWithPassword()
   ├─ Validates credentials
   ├─ Creates session (JWT)
   └─ Returns user object
   ↓
5. Check Business User:
   SELECT * FROM business_users
   WHERE auth_user_id = user.id
   ↓
6. Success: Redirect to /business/dashboard
   ├─ Session stored in cookie
   ├─ JWT contains user_id
   └─ RLS policies use auth.uid()

Key Points:
✅ Single user per business (simple)
✅ Direct database mapping (auth_user_id → business_account_id)
✅ RLS policies enforced at database level
✅ No external API calls during request
```

### With Clerk Organizations

```
┌─────────────────────────────────────────────────────────────────┐
│ User Login Flow                                                  │
└─────────────────────────────────────────────────────────────────┘

1. User Visit: https://transfers.acmehotel.com
   ↓
2. Middleware: Custom lookup (domain → org_id)
   ├─ Query custom_domains table
   ├─ Find clerk_org_id
   └─ Call clerk.setActive({ organization: org_id })
   ↓
3. Login Page: Clerk <SignIn /> component
   ├─ Email: john@acmehotel.com
   ├─ Password: ••••••••••
   └─ Optional: 2FA, OAuth
   ↓
4. Clerk Auth: Validates credentials
   ├─ Creates session
   ├─ Returns userId + orgId
   └─ Session synced across devices
   ↓
5. Check Organization Membership:
   const membership = await organization.getMembership({ userId })
   ├─ Returns role (admin, member, custom)
   └─ Returns permissions
   ↓
6. Map to Business Account:
   SELECT * FROM business_accounts
   WHERE clerk_org_id = orgId
   ↓
7. Success: Redirect to /business/dashboard
   ├─ Session stored via Clerk
   ├─ JWT contains userId + orgId + role
   └─ Permission checks via Clerk API

Key Points:
✅ Multi-user per organization (complex)
✅ Built-in role management
✅ Requires API calls to Clerk during requests
⚠️ More moving parts (Clerk + your DB)
```

### Code Comparison

#### Current System

```typescript
// app/business/dashboard/page.tsx
export default async function BusinessDashboardPage() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/business/login');

  // Get business account
  const { data: businessUser } = await supabase
    .from('business_users')
    .select('business_account_id, business_accounts(*)')
    .eq('auth_user_id', user.id)
    .single();

  // businessUser.business_accounts contains everything needed
  const walletBalance = businessUser.business_accounts.wallet_balance;
  const businessName = businessUser.business_accounts.business_name;

  return <Dashboard balance={walletBalance} name={businessName} />;
}
```

#### With Clerk

```typescript
// app/business/dashboard/page.tsx
import { auth } from '@clerk/nextjs';

export default async function BusinessDashboardPage() {
  // Get Clerk auth
  const { userId, orgId } = auth();
  if (!userId || !orgId) redirect('/business/login');

  // Check organization membership
  const { organization } = await clerkClient.organizations.getOrganization(orgId);
  const membership = await organization.getMembership({ userId });

  // Map to business account
  const supabase = await createClient();
  const { data: businessAccount } = await supabase
    .from('business_accounts')
    .select('*')
    .eq('clerk_org_id', orgId)
    .single();

  // membership.role contains 'admin', 'member', etc.
  const walletBalance = businessAccount.wallet_balance;
  const businessName = businessAccount.business_name;
  const userRole = membership.role;

  return (
    <Dashboard
      balance={walletBalance}
      name={businessName}
      role={userRole}
    />
  );
}
```

**Comparison:**
- Current: 2 database queries
- Clerk: 2 Clerk API calls + 1 database query
- Current: Simpler auth flow
- Clerk: More flexible role management

---

## Conclusion

### Summary Table

| Feature | Current Supabase | Clerk Organizations | Winner for Your Use Case |
|---------|-----------------|--------------------|-----------------------|
| Custom Domain Routing | ✅ Full implementation | ❌ Need custom build | **Supabase** |
| Domain Verification | ✅ DNS-based (industry standard) | ⚠️ Email-based (different purpose) | **Supabase** |
| White-Labeling | ✅ Complete | ❌ Not supported | **Supabase** |
| Single User per Business | ✅ Simple & efficient | ⚠️ Overkill | **Supabase** |
| Multi-User Teams | ⚠️ Need custom build | ✅ Native support | **Clerk** |
| Role Management | ⚠️ Basic | ✅ Advanced | **Clerk** |
| Wallet Integration | ✅ Tightly integrated | ⚠️ Separate implementation | **Supabase** |
| Atomic Operations | ✅ PostgreSQL transactions | ⚠️ Need custom implementation | **Supabase** |
| Cost | ✅ Fixed monthly | ⚠️ Per-user pricing | **Supabase** |
| Complexity | ✅ Lower | ⚠️ Higher | **Supabase** |

### Recommendation: **Keep Current Supabase System** ✅

---

**Document Status:** Complete
**Last Updated:** 2025-01-11
**Created By:** Claude (AI Analysis)
