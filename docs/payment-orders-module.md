# Payment & Orders Module Documentation

## Overview

The Payment & Orders module handles all financial transactions and order management for the vehicle service platform. It provides secure payment processing through Stripe integration, manages payment intents, handles refunds, and maintains comprehensive order records. The module ensures PCI compliance while providing a seamless payment experience for customers.

## Key Features

- **Stripe Integration**: Secure payment processing via Stripe
- **Payment Intent Management**: Create and track payment intents
- **Multi-step Payment Flow**: Separate booking creation from payment
- **Refund Processing**: Automated and manual refund capabilities
- **Payment Methods**: Credit/debit card support with expansion capability
- **Order Tracking**: Complete order history and status management
- **Payment Verification**: Real-time payment status confirmation
- **Security Compliance**: PCI DSS compliant implementation
- **Error Recovery**: Robust error handling and retry mechanisms

## Architecture

### Payment Flow Architecture

```
Customer → Checkout → Booking Creation → Payment Page → Stripe → Confirmation
                           ↓                  ↓            ↓
                      Database           Payment Intent  Webhook
```

### Module Structure

```
/payment
├── page.tsx (Payment page with Stripe Elements)
├── components/
│   ├── payment-wrapper.tsx (Stripe Elements container)
│   ├── payment-form.tsx (Card input form)
│   └── payment-summary.tsx (Order summary)
├── /api/payment/
│   ├── create-intent/route.ts (Payment intent creation)
│   └── confirm/route.ts (Payment confirmation)
└── /lib/stripe/
    ├── server.ts (Server-side Stripe functions)
    └── client.ts (Client-side Stripe configuration)
```

## Database Schema

### Payment-Related Fields in Bookings Table

| Column | Type | Description |
|--------|------|-------------|
| stripe_payment_intent_id | text | Stripe PaymentIntent ID |
| stripe_charge_id | text | Stripe Charge ID after successful payment |
| payment_method_details | jsonb | Payment method information |
| payment_status | text | Current payment status |
| paid_at | timestamp | Payment completion timestamp |
| payment_error | text | Error details if payment failed |
| total_price | numeric | Total amount to charge |
| currency | text | Payment currency (default: USD) |

### Payment Status Values

- **pending**: Awaiting payment initiation
- **processing**: Payment in progress
- **paid**: Payment successful
- **failed**: Payment failed
- **refunded**: Payment refunded
- **partially_refunded**: Partial refund issued

## Stripe Integration

### Configuration

```typescript
// Environment Variables
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Stripe Objects

#### PaymentIntent
Primary object for handling payments.

```typescript
{
  id: string                    // pi_xxxxx
  amount: number                // Amount in cents
  currency: string              // Currency code
  status: string                // Payment intent status
  client_secret: string         // For client-side confirmation
  metadata: {
    booking_id: string
    customer_id: string
    booking_number: string
  }
}
```

#### Customer
Stripe customer object for returning customers.

```typescript
{
  id: string                    // cus_xxxxx
  email: string
  name: string
  phone: string
  metadata: {
    user_id: string             // Platform user ID
  }
}
```

## API Endpoints

### Payment Intent Creation

#### `POST /api/payment/create-intent`
Creates a new payment intent for a booking.

**Request:**
```typescript
{
  bookingId: string
  amount: number
  currency?: string
}
```

**Process:**
1. Verify booking exists and belongs to user
2. Check if payment intent already exists
3. Create/retrieve Stripe customer
4. Create payment intent with metadata
5. Update booking with intent ID
6. Return client secret

**Response:**
```typescript
{
  clientSecret: string
  paymentIntentId: string
  amount: number
  currency: string
}
```

### Payment Confirmation

#### `POST /api/payment/confirm`
Confirms payment completion and updates booking.

**Request:**
```typescript
{
  paymentIntentId: string
  bookingId: string
}
```

**Process:**
1. Retrieve payment intent from Stripe
2. Verify payment succeeded
3. Update booking payment status
4. Store charge ID
5. Set paid_at timestamp
6. Trigger post-payment actions

**Response:**
```typescript
{
  success: boolean
  bookingNumber: string
  status: string
}
```

### Webhook Handler

#### `POST /api/webhooks/stripe`
Handles Stripe webhook events.

**Events Handled:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `charge.dispute.created`

**Process:**
1. Verify webhook signature
2. Parse event data
3. Handle based on event type
4. Update database records
5. Trigger notifications

## Server Actions

### Payment Management Functions

#### `createPaymentIntent(bookingId, amount, customerId)`
Creates a Stripe payment intent.

```typescript
async function createPaymentIntent(
  bookingId: string,
  amount: number,
  customerId: string
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    customer: customerId,
    metadata: {
      booking_id: bookingId,
      platform: 'vehicle_service'
    },
    automatic_payment_methods: {
      enabled: true
    }
  })
  
  return paymentIntent
}
```

#### `createOrRetrieveStripeCustomer(userId, email, name?, phone?)`
Gets or creates a Stripe customer.

```typescript
async function createOrRetrieveStripeCustomer(
  userId: string,
  email: string,
  name?: string,
  phone?: string
) {
  // Check if customer exists in database
  const existing = await getStripeCustomerId(userId)
  
  if (existing) {
    return existing
  }
  
  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    phone,
    metadata: {
      user_id: userId
    }
  })
  
  // Store customer ID
  await saveStripeCustomerId(userId, customer.id)
  
  return customer.id
}
```

#### `processRefund(chargeId, amount?, reason?)`
Processes a refund for a charge.

```typescript
async function processRefund(
  chargeId: string,
  amount?: number,  // Partial refund if specified
  reason?: string
) {
  const refund = await stripe.refunds.create({
    charge: chargeId,
    amount: amount ? Math.round(amount * 100) : undefined,
    reason: reason || 'requested_by_customer'
  })
  
  return refund
}
```

#### `retrievePaymentIntent(paymentIntentId)`
Retrieves payment intent details.

```typescript
async function retrievePaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(
    paymentIntentId,
    {
      expand: ['payment_method', 'customer']
    }
  )
  
  return paymentIntent
}
```

## UI Components

### PaymentWrapper
Main container for Stripe Elements.

**Features:**
- Stripe Elements provider
- Payment form container
- Error boundary
- Loading states

### PaymentForm
Card input form using Stripe Elements.

**Components:**
- Card Element (number, expiry, CVC)
- Billing address (optional)
- Save payment method checkbox
- Submit button with loading state

**Validation:**
- Real-time card validation
- Error message display
- Card brand detection

### PaymentSummary
Order summary display.

**Sections:**
- Booking details
- Route information
- Passenger count
- Base fare
- Amenities
- Total amount
- Terms acceptance

### PaymentStatus
Payment processing status display.

**States:**
- Processing animation
- Success confirmation
- Error message
- Retry option

## Payment Processing Flow

### Standard Payment Flow

1. **Booking Creation**
   - User completes checkout
   - Booking created with pending payment
   - Redirect to payment page

2. **Payment Page Load**
   - Fetch booking details
   - Create/retrieve payment intent
   - Initialize Stripe Elements
   - Display payment form

3. **Card Details Entry**
   - User enters card information
   - Real-time validation
   - Card brand detection
   - Error feedback

4. **Payment Submission**
   - Confirm payment with Stripe
   - Show processing state
   - Handle 3D Secure if required

5. **Payment Confirmation**
   - Verify payment success
   - Update booking status
   - Show confirmation
   - Send email receipt

6. **Post-Payment**
   - Redirect to confirmation page
   - Trigger notifications
   - Update order records

### 3D Secure Authentication

1. **Challenge Required**
   - Stripe requests authentication
   - Modal/redirect to bank
   - User completes challenge

2. **Authentication Result**
   - Success → Continue payment
   - Failure → Show error
   - Abandoned → Allow retry

### Failed Payment Recovery

1. **Payment Fails**
   - Display error message
   - Log failure reason
   - Retain booking

2. **Retry Options**
   - Try different card
   - Update card details
   - Contact support

3. **Abandonment**
   - Keep booking for 24 hours
   - Send reminder email
   - Auto-cancel if unpaid

## Security Considerations

### PCI Compliance

- **No Card Storage**: Never store card details
- **Stripe Elements**: Use hosted fields
- **HTTPS Only**: Enforce SSL/TLS
- **Token Usage**: Use payment tokens only
- **Scope Reduction**: Minimize PCI scope

### Authentication & Authorization

```typescript
// Verify user owns booking
const booking = await getBooking(bookingId)
if (booking.customer_id !== userId) {
  throw new Error('Unauthorized')
}

// Verify amount matches
if (booking.total_price !== amount) {
  throw new Error('Amount mismatch')
}
```

### Webhook Security

```typescript
// Verify webhook signature
const sig = headers['stripe-signature']
const event = stripe.webhooks.constructEvent(
  body,
  sig,
  webhookSecret
)
```

### Data Protection

- Encrypt sensitive data at rest
- Use environment variables for keys
- Implement rate limiting
- Log security events
- Regular security audits

## Error Handling

### Payment Errors

#### Card Declined
```typescript
{
  type: 'card_error',
  code: 'card_declined',
  message: 'Your card was declined',
  decline_code: 'insufficient_funds'
}
```

**Handling:**
- Display user-friendly message
- Suggest alternative payment
- Log for analysis

#### Network Errors
```typescript
{
  type: 'api_connection_error',
  message: 'Network error occurred'
}
```

**Handling:**
- Implement retry logic
- Show timeout message
- Offer manual retry

#### Validation Errors
```typescript
{
  type: 'validation_error',
  param: 'card_number',
  message: 'Invalid card number'
}
```

**Handling:**
- Highlight field
- Show inline error
- Prevent submission

### Error Recovery Strategies

1. **Idempotency**
   - Use idempotency keys
   - Prevent duplicate charges
   - Safe retries

2. **Webhook Resilience**
   - Implement retry logic
   - Queue failed events
   - Manual reconciliation

3. **State Management**
   - Track payment attempts
   - Store error details
   - Enable debugging

## Refund Management

### Refund Process

1. **Initiation**
   - Admin/system triggers refund
   - Validate refund eligibility
   - Calculate refund amount

2. **Processing**
   - Call Stripe refund API
   - Update booking status
   - Log refund details

3. **Completion**
   - Confirm refund processed
   - Send notification
   - Update accounting

### Refund Rules

```typescript
const refundRules = {
  full: {
    condition: 'cancelled_24h_before',
    amount: 1.0 // 100%
  },
  partial: {
    condition: 'cancelled_6h_before',
    amount: 0.5 // 50%
  },
  none: {
    condition: 'cancelled_less_6h',
    amount: 0 // No refund
  }
}
```

## Order Management

### Order Lifecycle

1. **Creation**: Booking created
2. **Payment Pending**: Awaiting payment
3. **Payment Processing**: Payment in progress
4. **Paid**: Payment successful
5. **Fulfilled**: Service delivered
6. **Completed**: Order closed
7. **Refunded**: Money returned

### Order Tracking

```typescript
interface Order {
  id: string
  bookingNumber: string
  status: OrderStatus
  amount: number
  paidAmount: number
  refundedAmount: number
  paymentMethod: string
  transactions: Transaction[]
  timeline: OrderEvent[]
}
```

## Testing

### Test Cards (Stripe Test Mode)

| Card Number | Scenario |
|------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Decline |
| 4000 0025 0000 3155 | 3D Secure Required |
| 4000 0000 0000 9979 | Fraud Detection |

### Integration Testing

```typescript
describe('Payment Flow', () => {
  test('successful payment', async () => {
    const intent = await createPaymentIntent(booking, amount)
    const confirmation = await confirmPayment(intent)
    expect(confirmation.status).toBe('succeeded')
  })
  
  test('handles declined card', async () => {
    const intent = await createPaymentIntent(booking, amount)
    const confirmation = await confirmPayment(intent, declinedCard)
    expect(confirmation.error.code).toBe('card_declined')
  })
})
```

## Performance Optimization

### Caching Strategies

- Cache Stripe customer IDs
- Store payment method tokens
- Cache webhook events
- Memoize price calculations

### Async Processing

- Queue webhook processing
- Batch notification sending
- Async receipt generation
- Background reconciliation

## Monitoring & Analytics

### Key Metrics

- Payment success rate
- Average processing time
- Decline reasons
- Refund rate
- Dispute rate
- Revenue by period

### Logging

```typescript
// Payment attempt
logger.info('Payment attempted', {
  bookingId,
  amount,
  customerId,
  timestamp
})

// Payment result
logger.info('Payment result', {
  bookingId,
  status,
  chargeId,
  processingTime
})
```

## Compliance

### Regulatory Requirements

- **PCI DSS**: Level 1 compliance via Stripe
- **SCA**: Strong Customer Authentication
- **GDPR**: Data protection compliance
- **PSD2**: European payment regulations

### Audit Trail

```typescript
interface PaymentAudit {
  id: string
  action: string
  userId: string
  bookingId: string
  amount: number
  status: string
  timestamp: Date
  ipAddress: string
  userAgent: string
}
```

## Future Enhancements

### Planned Features

- **Multiple Payment Methods**
  - PayPal integration
  - Apple Pay / Google Pay
  - Bank transfers
  - Cryptocurrency

- **Advanced Features**
  - Split payments
  - Installment plans
  - Subscription billing
  - Group payment splitting

- **Financial Tools**
  - Invoice generation
  - Tax calculation
  - Multi-currency support
  - Dynamic currency conversion

### Technical Improvements

- GraphQL API for payments
- Real-time payment updates
- Machine learning fraud detection
- Blockchain payment verification
- Open Banking integration

## Troubleshooting

### Common Issues

#### Payment Not Processing
**Solutions:**
- Check Stripe API keys
- Verify webhook configuration
- Review payment intent status
- Check network connectivity

#### Webhook Not Received
**Solutions:**
- Verify webhook endpoint
- Check webhook secret
- Review Stripe logs
- Test with Stripe CLI

#### Refund Failed
**Solutions:**
- Verify charge status
- Check refund amount
- Review Stripe balance
- Contact Stripe support

## Configuration

### Environment Variables

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Payment Settings
PAYMENT_TIMEOUT_MINUTES=30
PAYMENT_RETRY_ATTEMPTS=3
REFUND_WINDOW_HOURS=24

# Currency Settings
DEFAULT_CURRENCY=USD
SUPPORTED_CURRENCIES=USD,EUR,GBP
```

### Feature Flags

```typescript
const paymentFeatures = {
  enableApplePay: false,
  enableGooglePay: false,
  enableSavedCards: true,
  enablePartialRefunds: true,
  enableAutoRefunds: false,
  require3DSecure: false
}
```

## Conclusion

The Payment & Orders module provides a secure, reliable, and user-friendly payment processing system. Through tight Stripe integration and comprehensive order management, it ensures smooth financial transactions while maintaining security compliance and providing excellent user experience. The module's architecture supports future expansion while maintaining stability and performance.