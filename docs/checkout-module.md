# Checkout Module Documentation

## Overview

The Checkout module provides a seamless, multi-step process for customers to complete their transfer bookings. It handles user authentication, form validation, price calculation, and initiates the booking creation process before redirecting to payment.

## Key Features

- **Progressive Authentication**: Redirect to login if not authenticated, with return URL preservation
- **Dynamic Pricing**: Real-time price calculation based on zones and vehicle types
- **Form Validation**: Comprehensive validation using Zod schema
- **Amenities Selection**: Child seats, extra luggage options
- **Profile Auto-fill**: Automatic population from user profile
- **Progress Tracking**: Visual progress bar showing checkout steps
- **Terms Acceptance**: Legal compliance with terms and conditions

## Architecture

### Page Structure

```
/checkout
├── page.tsx (Server Component - Authentication & Data Loading)
├── actions.ts (Server Actions - Data Fetching & Booking Creation)
└── components/
    ├── checkout-wrapper.tsx (Client Component - Main Form)
    ├── progress-bar.tsx (Visual Progress Indicator)
    └── [other checkout components]
```

### Data Flow

1. **URL Parameters** → Search parameters contain booking details
2. **Authentication Check** → Verify user is logged in
3. **Data Loading** → Fetch locations, vehicle types, pricing
4. **Form Rendering** → Display checkout form with pre-filled data
5. **Form Submission** → Validate and create booking
6. **Payment Redirect** → Navigate to payment page

## Database Integration

### Related Tables

#### locations
- Used to fetch origin and destination details
- Provides zone information for pricing

#### vehicle_types
- Retrieves vehicle specifications
- Contains price multipliers

#### zones & zone_pricing
- Calculates base price between zones
- Applied to vehicle type multiplier

#### profiles
- User information for auto-fill
- Contact details storage

## API Endpoints & Server Actions

### Data Fetching Actions

#### `getLocationDetails(locationId: string)`
Fetches detailed location information including zone data.

**Returns:**
```typescript
{
  id: string
  name: string
  city: string | null
  country_code: string
  zone_id: string | null
  zones: {
    id: string
    name: string
  } | null
}
```

#### `getVehicleType(vehicleTypeId, fromLocationId?, toLocationId?)`
Retrieves vehicle type with calculated pricing based on zones.

**Returns:**
```typescript
{
  id: string
  name: string
  slug: string
  description: string | null
  passenger_capacity: number
  luggage_capacity: number
  image_url: string | null
  price: number // Calculated based on zones
}
```

### Booking Creation

#### `createBooking(formData: BookingFormData)`
Creates a complete booking with passengers and amenities.

**Parameters:**
```typescript
{
  vehicleTypeId: string
  fromLocationId?: string
  toLocationId?: string
  pickupAddress: string
  dropoffAddress: string
  pickupDate: string
  pickupTime: string
  passengerCount: number
  luggageCount: number
  firstName: string
  lastName: string
  email: string
  phone: string
  specialRequests?: string
  childSeats: {
    infant: number
    booster: number
  }
  extraLuggageCount: number
  basePrice: number
  agreeToTerms: boolean
  paymentMethod: 'card'
}
```

**Process:**
1. Validates all form data using Zod schema
2. Generates unique booking number
3. Calculates total price (base + amenities)
4. Creates booking record
5. Adds passenger details
6. Adds amenities if selected
7. Returns booking ID and number

**Returns:**
```typescript
{
  success: boolean
  bookingNumber: string
  bookingId: string
  totalPrice: number
}
```

## UI Components

### CheckoutWrapper
Main client component handling the checkout form.

**Features:**
- Multi-section form layout
- Real-time validation
- Price calculation display
- Loading states
- Error handling

**Sections:**
1. **Booking Details**
   - Pickup/dropoff addresses
   - Date and time selection
   - Passenger and luggage count

2. **Passenger Information**
   - Primary passenger details
   - Contact information
   - Auto-fill from profile

3. **Additional Services**
   - Child seats (infant/booster)
   - Extra luggage
   - Special requests

4. **Price Summary**
   - Base fare
   - Amenities charges
   - Total price display

5. **Terms & Payment**
   - Terms acceptance checkbox
   - Payment method selection
   - Continue to payment button

### ProgressBar
Visual indicator showing checkout progress.

**Steps:**
1. Search
2. Select Vehicle
3. Checkout Details
4. Payment
5. Confirmation

## User Workflows

### Standard Checkout Flow

1. **Search Results** → User selects vehicle type
2. **Authentication Check**
   - If logged in → Continue to checkout
   - If not → Redirect to login with return URL
3. **Checkout Form**
   - Review booking details
   - Enter/confirm passenger info
   - Select additional services
   - Accept terms
4. **Form Submission**
   - Validate all fields
   - Create booking in database
   - Generate booking number
5. **Payment Redirect**
   - Pass booking ID to payment page
   - Include total amount

### Authentication Flow

1. **Not Authenticated**
   - Capture current URL with parameters
   - Redirect to `/auth/checkout-login`
   - Preserve return URL

2. **Login/Register**
   - User completes authentication
   - System creates/updates profile
   - Redirect back to checkout

3. **Profile Sync**
   - Check for existing profile
   - Use metadata if profile incomplete
   - Auto-fill form fields

## Price Calculation Logic

### Base Price Determination

```typescript
// 1. Get zone IDs for locations
const fromZoneId = fromLocation.zone_id
const toZoneId = toLocation.zone_id

// 2. Fetch zone pricing
const zonePricing = await getZonePricing(fromZoneId, toZoneId)

// 3. Apply vehicle multiplier
const basePrice = zonePricing.base_price * vehicleType.price_multiplier
```

### Amenities Pricing

- **Child Seat (Infant)**: $10 per seat
- **Child Seat (Booster)**: $10 per seat
- **Extra Luggage**: $15 per bag

### Total Calculation

```typescript
const totalPrice = basePrice + amenitiesPrice
```

## Validation Rules

### Form Validation Schema

```typescript
const bookingSchema = z.object({
  // Location & Vehicle
  vehicleTypeId: z.string().uuid(),
  fromLocationId: z.string().uuid().optional(),
  toLocationId: z.string().uuid().optional(),
  
  // Addresses
  pickupAddress: z.string().min(1),
  dropoffAddress: z.string().min(1),
  
  // Date & Time
  pickupDate: z.string(),
  pickupTime: z.string(),
  
  // Capacity
  passengerCount: z.number().min(1).max(50),
  luggageCount: z.number().min(0).max(50),
  
  // Passenger Info
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  
  // Additional
  specialRequests: z.string().optional(),
  childSeats: z.object({
    infant: z.number().min(0).max(4),
    booster: z.number().min(0).max(4)
  }),
  extraLuggageCount: z.number().min(0),
  
  // Payment
  basePrice: z.number().min(0),
  agreeToTerms: z.boolean().refine(val => val === true),
  paymentMethod: z.enum(['card'])
})
```

## Security Considerations

### Authentication
- Required for checkout access
- User ID verified server-side
- Session validation

### Data Protection
- Server-side validation
- SQL injection prevention via parameterized queries
- XSS protection through React sanitization

### Price Integrity
- Server-side price calculation
- Client price display only
- Verification before booking creation

## Error Handling

### Common Errors

1. **Authentication Failed**
   - Redirect to login
   - Preserve checkout data

2. **Invalid Parameters**
   - Redirect to home
   - Show error message

3. **Location Not Found**
   - Fallback to search
   - Clear invalid data

4. **Booking Creation Failed**
   - Display error message
   - Retain form data
   - Allow retry

## Integration Points

### 1. Search Module
- Receives search parameters
- Vehicle type selection
- Location IDs

### 2. Authentication System
- Login/register flow
- Profile management
- Session handling

### 3. Payment Module
- Booking ID transfer
- Amount verification
- Payment processing

### 4. Zone Pricing
- Dynamic price calculation
- Zone-based rates
- Vehicle multipliers

## Performance Optimization

### Data Loading
- Parallel fetching of locations and vehicle types
- Cached zone pricing data
- Optimized database queries

### Client-Side
- Form state management
- Debounced validation
- Optimistic UI updates

## Accessibility Features

- Keyboard navigation support
- ARIA labels for form fields
- Error message announcements
- Focus management
- Screen reader compatibility

## Mobile Responsiveness

- Responsive form layout
- Touch-friendly inputs
- Mobile-optimized date/time pickers
- Simplified navigation

## Testing Considerations

### Unit Tests
- Form validation logic
- Price calculation functions
- Date/time formatting

### Integration Tests
- Authentication flow
- Booking creation process
- Payment redirect

### E2E Tests
- Complete checkout flow
- Error scenarios
- Mobile experience

## Future Enhancements

### Planned Features
- Guest checkout option
- Saved passenger profiles
- Multiple passenger support
- Round-trip bookings
- Promo code system
- Favorite routes
- Express checkout

### Technical Improvements
- Real-time availability checking
- Dynamic pricing based on demand
- Address autocomplete
- Flight number integration
- SMS notifications
- Email confirmations

## Troubleshooting Guide

### Issue: Form won't submit
**Solutions:**
- Check all required fields
- Verify terms acceptance
- Validate email format
- Ensure phone number length

### Issue: Price not showing
**Solutions:**
- Verify zone assignments
- Check vehicle type status
- Confirm pricing rules exist

### Issue: Authentication loop
**Solutions:**
- Clear browser cookies
- Check return URL encoding
- Verify session status

### Issue: Profile not auto-filling
**Solutions:**
- Check profile completeness
- Verify metadata sync
- Refresh profile data

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Constants
```typescript
// Pricing
const CHILD_SEAT_PRICE = 10
const EXTRA_LUGGAGE_PRICE = 15

// Validation
const MIN_PASSENGERS = 1
const MAX_PASSENGERS = 50
const MAX_CHILD_SEATS = 4
```

## Conclusion

The Checkout module provides a robust, user-friendly interface for completing transfer bookings. With comprehensive validation, dynamic pricing, and seamless integration with authentication and payment systems, it ensures a smooth booking experience while maintaining data integrity and security.