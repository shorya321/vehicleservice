# Vendor Process Documentation

## Overview

The Vehicle Service platform includes a comprehensive vendor management system that allows business owners to register as vehicle rental providers. This document outlines the complete vendor onboarding process, from initial application to active vendor status.

## Vendor Application Workflow

### 1. Customer Registration Phase

**Step 1: Account Creation**
- Users must first create a customer account on the platform
- Standard email verification process required
- User role initially set to "customer"

**Step 2: Vendor Application Submission**
- Customers can apply to become vendors through `/customer/apply-vendor`
- Application includes both required and optional information
- System prevents duplicate applications (one per user)

### 2. Application Review Phase

**Step 3: Admin Review**
- Admin can view all applications at `/admin/vendor-applications`
- Applications are organized by status: Pending, Approved, Rejected
- Admin can review detailed application information
- Decision-making tools available for approval/rejection

**Step 4: Status Updates**
- Approved vendors gain access to vendor dashboard
- Rejected applications can be reviewed and potentially resubmitted
- Email notifications sent for status changes

### 3. Active Vendor Phase

**Step 5: Profile Management**
- Approved vendors access profile at `/vendor/profile`
- Can update business information, documents, and banking details
- Profile information used for customer-facing listings

**Step 6: Vehicle Management**
- Vendors can add/edit vehicles through vendor dashboard
- Vehicle listings visible to customers for booking
- Integrated with booking and payment systems

## Required Information

### Basic Business Information (Required)
- **Business Name**: Official registered business name
- **Business Registration Number**: Government-issued registration number (unique)
- **Business Email**: Primary contact email for business inquiries
- **Business Phone**: Primary contact number
- **Business Address**: Physical business location
- **Business City**: City where business operates
- **Business Country**: Operating country (default: AE)
- **Business Description**: Detailed description of services offered

### Documents Information (Optional initially, can be completed later)
- **Trade License Number**: Official trade license identifier
- **Trade License Expiry**: Expiration date of trade license
- **Insurance Policy Number**: Business insurance policy identifier
- **Insurance Expiry**: Insurance policy expiration date

### Banking Details (Optional initially, required for payments)
- **Bank Name**: Name of the business banking institution
- **Account Holder Name**: Name on the business bank account
- **Account Number**: Business bank account number
- **IBAN**: International Bank Account Number for transfers
- **SWIFT Code**: Bank identification code for international transfers

## Database Schema

### vendor_applications Table

```sql
CREATE TABLE vendor_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    business_name TEXT NOT NULL,
    business_email TEXT,
    business_phone TEXT,
    business_address TEXT,
    business_city TEXT,
    business_country_code TEXT DEFAULT 'AE',
    business_description TEXT,
    registration_number TEXT UNIQUE,
    documents JSONB DEFAULT '{}',
    banking_details JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### JSON Structure Examples

**Documents JSONB:**
```json
{
    "trade_license_number": "TL-123456789",
    "trade_license_expiry": "2025-12-31",
    "insurance_policy_number": "INS-123456789",
    "insurance_expiry": "2025-12-31"
}
```

**Banking Details JSONB:**
```json
{
    "bank_name": "Emirates NBD",
    "account_holder_name": "ABC Car Rentals LLC",
    "account_number": "1234567890",
    "iban": "AE07 0331 2345 6789 0123 456",
    "swift_code": "EBILAEAD"
}
```

## User Roles and Permissions

### Customer Role
- Can submit vendor applications
- Can view their application status
- Cannot access vendor-specific features until approved

### Vendor Role
- Can manage business profile
- Can add/edit vehicles
- Can view bookings and earnings
- Cannot access admin functions

### Admin Role
- Can review all vendor applications
- Can approve/reject applications
- Can view vendor statistics
- Can manage all system users

## Application Statuses

### Pending
- **Description**: Application submitted but not yet reviewed
- **User Experience**: Waiting for admin review
- **Admin Action**: Review required

### Approved
- **Description**: Application accepted by admin
- **User Experience**: Full vendor access granted
- **Admin Action**: Can add admin notes

### Rejected
- **Description**: Application declined by admin
- **User Experience**: Can view rejection reason
- **Admin Action**: Must provide rejection reason

## Page Structure and Navigation

### Customer Pages
- `/customer/apply-vendor` - Vendor application form
- `/customer/vendor-application` - View application status

### Vendor Pages
- `/vendor/dashboard` - Main vendor overview
- `/vendor/profile` - Business profile management
- `/vendor/vehicles` - Vehicle inventory management

### Admin Pages
- `/admin/vendor-applications` - All applications overview
- `/admin/vendor-applications/[id]` - Individual application review

## Form Validation Rules

### Required Fields
- Business name (minimum 2 characters)
- Business registration number (unique across platform)
- Valid email format for business email (if provided)

### Optional Fields
- All document and banking details can be completed later
- Phone numbers validated for minimum length
- Date fields use standard date picker format

### Data Validation
- Registration numbers must be unique
- Email addresses validated for proper format
- IBAN format guidance provided to users
- Date fields prevent past dates for expiry dates

## Security Considerations

### Data Protection
- Banking details stored as encrypted JSONB
- Access restricted by user role
- Audit trail maintained for all changes

### Row Level Security (RLS)
- Users can only view/edit their own applications
- Admins have full access to all applications
- Approved vendors can update their profiles

### Input Sanitization
- All form inputs validated and sanitized
- SQL injection prevention through parameterized queries
- XSS prevention through proper output encoding

## API Endpoints

### Application Management
- `POST /vendor/profile` - Update vendor profile
- `GET /vendor/profile` - Retrieve vendor data
- `POST /customer/apply-vendor` - Submit application

### Admin Functions
- `GET /admin/vendor-applications` - List all applications
- `POST /admin/vendor-applications/[id]/approve` - Approve application
- `POST /admin/vendor-applications/[id]/reject` - Reject application

## Future Enhancements

### Document Upload
- File upload functionality for license documents
- Image verification system
- Document expiry notifications

### Payment Integration
- Automated payment processing setup
- Commission calculation system
- Financial reporting dashboard

### Communication System
- In-app messaging between admin and vendors
- Email templates for status updates
- SMS notifications for urgent updates

## Troubleshooting

### Common Issues

**Application Not Submitting**
- Check required fields completion
- Verify unique registration number
- Check network connectivity

**Profile Updates Failing**
- Verify vendor approval status
- Check field validation errors
- Ensure proper authentication

**Missing Banking Details**
- Complete banking section in profile
- Verify IBAN format
- Contact admin if fields are disabled

### Support Contacts
- Technical Issues: Contact system administrator
- Business Inquiries: Use business email provided in profile
- Urgent Issues: Check application status page for admin notes

## Conclusion

The vendor process is designed to be comprehensive yet user-friendly, allowing businesses to easily join the platform while maintaining quality standards through admin review. The modular approach to information collection allows for immediate application submission with optional completion of detailed information later.

Regular updates to this documentation will reflect system enhancements and process improvements.