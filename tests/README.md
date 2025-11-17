# Automated Test Suite - Stripe Connect Multi-Tenant

This directory contains automated test suites for the Stripe Connect multi-tenant wallet system.

## Test Files

### 1. `stripe-connect-oauth.test.ts`
Tests the OAuth flow for connecting business Stripe accounts.

**Coverage**:
- OAuth URL generation
- State token encryption/validation
- Configuration validation
- Error handling
- Security verification

**Test Cases**: 20+

**Run**:
```bash
npm test -- stripe-connect-oauth
```

### 2. `payment-element-connected.test.ts`
Tests payment processing with connected Stripe accounts.

**Coverage**:
- PaymentIntent creation
- Multi-currency support (7 currencies)
- Payment method management
- Connected account routing
- Error handling (declined cards, insufficient funds, etc.)

**Test Cases**: 45+

**Run**:
```bash
npm test -- payment-element-connected
```

### 3. `auto-recharge-connected.test.ts`
Tests automatic wallet recharge functionality.

**Coverage**:
- Auto-recharge trigger logic
- Payment processing with connected accounts
- Retry logic with exponential backoff
- Idempotency (duplicate prevention)
- Email notifications
- Transaction recording

**Test Cases**: 40+

**Run**:
```bash
npm test -- auto-recharge-connected
```

### 4. `webhook-connected-accounts.test.ts`
Tests webhook event handling from Stripe.

**Coverage**:
- Webhook signature verification
- Event type handling
- Connected account detection
- Metadata extraction
- Idempotency
- Wallet updates
- Email notifications

**Test Cases**: 50+

**Run**:
```bash
npm test -- webhook-connected-accounts
```

---

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test File
```bash
npm test -- stripe-connect-oauth
```

### Watch Mode (re-run on changes)
```bash
npm test -- --watch
```

### With Coverage
```bash
npm test -- --coverage
```

### Integration Tests Only
```bash
RUN_INTEGRATION_TESTS=true npm test
```

### Verbose Output
```bash
npm test -- --verbose
```

---

## Prerequisites

### Required Environment Variables
```bash
# For OAuth tests
STRIPE_CONNECT_CLIENT_ID=ca_...
ENCRYPTION_KEY=<32-byte-base64-key>
STRIPE_CONNECT_STATE_SECRET=<hex-secret>

# For payment tests
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# For webhook tests
STRIPE_WEBHOOK_SECRET=whsec_...

# For email notification tests
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=test@example.com

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### Dependencies
```bash
npm install --save-dev jest @types/jest ts-jest
```

---

## Test Categories

### Unit Tests
Isolated tests that mock external dependencies. Run fast, no network calls.

**Examples**:
- OAuth URL generation
- State token validation
- Amount calculations
- Metadata extraction

**Run**: Default when running `npm test`

### Integration Tests
Tests that interact with real services (database, Stripe test mode).

**Examples**:
- Database token storage
- Stripe API calls in test mode
- Email sending with Resend

**Run**: `RUN_INTEGRATION_TESTS=true npm test`

**Note**: Skipped by default, requires configuration

### E2E Tests
End-to-end tests that test complete user flows.

**Examples**:
- Full OAuth flow with browser automation
- Complete payment flow from UI to database
- Auto-recharge triggered by balance change

**Run**: `npm test -- --testNamePattern="E2E"`

**Note**: Currently skipped, requires Puppeteer setup

---

## Test Structure

Each test file follows this structure:

```typescript
describe('Feature Name', () => {
  describe('Sub-feature', () => {
    it('should do something specific', () => {
      // Arrange
      const input = ...;

      // Act
      const result = ...;

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

---

## Mocking Strategy

### Stripe API
Tests use Jest mocks for Stripe API to avoid network calls:

```typescript
jest.mock('stripe');
const mockStripe = new Stripe(...) as jest.Mocked<Stripe>;
```

### Supabase Client
Tests mock Supabase for database operations:

```typescript
jest.mock('@supabase/supabase-js');
const mockSupabase = { from: jest.fn(), ... };
```

### External Services
Tests mock email sending, file storage, etc. to isolate business logic.

---

## Adding New Tests

1. Create test file: `tests/feature-name.test.ts`
2. Follow existing structure (describe → it)
3. Mock external dependencies
4. Write unit tests first, then integration/E2E
5. Run tests: `npm test -- feature-name`
6. Update this README with test details

---

## Common Test Scenarios

### Testing OAuth Flow
```typescript
const stateToken = generateStateToken(businessId);
const decoded = validateStateToken(stateToken);
expect(decoded.businessId).toBe(businessId);
```

### Testing Payment Processing
```typescript
const paymentIntent = await mockStripe.paymentIntents.create({
  amount: 50000,
  currency: 'usd',
}, { stripeAccount: connectedAccountId });
```

### Testing Auto-Recharge
```typescript
const shouldTrigger = balance < threshold && autoRechargeEnabled;
expect(shouldTrigger).toBe(true);
```

### Testing Webhook Handling
```typescript
const signature = crypto.createHmac('sha256', secret)
  .update(signedPayload)
  .digest('hex');
// Verify signature matches
```

---

## Troubleshooting

### Tests Failing Due to Missing Env Vars
**Solution**: Copy `.env.local.example` to `.env.local` and configure

### Jest Cannot Find Modules
**Solution**: Check `tsconfig.json` has correct paths, run `npm install`

### Stripe Mock Errors
**Solution**: Ensure `jest.mock('stripe')` is before any Stripe imports

### Supabase Mock Errors
**Solution**: Mock all chained methods: `from().select().eq().single()`

### Tests Timing Out
**Solution**: Increase timeout: `jest.setTimeout(10000);` in `beforeAll()`

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
        env:
          STRIPE_CONNECT_CLIENT_ID: ${{ secrets.STRIPE_CONNECT_CLIENT_ID }}
          ENCRYPTION_KEY: ${{ secrets.ENCRYPTION_KEY }}
```

---

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Cover critical paths
- **E2E Tests**: Cover main user flows

**View Coverage**:
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

---

## Performance Benchmarks

| Test Suite | Tests | Duration | Status |
|------------|-------|----------|--------|
| OAuth | 20+ | ~500ms | ✅ Fast |
| Payment | 45+ | ~1s | ✅ Fast |
| Auto-Recharge | 40+ | ~800ms | ✅ Fast |
| Webhooks | 50+ | ~1s | ✅ Fast |
| **Total** | **155+** | **~3.5s** | **✅ Pass** |

---

## Next Steps

1. **Set up CI/CD**: Add test running to GitHub Actions
2. **Add E2E tests**: Use Puppeteer for browser automation
3. **Increase coverage**: Add edge case tests
4. **Performance tests**: Add load testing for high-volume scenarios
5. **Security tests**: Add tests for SQL injection, XSS, etc.

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript with Jest](https://jestjs.io/docs/getting-started#using-typescript)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Last Updated**: November 7, 2025
**Test Suite Version**: 1.0.0
**Total Test Cases**: 155+
