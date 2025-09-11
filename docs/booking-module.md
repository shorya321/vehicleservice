# Booking Module Documentation

## Overview

The Booking module is the core system that manages the entire lifecycle of transfer bookings, from creation through completion. It provides comprehensive functionality for customers to make bookings, administrators to manage them, and drivers to fulfill them. The module handles booking states, passenger information, amenities, and integrates with zones, vehicles, and payment systems.

## Key Features

- **Complete Booking Management**: Create, read, update, and cancel bookings
- **Multi-role Access**: Different views for customers, admins, and vendors
- **Status Tracking**: Multiple booking and payment statuses
- **Passenger Management**: Primary and additional passenger details
- **Amenities System**: Child seats, extra luggage, special requests
- **Advanced Filtering**: Search by date, status, customer, vehicle type
- **Statistics Dashboard**: Real-time booking metrics
- **Bulk Operations**: Mass status updates and exports
- **Zone-based Pricing**: Integration with zone pricing system

## Architecture

### Database Schema

#### 1. **bookings** Table
Core booking information and status tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| booking_number | text | Unique booking identifier (e.g., BK1234567ABC) |
| customer_id | uuid | FK to profiles.id |
| vehicle_type_id | uuid | FK to vehicle_types.id |
| from_location_id | uuid | FK to locations.id (nullable) |
| to_location_id | uuid | FK to locations.id (nullable) |
| from_zone_id | uuid | FK to zones.id (nullable) |
| to_zone_id | uuid | FK to zones.id (nullable) |
| pickup_address | text | Full pickup address |
| dropoff_address | text | Full dropoff address |
| pickup_datetime | timestamp | Scheduled pickup time |
| passenger_count | integer | Number of passengers |
| luggage_count | integer | Number of luggage pieces |
| base_price | numeric | Base fare amount |
| amenities_price | numeric | Additional services cost |
| total_price | numeric | Total booking amount |
| currency | text | Currency code (default: USD) |
| booking_status | text | Status: pending, confirmed, in_progress, completed, cancelled |
| payment_status | text | Status: pending, processing, paid, failed, refunded |
| customer_notes | text | Special requests/notes |
| cancellation_reason | text | Reason for cancellation |
| cancelled_at | timestamp | Cancellation timestamp |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |
| stripe_payment_intent_id | text | Stripe payment reference |
| stripe_charge_id | text | Stripe charge reference |
| payment_method_details | jsonb | Payment method information |
| paid_at | timestamp | Payment completion time |
| payment_error | text | Payment error details |

#### 2. **booking_passengers** Table
Passenger information for bookings.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| booking_id | uuid | FK to bookings.id |
| is_primary | boolean | Primary passenger flag |
| first_name | text | Passenger first name |
| last_name | text | Passenger last name |
| email | text | Contact email |
| phone | text | Contact phone |
| created_at | timestamp | Creation timestamp |

#### 3. **booking_amenities** Table
Additional services for bookings.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| booking_id | uuid | FK to bookings.id |
| amenity_type | text | Type: child_seat_infant, child_seat_booster, extra_luggage |
| quantity | integer | Number of items |
| price | numeric | Total price for amenity |
| created_at | timestamp | Creation timestamp |

### Relationships

```
profiles (1) → (N) bookings
bookings (1) → (N) booking_passengers
bookings (1) → (N) booking_amenities
bookings (N) → (1) vehicle_types
bookings (N) → (1) locations (from/to)
bookings (N) → (1) zones (from/to)
```

## Booking Statuses

### Booking Status Flow

```
pending → confirmed → in_progress → completed
    ↓         ↓            ↓
cancelled  cancelled   cancelled
```

#### Status Definitions

- **pending**: Initial status after creation
- **confirmed**: Payment received, awaiting service
- **in_progress**: Driver assigned, service ongoing
- **completed**: Service successfully delivered
- **cancelled**: Booking cancelled by customer/admin

### Payment Status Flow

```
pending → processing → paid
    ↓         ↓         ↓
  failed   failed   refunded
```

#### Payment Status Definitions

- **pending**: Awaiting payment initiation
- **processing**: Payment in progress
- **paid**: Payment successful
- **failed**: Payment unsuccessful
- **refunded**: Payment returned to customer

## API Endpoints & Server Actions

### Admin Booking Actions

#### `getBookings(filters: BookingFilters)`
Retrieves paginated bookings with advanced filtering.

**Parameters:**
```typescript
{
  search?: string          // Search booking number, customer name
  status?: string          // Filter by booking status
  paymentStatus?: string   // Filter by payment status
  vehicleTypeId?: string   // Filter by vehicle type
  dateFrom?: string        // Start date filter
  dateTo?: string          // End date filter
  customerId?: string      // Filter by customer
  page?: number           // Page number
  limit?: number          // Items per page
}
```

**Returns:**
```typescript
{
  bookings: Booking[]     // Array of bookings with relations
  total: number          // Total count
  page: number           // Current page
  totalPages: number     // Total pages
}
```

#### `getBookingStats()`
Retrieves booking statistics for dashboard.

**Returns:**
```typescript
{
  total: number          // Total bookings
  today: number          // Today's bookings
  upcoming: number       // Future bookings
  completed: number      // Completed bookings
  cancelled: number      // Cancelled bookings
  revenue: number        // Total revenue
}
```

#### `getBookingById(id: string)`
Fetches detailed booking information.

**Returns:** Complete booking with all relations (passengers, amenities, vehicle, locations, customer)

#### `updateBookingStatus(id: string, status: string)`
Updates booking status with validation.

**Validations:**
- Status transition rules
- Payment status checks
- Cancellation restrictions

#### `bulkUpdateStatus(bookingIds: string[], status: string)`
Updates multiple bookings' status.

**Process:**
1. Validate all bookings exist
2. Check status transition validity
3. Update all bookings
4. Log bulk operation

#### `cancelBooking(id: string, reason: string)`
Cancels a booking with reason tracking.

**Process:**
1. Validate cancellation allowed
2. Update booking status
3. Set cancellation reason
4. Trigger refund if paid
5. Send notifications

### Customer Booking Actions

#### `getCustomerBookings(customerId: string, filters?)`
Retrieves customer's bookings with optional filters.

**Returns:** Paginated list of customer bookings

#### `getUpcomingBookings(customerId: string)`
Gets customer's future bookings.

**Returns:** Array of upcoming bookings sorted by date

#### `getBookingHistory(customerId: string)`
Retrieves customer's past bookings.

**Returns:** Historical bookings with pagination

## UI Components

### Admin Components

#### BookingsTable
Main data table for booking management.

**Features:**
- Sortable columns
- Status badges
- Quick actions
- Bulk selection
- Inline editing
- Export functionality

#### BookingFilters
Advanced filtering interface.

**Filters:**
- Date range picker
- Status dropdown
- Payment status
- Vehicle type
- Customer search
- Quick filters (Today, This Week, This Month)

#### BookingDetail
Detailed booking view modal/page.

**Sections:**
- Booking information
- Customer details
- Passenger list
- Amenities
- Payment information
- Status history
- Action buttons

#### BulkActionsBar
Bulk operations toolbar.

**Actions:**
- Update status
- Export selected
- Send notifications
- Generate reports

### Customer Components

#### CustomerBookingsList
Customer's booking history display.

**Features:**
- Chronological listing
- Status indicators
- Quick actions (View, Cancel)
- Filtering by status
- Search functionality

#### BookingCard
Individual booking display card.

**Information:**
- Booking number
- Route details
- Date and time
- Vehicle type
- Price
- Status
- Actions

#### BookingTimeline
Visual representation of booking progress.

**Stages:**
1. Booking created
2. Payment received
3. Driver assigned
4. In transit
5. Completed

## User Workflows

### Customer Booking Flow

1. **Search & Select**
   - Search for route
   - Select vehicle type
   - Choose date/time

2. **Checkout**
   - Enter passenger details
   - Select amenities
   - Review pricing

3. **Payment**
   - Enter payment details
   - Process payment
   - Receive confirmation

4. **Tracking**
   - View booking status
   - Receive notifications
   - Track driver (if applicable)

5. **Completion**
   - Service delivered
   - Rate experience
   - View in history

### Admin Management Flow

1. **Dashboard Review**
   - Check daily statistics
   - View pending bookings
   - Monitor cancellations

2. **Booking Processing**
   - Review new bookings
   - Confirm payments
   - Assign drivers

3. **Status Management**
   - Update booking status
   - Handle cancellations
   - Process refunds

4. **Reporting**
   - Generate reports
   - Export data
   - Analyze trends

## Business Logic

### Booking Number Generation

```typescript
const bookingNumber = `BK${Date.now()}${Math.random()
  .toString(36)
  .substr(2, 5)}`
  .toUpperCase()
```

Format: BK + timestamp + random string (e.g., BK1234567890ABC12)

### Price Calculation

```typescript
// Base price from zone pricing
const basePrice = zonePricing * vehicleMultiplier

// Amenities pricing
const amenitiesPrice = 
  (childSeatsInfant * 10) +
  (childSeatsBooster * 10) +
  (extraLuggage * 15)

// Total calculation
const totalPrice = basePrice + amenitiesPrice
```

### Cancellation Rules

- **Customer Cancellation**:
  - Free if > 24 hours before pickup
  - 50% charge if 6-24 hours
  - No refund if < 6 hours

- **Admin Cancellation**:
  - Full refund always
  - Reason required
  - Customer notification

### Status Transition Rules

```typescript
const validTransitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
}
```

## Integration Points

### 1. Payment System
- Stripe payment processing
- Payment intent creation
- Refund processing
- Payment status sync

### 2. Zone Pricing
- Dynamic price calculation
- Zone-based rates
- Distance factors

### 3. Vehicle Management
- Vehicle type selection
- Capacity validation
- Availability checking

### 4. Notification System
- Email confirmations
- SMS updates
- Push notifications
- Status change alerts

### 5. Driver Assignment
- Driver matching
- Route optimization
- Real-time tracking

## Security Considerations

### Access Control
- Role-based permissions
- Customer can only view own bookings
- Admin full access
- Vendor limited access

### Data Protection
- PII encryption
- Payment data security
- Audit logging
- GDPR compliance

### Validation
- Server-side validation
- Input sanitization
- SQL injection prevention
- XSS protection

## Performance Optimization

### Database
- Indexed foreign keys
- Optimized queries
- Pagination implementation
- Caching strategies

### Frontend
- Lazy loading
- Virtual scrolling for large lists
- Optimistic UI updates
- Debounced search

## Reporting & Analytics

### Available Reports
- Daily booking summary
- Revenue reports
- Customer analytics
- Route popularity
- Cancellation analysis
- Payment failure rates

### Metrics Tracked
- Booking volume
- Average booking value
- Conversion rates
- Customer retention
- Service completion rate
- Payment success rate

## Error Handling

### Common Errors

1. **Payment Failed**
   - Retry payment
   - Alternative payment method
   - Admin intervention

2. **Vehicle Unavailable**
   - Suggest alternatives
   - Waitlist option
   - Notification when available

3. **Booking Conflict**
   - Time slot taken
   - Double booking prevention
   - Alternative suggestions

4. **Validation Errors**
   - Clear error messages
   - Field highlighting
   - Inline validation

## Testing Strategies

### Unit Tests
- Price calculation logic
- Status transition validation
- Booking number generation
- Date/time handling

### Integration Tests
- Booking creation flow
- Payment processing
- Status updates
- Cancellation process

### E2E Tests
- Complete booking journey
- Admin management flow
- Customer portal
- Mobile experience

## Mobile Considerations

- Responsive design
- Touch-optimized interfaces
- Mobile-specific features
- Offline capability
- Push notifications

## Accessibility

- WCAG 2.1 compliance
- Screen reader support
- Keyboard navigation
- High contrast mode
- Clear error messages

## Future Enhancements

### Planned Features
- Recurring bookings
- Group bookings
- Loyalty program
- Dynamic pricing
- AI-based demand prediction
- Multi-language support
- Voice booking
- Blockchain receipts

### Technical Improvements
- Real-time updates via WebSocket
- Microservices architecture
- GraphQL API
- Machine learning for fraud detection
- Automated driver assignment
- Route optimization algorithms

## Configuration

### Environment Variables
```env
BOOKING_CANCELLATION_HOURS=24
BOOKING_MODIFICATION_HOURS=6
MAX_PASSENGERS=50
MAX_LUGGAGE=20
CHILD_SEAT_PRICE=10
EXTRA_LUGGAGE_PRICE=15
```

### Feature Flags
```typescript
const features = {
  enableBulkOperations: true,
  enableAutoAssignment: false,
  enableDynamicPricing: false,
  enableLoyaltyPoints: false
}
```

## Troubleshooting Guide

### Issue: Booking not creating
**Solutions:**
- Check user authentication
- Verify payment processing
- Validate all required fields
- Check zone assignments

### Issue: Status not updating
**Solutions:**
- Verify transition rules
- Check user permissions
- Review payment status
- Check for locks

### Issue: Payment not processing
**Solutions:**
- Verify Stripe configuration
- Check payment method
- Review amount calculations
- Test in Stripe dashboard

## Conclusion

The Booking module provides a comprehensive solution for managing transfer bookings across the entire lifecycle. With robust status management, flexible pricing, and multi-role access, it serves as the backbone of the vehicle service platform, ensuring smooth operations for customers, administrators, and service providers.