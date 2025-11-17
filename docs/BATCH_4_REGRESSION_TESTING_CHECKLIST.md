# Batch 4 - Comprehensive Regression Testing Checklist

**Project**: VIK-29 Business Wallet Enhancement
**Batch**: 4 - Final Regression Testing
**Version**: 1.0.0
**Date**: November 7, 2025
**Estimated Time**: 3-4 hours for complete regression test

---

## Purpose

This checklist provides a comprehensive regression test to verify that all features—new and existing—work correctly together before staging deployment. This is the final quality gate before production.

**Critical**: All sections marked 🔴 MUST pass before staging deployment.

---

## Pre-Test Setup

### Environment Configuration

- [ ] Development server running on port 3001
- [ ] All environment variables configured (run `./scripts/check-env-vars.sh`)
- [ ] Stripe CLI running for webhook testing
- [ ] Test Stripe accounts available (platform + connected business account)
- [ ] Database clean state or dedicated test data
- [ ] Browser DevTools open for monitoring
- [ ] Email inbox accessible for notification verification
- [ ] Test custom domain configured (optional but recommended)

### Test Accounts Prepared

- [ ] **Admin Account**: Full admin privileges
- [ ] **Business Account 1**: With Stripe Connect enabled, wallet balance > $100
- [ ] **Business Account 2**: Without Stripe Connect, wallet balance > $100
- [ ] **Business Account 3**: With custom domain configured (optional)
- [ ] **Customer Account**: Regular user for booking tests
- [ ] **Vendor Account**: For vendor-side testing

---

## Section 1: Stripe Connect Multi-Tenant Features 🔴

**Priority**: Critical - New feature, must work completely

### 1.1 OAuth Connection Flow

- [ ] **Test 1.1.1**: Fresh OAuth connection
  - Navigate to business wallet page
  - Click "Connect Stripe Account"
  - Complete OAuth flow on Stripe
  - Verify successful connection message
  - Verify connected account ID displayed
  - **Database Check**: `stripe_connect_enabled = true`, `stripe_connected_account_id` populated

- [ ] **Test 1.1.2**: OAuth state token security
  - Generate OAuth URL
  - Attempt to tamper with state parameter
  - Verify error: "Invalid OAuth state token"

- [ ] **Test 1.1.3**: OAuth state token expiry
  - Generate OAuth URL
  - Wait 6 minutes
  - Attempt to complete flow
  - Verify error: "OAuth state token has expired"

- [ ] **Test 1.1.4**: Token encryption verification
  - **Database Check**:
    ```sql
    SELECT stripe_access_token_encrypted
    FROM business_accounts
    WHERE id = 'TEST_ID';
    ```
  - Verify token is encrypted (not plain text starting with `sk_` or `rk_`)
  - Verify format: `encrypted:` prefix + base64 encoded data

**✅ Pass Criteria**: All 4 OAuth tests pass, tokens encrypted in database

---

### 1.2 Payment Processing with Connected Accounts

- [ ] **Test 1.2.1**: Manual wallet recharge with connected account
  - Amount: $500.00
  - Card: 4242 4242 4242 4242
  - Verify success message
  - Verify wallet balance increased by $500
  - **Stripe Dashboard Check**: Payment appears in connected account (not platform)
  - **Database Check**: `wallet_balance` updated, transaction recorded

- [ ] **Test 1.2.2**: Payment metadata verification
  - Open last payment in Stripe dashboard
  - Verify metadata contains:
    - `business_account_id`
    - `connected_account_id`
    - `payment_type: "wallet_recharge"`

- [ ] **Test 1.2.3**: Payment routing isolation
  - Create payment for Business Account 1
  - Verify payment appears only in Business Account 1's Stripe dashboard
  - Verify payment does NOT appear in platform account or other business accounts

- [ ] **Test 1.2.4**: Fallback to platform account
  - Use Business Account 2 (no Stripe Connect)
  - Attempt wallet recharge
  - Verify payment routes through platform account
  - Verify success message

**✅ Pass Criteria**: All payments route correctly, isolation maintained, fallback works

---

### 1.3 Auto-Recharge Functionality

- [ ] **Test 1.3.1**: Auto-recharge configuration
  - Enable auto-recharge toggle
  - Set threshold: $50.00
  - Set recharge amount: $500.00
  - Select saved payment method
  - Click "Save Settings"
  - **Database Check**:
    ```sql
    SELECT auto_recharge_enabled, auto_recharge_threshold, auto_recharge_amount
    FROM business_accounts WHERE id = 'TEST_ID';
    ```
  - Verify all values match configuration

- [ ] **Test 1.3.2**: Auto-recharge trigger
  - Reduce wallet balance below threshold:
    ```sql
    UPDATE business_accounts SET wallet_balance = 40.00 WHERE id = 'TEST_ID';
    ```
  - Create a booking OR manually trigger edge function
  - Wait 15 seconds
  - Verify wallet balance = $540 (40 + 500)
  - Verify email notification received
  - **Database Check**: Transaction type = "auto_recharge"

- [ ] **Test 1.3.3**: Auto-recharge retry logic
  - Configure auto-recharge with declining card (4000 0000 0000 0002)
  - Trigger auto-recharge
  - Verify 3 retry attempts (1min, 2min, 4min intervals)
  - After max retries: Verify auto-recharge disabled
  - Verify failure email received

- [ ] **Test 1.3.4**: Auto-recharge with saved payment method
  - Save payment method during manual payment
  - Configure auto-recharge with saved method
  - Trigger auto-recharge
  - Verify payment uses saved method (no card entry required)

**✅ Pass Criteria**: Auto-recharge triggers correctly, retry logic works, failures handled gracefully

---

### 1.4 Webhook Event Handling

- [ ] **Test 1.4.1**: Webhook signature verification
  - Send invalid webhook signature:
    ```bash
    curl -X POST http://localhost:3001/api/business/wallet/webhook \
      -H "Stripe-Signature: t=123,v1=fake" \
      -d '{"type":"test"}'
    ```
  - Verify HTTP 400 response
  - Verify error: "Invalid webhook signature"

- [ ] **Test 1.4.2**: Valid webhook processing
  - Complete a $100 payment
  - Verify Stripe CLI shows: `[200] POST /api/business/wallet/webhook`
  - Verify event type: `payment_intent.succeeded`
  - Check server logs: "Webhook signature verified"
  - **Database Check**: Transaction recorded with status "completed"

- [ ] **Test 1.4.3**: Webhook idempotency
  - Use Stripe CLI to resend same event 3 times:
    ```bash
    stripe events resend <event_id>
    ```
  - Verify wallet balance only updated once
  - Verify only one transaction record created

- [ ] **Test 1.4.4**: Webhook event routing
  - Trigger payment for Business Account 1
  - Verify webhook updates only Business Account 1's wallet
  - Verify other business accounts unaffected

**✅ Pass Criteria**: All webhooks verified, signatures validated, idempotency maintained

---

### 1.5 Multi-Currency Support

- [ ] **Test 1.5.1**: USD Payment
  - Amount: $100.00
  - Card: 4242 4242 4242 4242
  - Verify Stripe amount: 10000 (cents)
  - Verify wallet balance increases by $100.00

- [ ] **Test 1.5.2**: EUR Payment
  - Amount: €100.00
  - Card: 4000 0003 8000 0008
  - Verify Stripe amount: 10000 (cents)
  - Verify wallet balance displays correctly

- [ ] **Test 1.5.3**: JPY Payment (zero-decimal)
  - Amount: ¥10,000
  - Card: 4000 0039 2000 0003
  - Verify Stripe amount: 10000 (NOT 1000000)
  - Verify wallet balance displays without decimals

- [ ] **Test 1.5.4**: Multi-currency in transaction history
  - View transaction history
  - Verify all currencies display correctly with proper symbols
  - Verify amounts formatted per currency rules

**✅ Pass Criteria**: All 3+ currencies process correctly, zero-decimal currencies handled properly

---

### 1.6 Disconnection Flow

- [ ] **Test 1.6.1**: Disconnect Stripe account
  - Click "Disconnect Stripe Account"
  - Confirm in dialog
  - Verify success message
  - Verify button changes to "Connect Stripe Account"
  - **Database Check**:
    ```sql
    SELECT stripe_connect_enabled, stripe_connected_account_id
    FROM business_accounts WHERE id = 'TEST_ID';
    ```
  - Verify `stripe_connect_enabled = false`
  - Verify `stripe_connected_account_id = null`

- [ ] **Test 1.6.2**: Auto-recharge disabled on disconnect
  - Verify auto-recharge automatically disabled
  - Verify saved payment methods cleared

- [ ] **Test 1.6.3**: Reconnection after disconnect
  - Click "Connect Stripe Account"
  - Complete OAuth flow again
  - Verify successful reconnection
  - Verify can reconfigure auto-recharge

**✅ Pass Criteria**: Disconnection cleans up properly, reconnection works

---

## Section 2: Custom Domain & White-Labeling Features 🔴

**Priority**: Critical - New multi-tenant feature

### 2.1 Custom Domain Setup

- [ ] **Test 2.1.1**: Configure custom domain
  - Navigate to business domain settings
  - Enter custom domain: `transfers.yourbusiness.test`
  - Save configuration
  - **Database Check**:
    ```sql
    SELECT custom_domain, custom_domain_verified
    FROM business_accounts WHERE id = 'TEST_ID';
    ```
  - Verify `custom_domain` saved
  - Verify `custom_domain_verified = false` (initially)

- [ ] **Test 2.1.2**: DNS instructions displayed
  - Verify CNAME record instructions shown:
    - `transfers.yourbusiness.test CNAME platform.domain.com`
  - Verify TXT record instructions shown:
    - `_verification.transfers.yourbusiness.test TXT platform-verification=<token>`

**✅ Pass Criteria**: Custom domain saves, DNS instructions clear

---

### 2.2 DNS Verification

- [ ] **Test 2.2.1**: DNS verification with correct records
  - Configure DNS records as instructed
  - Click "Verify DNS"
  - Wait for verification (may take minutes)
  - Verify success message
  - **Database Check**: `custom_domain_verified = true`

- [ ] **Test 2.2.2**: DNS verification with incorrect records
  - Configure incorrect CNAME
  - Click "Verify DNS"
  - Verify error message: "DNS records not found or incorrect"

- [ ] **Test 2.2.3**: DNS verification with missing TXT record
  - Configure CNAME but not TXT
  - Click "Verify DNS"
  - Verify error message indicating missing TXT record

**✅ Pass Criteria**: DNS verification works correctly, errors helpful

---

### 2.3 Domain Identification (Middleware)

- [ ] **Test 2.3.1**: Custom domain request handling
  - Navigate to: `http://transfers.yourbusiness.test:3001/`
  - Open browser DevTools → Network tab
  - Check response headers for:
    - `x-business-id`
    - `x-business-name`
    - `x-brand-name`
    - `x-logo-url`
    - `x-primary-color`
    - `x-secondary-color`
    - `x-accent-color`
    - `x-custom-domain: true`
  - Verify all headers present

- [ ] **Test 2.3.2**: Platform domain (no custom headers)
  - Navigate to: `http://localhost:3001/`
  - Check response headers
  - Verify custom domain headers NOT present
  - Verify platform branding applied

- [ ] **Test 2.3.3**: RPC function verification
  ```sql
  SELECT * FROM get_business_by_custom_domain('transfers.yourbusiness.test');
  ```
  - Verify returns business data
  - Verify only verified domains returned
  - Verify only active businesses returned

**✅ Pass Criteria**: Middleware correctly identifies custom domains, injects headers

---

### 2.4 Theme Application

- [ ] **Test 2.4.1**: Custom branding colors applied
  - Navigate to custom domain
  - Inspect page elements with DevTools
  - Verify CSS variables applied:
    - `--primary-color`
    - `--secondary-color`
    - `--accent-color`
  - Verify UI elements use custom colors

- [ ] **Test 2.4.2**: Custom logo displayed
  - Upload business logo via settings
  - Navigate to custom domain
  - Verify logo appears in header
  - Verify logo appears in footer
  - Verify logo correct aspect ratio

- [ ] **Test 2.4.3**: Brand name displayed
  - Configure brand name: "ACME Transfers"
  - Navigate to custom domain
  - Verify brand name in header
  - Verify brand name in page title
  - Verify brand name in footer

- [ ] **Test 2.4.4**: Theme persistence
  - Navigate to multiple pages on custom domain
  - Verify theme consistent across all pages
  - Verify theme persists on page reload

**✅ Pass Criteria**: Custom branding applied consistently across all pages

---

### 2.5 Multi-Tenant Isolation

- [ ] **Test 2.5.1**: Data isolation
  - Access Business Account 1 via custom domain
  - Verify only Business Account 1 data visible
  - Verify Business Account 2 data not accessible

- [ ] **Test 2.5.2**: Booking isolation
  - Create booking via Business Account 1 custom domain
  - Verify booking belongs to Business Account 1
  - Verify booking not visible in Business Account 2

- [ ] **Test 2.5.3**: Wallet isolation
  - View wallet via Business Account 1 custom domain
  - Verify only Business Account 1 wallet balance shown
  - Verify Business Account 1 transactions only

**✅ Pass Criteria**: Complete data isolation between business accounts

---

## Section 3: Wallet Management (Existing Features) 🔴

**Priority**: Critical - Must not be broken by new features

### 3.1 Basic Wallet Operations

- [ ] **Test 3.1.1**: View wallet balance
  - Navigate to wallet page
  - Verify balance displayed correctly
  - Verify last recharge date shown
  - Verify currency symbol correct

- [ ] **Test 3.1.2**: Manual wallet top-up (without Stripe Connect)
  - Use Business Account 2 (no Stripe Connect)
  - Click "Add Credits"
  - Enter amount: $100
  - Complete payment with platform account
  - Verify balance updated

- [ ] **Test 3.1.3**: Transaction history
  - View transaction history
  - Verify all transactions visible
  - Verify transaction types correct (manual, auto_recharge, booking_payment)
  - Verify amounts correct
  - Verify timestamps correct
  - Verify pagination works (if >10 transactions)

- [ ] **Test 3.1.4**: Wallet balance after booking
  - Note current balance: $X
  - Create booking worth $50
  - Verify balance decreased to $(X-50)
  - Verify transaction recorded with type "booking_payment"

**✅ Pass Criteria**: All basic wallet operations work correctly

---

### 3.2 Credits Management

- [ ] **Test 3.2.1**: View available credits
  - Navigate to wallet dashboard
  - Verify credits balance displayed
  - Verify expiry date (if applicable)

- [ ] **Test 3.2.2**: Admin credit adjustment
  - Admin logs in
  - Navigate to business account management
  - Click "Adjust Credits" for Business Account 1
  - Add $200 credits
  - Verify success message
  - **Database Check**: Credits increased by $200
  - Verify email notification sent to business

- [ ] **Test 3.2.3**: Credit expiry handling
  - Set credits with past expiry date:
    ```sql
    UPDATE business_accounts
    SET wallet_credit_expiry = NOW() - INTERVAL '1 day'
    WHERE id = 'TEST_ID';
    ```
  - Attempt to use credits for booking
  - Verify credits not applied
  - Verify warning message about expired credits

**✅ Pass Criteria**: Credits management works correctly

---

## Section 4: Booking System Integration 🟡

**Priority**: High - Core functionality must work with wallet changes

### 4.1 Booking Creation with Wallet Payment

- [ ] **Test 4.1.1**: Sufficient balance booking
  - Business Account 1 balance: $500
  - Create booking worth $100
  - Select "Pay with Wallet"
  - Complete booking
  - Verify booking created successfully
  - Verify balance reduced to $400
  - Verify transaction recorded

- [ ] **Test 4.1.2**: Insufficient balance booking
  - Business Account 1 balance: $30
  - Create booking worth $100
  - Select "Pay with Wallet"
  - Verify error: "Insufficient wallet balance"
  - Verify booking not created
  - Verify balance unchanged

- [ ] **Test 4.1.3**: Auto-recharge triggered by booking
  - Configure auto-recharge (threshold: $50, amount: $500)
  - Set balance to $45
  - Create booking worth $20
  - Verify auto-recharge triggered
  - Verify balance becomes $525 (45 + 500 - 20)
  - Verify booking completed successfully

- [ ] **Test 4.1.4**: Booking refund to wallet
  - Admin cancels booking worth $100
  - Verify refund processed to wallet
  - Verify wallet balance increased by $100
  - Verify transaction recorded with type "refund"

**✅ Pass Criteria**: Booking system integrates correctly with wallet

---

### 4.2 Vendor Assignment with Connected Accounts

- [ ] **Test 4.2.1**: Vendor assignment for connected account booking
  - Create booking using Business Account 1 (with Stripe Connect)
  - Admin assigns vendor to booking
  - Verify vendor notified
  - Verify booking assignment recorded

- [ ] **Test 4.2.2**: Payment split (if implemented)
  - Create booking worth $100
  - Verify platform fee calculation
  - Verify vendor payout amount
  - **Stripe Dashboard Check**: Verify payment split visible

**✅ Pass Criteria**: Vendor assignment works with new payment system

---

## Section 5: Email Notifications 🟡

**Priority**: High - Critical for user communication

### 5.1 Stripe Connect Emails

- [ ] **Test 5.1.1**: OAuth connection success email
  - Complete Stripe Connect OAuth
  - Verify email received: "Stripe account connected successfully"
  - Verify email contains account ID (masked)

- [ ] **Test 5.1.2**: Payment success email
  - Complete manual wallet recharge
  - Verify email received: "Payment successful"
  - Verify email contains amount, date, transaction ID

- [ ] **Test 5.1.3**: Auto-recharge success email
  - Trigger auto-recharge
  - Verify email received: "Wallet automatically recharged"
  - Verify email contains amount, new balance

- [ ] **Test 5.1.4**: Auto-recharge failure email
  - Trigger auto-recharge with declining card
  - After max retries, verify email received: "Auto-recharge failed"
  - Verify email explains failure and next steps

- [ ] **Test 5.1.5**: Payment failure email
  - Attempt payment with declining card
  - Verify email received: "Payment failed"
  - Verify email contains error details

**✅ Pass Criteria**: All 5 email types sent correctly with accurate information

---

### 5.2 Custom Domain Emails

- [ ] **Test 5.2.1**: DNS verification success email
  - Complete DNS verification
  - Verify email received: "Custom domain verified"
  - Verify email contains domain name and next steps

- [ ] **Test 5.2.2**: DNS verification failure email
  - Attempt verification with incorrect DNS
  - Verify email received: "Custom domain verification failed"
  - Verify email contains troubleshooting steps

**✅ Pass Criteria**: Custom domain emails sent correctly

---

### 5.3 Existing Business Emails

- [ ] **Test 5.3.1**: Booking confirmation email
  - Create booking
  - Verify email received with booking details
  - Verify email sent from correct sender (custom domain or platform)

- [ ] **Test 5.3.2**: Credit adjustment notification email
  - Admin adjusts credits
  - Verify business receives email notification
  - Verify email contains adjustment amount and new balance

**✅ Pass Criteria**: Existing emails still work correctly

---

## Section 6: Admin Controls 🟡

**Priority**: High - Admin must control new features

### 6.1 Business Account Management

- [ ] **Test 6.1.1**: View connected accounts
  - Admin navigates to business accounts list
  - Verify "Stripe Connected" badge visible for connected accounts
  - Verify connected account ID visible
  - Verify connection date shown

- [ ] **Test 6.1.2**: View wallet balances
  - Admin views business accounts
  - Verify wallet balance column displayed
  - Verify balances accurate
  - Verify sorting by balance works

- [ ] **Test 6.1.3**: View custom domains
  - Admin views business accounts
  - Verify custom domain column displayed
  - Verify verification status shown
  - Verify can filter by custom domain status

- [ ] **Test 6.1.4**: Manual credit adjustment
  - Admin selects business account
  - Clicks "Adjust Credits"
  - Enters amount: +$500
  - Adds note: "Promotional credit"
  - Saves adjustment
  - Verify balance updated
  - Verify adjustment logged

**✅ Pass Criteria**: Admin can view and manage all new features

---

### 6.2 Disconnection and Override Controls

- [ ] **Test 6.2.1**: Admin force disconnect Stripe
  - Admin selects business account with Stripe Connect
  - Clicks "Force Disconnect"
  - Confirms action
  - Verify Stripe connection removed
  - Verify business notified via email

- [ ] **Test 6.2.2**: Admin disable custom domain
  - Admin selects business account with custom domain
  - Clicks "Disable Custom Domain"
  - Confirms action
  - Verify custom domain disabled
  - Verify domain becomes inaccessible
  - Verify business notified

**✅ Pass Criteria**: Admin has override controls for safety

---

## Section 7: Error Handling & Edge Cases 🟢

**Priority**: Medium - Must handle errors gracefully

### 7.1 Payment Errors

- [ ] **Test 7.1.1**: Card declined
  - Card: 4000 0000 0000 0002
  - Verify error message: "Your card was declined"
  - Verify user can retry
  - Verify no wallet balance change

- [ ] **Test 7.1.2**: Insufficient funds
  - Card: 4000 0000 0000 9995
  - Verify error message: "Your card has insufficient funds"
  - Verify user can retry with different card

- [ ] **Test 7.1.3**: Expired card
  - Card: 4000 0000 0000 0069
  - Verify error message: "Your card has expired"
  - Verify user prompted to use different card

- [ ] **Test 7.1.4**: Network timeout
  - Simulate slow network
  - Verify loading state shown
  - Verify timeout error after 30s
  - Verify can retry

**✅ Pass Criteria**: All errors display helpful messages, no crashes

---

### 7.2 Boundary Testing

- [ ] **Test 7.2.1**: Minimum payment amount
  - Try: $0.50
  - Verify accepted or appropriate error

- [ ] **Test 7.2.2**: Maximum payment amount
  - Try: $50,000
  - Verify accepted or Stripe limit message

- [ ] **Test 7.2.3**: Zero wallet balance
  - Set balance to $0.00
  - Attempt booking
  - Verify error: "Insufficient balance"
  - Verify prompted to add credits

- [ ] **Test 7.2.4**: Negative balance (should be impossible)
  - Attempt to create negative balance scenario
  - Verify database constraints prevent negative balance

- [ ] **Test 7.2.5**: Very long custom domain
  - Try: 255+ character domain
  - Verify validation error
  - Verify max length enforced

**✅ Pass Criteria**: All boundaries handled correctly

---

### 7.3 Concurrent Operations

- [ ] **Test 7.3.1**: Simultaneous payments
  - Open 2 browser tabs for same business
  - Initiate payment in both simultaneously
  - Verify both complete successfully
  - Verify wallet balance updated correctly (race condition test)

- [ ] **Test 7.3.2**: Simultaneous bookings
  - Create 2 bookings simultaneously with low balance
  - Verify one succeeds, one fails gracefully
  - Verify no negative balance

**✅ Pass Criteria**: No race conditions, data integrity maintained

---

## Section 8: Security Testing 🔴

**Priority**: Critical - Security cannot be compromised

### 8.1 Authentication & Authorization

- [ ] **Test 8.1.1**: Unauthenticated wallet access
  - Log out
  - Navigate to wallet page
  - Verify redirected to login
  - Verify wallet data not exposed

- [ ] **Test 8.1.2**: Cross-business wallet access
  - Log in as Business Account 1
  - Attempt to access Business Account 2 wallet via URL manipulation
  - Verify access denied
  - Verify 403 error

- [ ] **Test 8.1.3**: Admin-only operations
  - Log in as regular business user
  - Attempt to access admin credit adjustment API
  - Verify access denied
  - Verify 403 error

**✅ Pass Criteria**: All unauthorized access attempts blocked

---

### 8.2 Data Validation

- [ ] **Test 8.2.1**: SQL injection attempts
  - Try SQL injection in custom domain field: `'; DROP TABLE business_accounts;--`
  - Verify input sanitized
  - Verify no SQL executed

- [ ] **Test 8.2.2**: XSS attempts
  - Try XSS in brand name: `<script>alert('XSS')</script>`
  - Verify script tags escaped
  - Verify no script execution

- [ ] **Test 8.2.3**: Invalid payment amounts
  - Try negative amount: `-$100`
  - Try zero amount: `$0`
  - Try non-numeric: `$abc`
  - Verify all rejected with validation errors

**✅ Pass Criteria**: All malicious input sanitized

---

### 8.3 Token & Secret Security

- [ ] **Test 8.3.1**: Stripe tokens not exposed
  - View page source
  - Check browser DevTools → Network tab
  - Check browser DevTools → Console
  - Verify no `sk_` or `rk_` tokens visible

- [ ] **Test 8.3.2**: Encrypted tokens in database
  - **Database Check**:
    ```sql
    SELECT stripe_access_token_encrypted
    FROM business_accounts
    LIMIT 5;
    ```
  - Verify all tokens encrypted (no plain text)

- [ ] **Test 8.3.3**: Environment variables not exposed
  - View page source
  - Check public JavaScript bundles
  - Verify `STRIPE_SECRET_KEY` not exposed
  - Verify `ENCRYPTION_KEY` not exposed

**✅ Pass Criteria**: No secrets exposed in client-side code or database

---

## Section 9: Performance Testing 🟢

**Priority**: Medium - Should be reasonably fast

### 9.1 Response Times

Measure and record actual times:

- [ ] **Test 9.1.1**: Wallet page load
  - Target: < 2 seconds
  - Actual: _______ seconds
  - Status: Pass / Fail

- [ ] **Test 9.1.2**: OAuth URL generation
  - Target: < 500ms
  - Actual: _______ ms
  - Status: Pass / Fail

- [ ] **Test 9.1.3**: Payment Intent creation
  - Target: < 2 seconds
  - Actual: _______ seconds
  - Status: Pass / Fail

- [ ] **Test 9.1.4**: Webhook processing
  - Target: < 1 second
  - Actual: _______ ms
  - Status: Pass / Fail

- [ ] **Test 9.1.5**: Custom domain theme application
  - Target: < 1 second (additional overhead)
  - Actual: _______ ms
  - Status: Pass / Fail

**✅ Pass Criteria**: All operations complete within acceptable limits

---

### 9.2 Load Testing (Optional)

- [ ] **Test 9.2.1**: Multiple concurrent users
  - Simulate 10 concurrent wallet operations
  - Verify all complete successfully
  - Note any performance degradation

**✅ Pass Criteria**: System handles concurrent load gracefully

---

## Section 10: Browser Compatibility ⚪

**Priority**: Low - Should work in modern browsers

### 10.1 Cross-Browser Testing

Test in at least 2 browsers:

- [ ] **Chrome**
  - OAuth flow: Pass / Fail
  - Payment flow: Pass / Fail
  - Custom domain: Pass / Fail
  - UI rendering: Pass / Fail

- [ ] **Firefox**
  - OAuth flow: Pass / Fail
  - Payment flow: Pass / Fail
  - Custom domain: Pass / Fail
  - UI rendering: Pass / Fail

- [ ] **Safari** (if available)
  - OAuth flow: Pass / Fail
  - Payment flow: Pass / Fail
  - Custom domain: Pass / Fail
  - UI rendering: Pass / Fail

**✅ Pass Criteria**: All core functionality works in tested browsers

---

## Section 11: Database Integrity 🔴

**Priority**: Critical - Data must be consistent

### 11.1 Data Consistency Checks

- [ ] **Test 11.1.1**: Wallet balance consistency
  ```sql
  SELECT
    ba.id,
    ba.wallet_balance,
    COALESCE(SUM(wt.amount), 0) as calculated_balance
  FROM business_accounts ba
  LEFT JOIN wallet_transactions wt ON wt.business_account_id = ba.id
  WHERE ba.id IN ('TEST_ID_1', 'TEST_ID_2')
  GROUP BY ba.id, ba.wallet_balance;
  ```
  - Verify `wallet_balance` = `calculated_balance` for all accounts

- [ ] **Test 11.1.2**: Transaction history completeness
  - For each business account, verify:
    - Every balance change has a transaction record
    - Transaction amounts sum to current balance

- [ ] **Test 11.1.3**: Foreign key integrity
  ```sql
  -- Check for orphaned transactions
  SELECT COUNT(*) FROM wallet_transactions
  WHERE business_account_id NOT IN (SELECT id FROM business_accounts);
  ```
  - Verify result = 0 (no orphaned transactions)

- [ ] **Test 11.1.4**: Stripe Connect data consistency
  ```sql
  -- Check for incomplete Stripe Connect data
  SELECT id, business_name, stripe_connect_enabled, stripe_connected_account_id
  FROM business_accounts
  WHERE stripe_connect_enabled = true
    AND (stripe_connected_account_id IS NULL
      OR stripe_access_token_encrypted IS NULL);
  ```
  - Verify result = 0 (no incomplete data)

**✅ Pass Criteria**: All data consistency checks pass

---

## Section 12: Automated Test Suite ⚪

**Priority**: Low - Verification only

### 12.1 Run Automated Tests

- [ ] **Test 12.1.1**: Run Jest test suite
  ```bash
  npm test
  ```
  - Record pass/fail count: _____ / _____
  - Verify all critical tests pass

- [ ] **Test 12.1.2**: Check test coverage
  ```bash
  npm run test:coverage
  ```
  - Record coverage: _____% statements
  - Verify coverage >= 70% for new files

**✅ Pass Criteria**: All automated tests pass

---

## Final Checklist

### Pre-Staging Deployment Requirements

- [ ] **All Critical (🔴) sections passed**: _____ / 5
- [ ] **All High (🟡) sections passed**: _____ / 3
- [ ] **All Medium (🟢) sections passed**: _____ / 2
- [ ] **No critical bugs identified**: Yes / No
- [ ] **Performance acceptable**: Yes / No
- [ ] **Security vulnerabilities resolved**: Yes / No
- [ ] **Database integrity verified**: Yes / No

---

## Sign-Off

### QA Team

**Tester Name**: ___________________________

**Date**: ___________________________

**Total Test Cases Executed**: _____ / 150+

**Pass Rate**: _____%

### Issues Summary

| Issue ID | Severity | Section | Description | Status | Notes |
|----------|----------|---------|-------------|--------|-------|
| | | | | | |
| | | | | | |
| | | | | | |

### Recommendation

- [ ] ✅ **APPROVED FOR STAGING** - All critical tests passed, ready for staging deployment
- [ ] ⚠️ **APPROVED WITH CAVEATS** - Minor issues documented, can deploy with monitoring
- [ ] ❌ **REJECTED** - Critical issues found, must be fixed before staging

**Signature**: ___________________________

**Date**: ___________________________

---

## Appendix: Quick Reference

### Test Stripe Cards

| Purpose | Card Number | Expected Result |
|---------|-------------|-----------------|
| Success | 4242 4242 4242 4242 | Payment succeeds |
| Declined | 4000 0000 0000 0002 | Card declined |
| Insufficient Funds | 4000 0000 0000 9995 | Insufficient funds |
| Expired Card | 4000 0000 0000 0069 | Card expired |
| Incorrect CVC | 4000 0000 0000 0127 | Incorrect CVC |
| EUR Card | 4000 0003 8000 0008 | EUR payment succeeds |
| JPY Card | 4000 0039 2000 0003 | JPY payment succeeds |

### Key SQL Queries

**Check Stripe Connect Status**:
```sql
SELECT id, business_name, stripe_connect_enabled, stripe_connected_account_id,
       stripe_access_token_encrypted IS NOT NULL as has_token
FROM business_accounts
WHERE id = 'YOUR_ID';
```

**Check Wallet Balance**:
```sql
SELECT wallet_balance, last_recharge_at, last_recharge_amount,
       auto_recharge_enabled, auto_recharge_threshold, auto_recharge_amount
FROM business_accounts
WHERE id = 'YOUR_ID';
```

**Check Recent Transactions**:
```sql
SELECT * FROM wallet_transactions
WHERE business_account_id = 'YOUR_ID'
ORDER BY created_at DESC LIMIT 10;
```

**Check Custom Domain**:
```sql
SELECT id, business_name, custom_domain, custom_domain_verified,
       brand_name, logo_url, primary_color, secondary_color, accent_color
FROM business_accounts
WHERE id = 'YOUR_ID';
```

### Key Commands

**Start Development Server**:
```bash
npm run dev
```

**Start Stripe Webhook Listener**:
```bash
stripe listen --forward-to http://localhost:3001/api/business/wallet/webhook
```

**Check Environment Variables**:
```bash
./scripts/check-env-vars.sh
```

**Run Automated Tests**:
```bash
npm test
```

**Generate TypeScript Types**:
```bash
npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
```

---

**Document Version**: 1.0.0
**Last Updated**: November 7, 2025
**Estimated Completion Time**: 3-4 hours

**Related Documents**:
- `/docs/STRIPE_CONNECT_TESTING_GUIDE.md` - Detailed Stripe Connect testing
- `/docs/QA_STRIPE_CONNECT_CHECKLIST.md` - Quick Stripe Connect verification
- `/docs/CUSTOM_DOMAIN_THEME_TESTING_GUIDE.md` - Custom domain testing
- `/docs/BUSINESS_WALLET_ENHANCEMENT_GUIDE.md` - Implementation guide
- `/docs/STRIPE_CONNECT_ARCHITECTURE_DIAGRAM.md` - Architecture diagrams
