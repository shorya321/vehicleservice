# User Module Documentation

## Overview

The User module provides comprehensive user management functionality for administrators. It includes features for managing user accounts, roles, authentication settings, and bulk operations. The module follows modern Next.js 13+ patterns using server actions for all database operations.

## Features

- **User CRUD Operations**: Create, read, update, and delete user accounts
- **Advanced Filtering**: Search and filter users by multiple criteria
- **Bulk Operations**: Perform actions on multiple users simultaneously
- **Role Management**: Assign and manage user roles (admin, customer, vendor, driver)
- **Authentication Management**: Password resets, 2FA settings, email verification
- **Activity Tracking**: Log and view user activities
- **Profile Photos**: Upload and manage user avatars
- **Export Functionality**: Export user data to CSV

## Database Schema

### Table: `profiles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, references auth.users |
| `email` | VARCHAR | User's email address |
| `full_name` | VARCHAR | User's full name |
| `phone` | VARCHAR | Phone number (optional) |
| `role` | VARCHAR | User role: admin, customer, vendor, driver |
| `status` | VARCHAR | Account status: active, inactive, suspended |
| `avatar_url` | TEXT | Profile photo URL |
| `email_verified` | BOOLEAN | Email verification status |
| `email_verified_at` | TIMESTAMPTZ | Email verification timestamp |
| `two_factor_enabled` | BOOLEAN | 2FA enabled status |
| `two_factor_secret` | TEXT | 2FA secret (encrypted) |
| `last_sign_in_at` | TIMESTAMPTZ | Last login timestamp |
| `created_at` | TIMESTAMPTZ | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Related Tables

- **`user_activity_logs`**: Tracks user actions and changes
- **`auth.users`**: Supabase authentication table

## File Structure

```
app/admin/users/
├── page.tsx                    # Main users list page
├── new/
│   └── page.tsx               # Create new user page
├── [id]/
│   ├── page.tsx               # Edit user page
│   ├── activity/
│   │   └── page.tsx           # User activity logs
│   └── photo/
│       ├── page.tsx           # Photo upload page
│       └── photo-upload-form.tsx
├── actions.ts                 # Aggregated exports
├── actions/
│   ├── index.ts               # Action exports
│   ├── user-crud.actions.ts   # CRUD operations
│   ├── user-status.actions.ts # Status management
│   ├── user-bulk.actions.ts   # Bulk operations
│   ├── user-auth.actions.ts   # Authentication actions
│   ├── user-activity.actions.ts # Activity logging
│   ├── user-photo.actions.ts  # Photo management
│   └── user-delete.actions.ts # Delete operations
└── components/
    ├── user-table.tsx         # Basic user table
    ├── user-table-with-bulk.tsx # Table with bulk selection
    ├── user-form.tsx          # Create/edit form
    ├── user-filters.tsx       # Filter controls
    ├── client-filters.tsx     # Client-side filter wrapper
    ├── bulk-actions-bar.tsx   # Bulk actions UI
    └── delete-user-dialog.tsx # Delete confirmation

lib/types/user.ts              # TypeScript type definitions
```

## Key Components

### 1. Users List Page (`page.tsx`)

The main page displaying all users with filtering, pagination, and statistics.

**Features:**
- Server-side data fetching with filters
- URL-based state management
- User statistics card
- Pagination controls
- Add user button

**Query Parameters:**
- `search` - Search by name, email, or phone
- `role` - Filter by user role
- `status` - Filter by account status
- `emailVerified` - Filter by email verification
- `twoFactorEnabled` - Filter by 2FA status
- `hasSignedIn` - Filter by login history
- `page` - Current page number

### 2. User Table (`user-table-with-bulk.tsx`)

Interactive table with checkbox selection for bulk operations.

**Features:**
- Select all/individual checkboxes
- User avatars with fallback initials
- Role and status badges
- Verification indicators
- Last sign-in display
- Individual row actions dropdown
- Bulk actions bar (appears when users selected)

**Row Actions:**
- Edit user
- View activity
- Upload photo
- Change status (activate/suspend)
- Send password reset
- Toggle 2FA
- Send verification email
- Delete user

### 3. User Form (`user-form.tsx`)

Comprehensive form for creating and editing users.

**Sections:**
1. **Personal Information**
   - Full name
   - Email address
   - Phone number (with validation)

2. **Account Settings**
   - Role selection
   - Status selection
   - Email verification toggle
   - Password (create mode only)

**Features:**
- Form validation with Zod
- Phone number formatting
- Password generation
- Loading states
- Error handling
- Success notifications

### 4. Filter Components

**`user-filters.tsx`**
- Search input with debouncing
- Role dropdown (All, Admin, Customer, Vendor, Driver)
- Status dropdown (All, Active, Inactive, Suspended)
- Advanced filters popover:
  - Email Verified (All/Yes/No)
  - 2FA Enabled (All/Yes/No)
  - Has Signed In (All/Yes/Never)
- Clear all filters button

**`client-filters.tsx`**
- Manages URL state synchronization
- Updates query parameters on filter change

### 5. Bulk Actions Bar (`bulk-actions-bar.tsx`)

Appears when users are selected, providing bulk operations.

**Actions:**
- **Activate All** - Activate selected users
- **Suspend All** - Suspend selected users
- **Send Password Reset** - Email password reset links
- **Send Verification Email** - Send verification emails
- **Disable 2FA** - Remove 2FA from accounts
- **Export to CSV** - Download user data
- **Delete All** - Delete selected users (with confirmation)

### 6. User Activity (`user-activity.actions.ts`)

Tracks and logs user actions for audit purposes.

**Logged Actions:**
- User creation
- Profile updates
- Status changes
- Role changes
- Password resets
- 2FA changes
- Email verification

## Server Actions

All database operations use Next.js server actions for type safety and performance.

### CRUD Operations (`user-crud.actions.ts`)

```typescript
// Fetch users with filters and pagination
getUsers(filters: UserFilters): Promise<PaginatedUsers>

// Get single user by ID
getUser(id: string): Promise<User | null>

// Create new user
createUser(data: CreateUserData): Promise<{ user?: User, error?: string }>

// Update user
updateUser(id: string, data: UserUpdate): Promise<{ user?: User, error?: string }>
```

### Status Management (`user-status.actions.ts`)

```typescript
// Update single user status
updateUserStatus(userId: string, status: UserStatus): Promise<{ error?: string }>

// Bulk update status
bulkUpdateUserStatus(userIds: string[], status: UserStatus): Promise<{ error?: string }>
```

### Authentication Actions (`user-auth.actions.ts`)

```typescript
// Send password reset email
sendPasswordResetEmail(email: string): Promise<{ error?: string }>

// Toggle 2FA
toggleUser2FA(userId: string, enabled: boolean): Promise<{ error?: string }>

// Bulk disable 2FA
bulkDisable2FA(userIds: string[]): Promise<{ error?: string }>

// Bulk send password resets
bulkSendPasswordReset(userIds: string[]): Promise<{ error?: string }>

// Send verification email
sendVerificationEmail(userId: string): Promise<{ error?: string }>

// Bulk send verification emails
bulkSendVerificationEmails(userIds: string[]): Promise<{ error?: string }>
```

### Bulk Operations (`user-bulk.actions.ts`)

```typescript
// Delete multiple users
bulkDeleteUsers(userIds: string[]): Promise<{ error?: string }>

// Export users to CSV
exportUsersToCSV(userIds?: string[]): Promise<{ data?: string, error?: string }>
```

### Photo Management (`user-photo.actions.ts`)

```typescript
// Upload user photo
uploadUserPhoto(userId: string, file: File): Promise<{ url?: string, error?: string }>

// Delete user photo
deleteUserPhoto(userId: string): Promise<{ error?: string }>
```

### Activity Logging (`user-activity.actions.ts`)

```typescript
// Log user activity
logUserActivity(activity: UserActivity): Promise<void>

// Get user activity logs
getUserActivityLogs(userId: string): Promise<UserActivityLog[]>
```

## Type Definitions

### Core Types

```typescript
// User type from database
interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  status: UserStatus
  avatar_url: string | null
  email_verified: boolean
  email_verified_at: string | null
  two_factor_enabled: boolean
  last_sign_in_at: string | null
  created_at: string
  updated_at: string
}

// Role enum
type UserRole = 'admin' | 'customer' | 'vendor' | 'driver'

// Status enum
type UserStatus = 'active' | 'inactive' | 'suspended'
```

### Filter Interface

```typescript
interface UserFilters {
  search?: string
  role?: UserRole | 'all'
  status?: UserStatus | 'all'
  emailVerified?: boolean
  twoFactorEnabled?: boolean
  hasSignedIn?: boolean
  page?: number
  limit?: number
}
```

### Response Interfaces

```typescript
interface PaginatedUsers {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface UserActivityLog {
  id: string
  user_id: string
  action: string
  details: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}
```

## Usage Examples

### Creating a User

```typescript
const result = await createUser({
  email: "john.doe@example.com",
  full_name: "John Doe",
  phone: "+1234567890",
  role: "customer",
  status: "active",
  password: "securePassword123",
  send_invite: true
})

if (result.error) {
  console.error("Failed to create user:", result.error)
} else {
  console.log("User created:", result.user)
}
```

### Fetching Users with Filters

```typescript
// Get active admin users who have 2FA enabled
const { users, total } = await getUsers({
  role: 'admin',
  status: 'active',
  twoFactorEnabled: true,
  page: 1,
  limit: 20
})
```

### Bulk Operations

```typescript
// Suspend multiple users
await bulkUpdateUserStatus(['user1', 'user2', 'user3'], 'suspended')

// Send password resets to selected users
await bulkSendPasswordReset(['user1', 'user2'])

// Export filtered users to CSV
const { data } = await exportUsersToCSV()
```

### Activity Logging

```typescript
// Log a user action
await logUserActivity({
  user_id: userId,
  action: 'profile_updated',
  details: { fields_changed: ['full_name', 'phone'] },
  ip_address: request.ip,
  user_agent: request.headers['user-agent']
})

// Get user's activity history
const activities = await getUserActivityLogs(userId)
```

## Security Considerations

1. **Authentication**: All operations require authenticated user
2. **Authorization**: Admin role required for user management
3. **Self-Protection**: Users cannot delete or modify their own admin status
4. **Password Security**: Passwords hashed by Supabase Auth
5. **2FA Secrets**: Encrypted storage of 2FA secrets
6. **Activity Logging**: Audit trail for all modifications
7. **Email Verification**: Token-based email verification system

## Performance Optimizations

1. **Server Actions**: Direct database queries without HTTP overhead
2. **Pagination**: Configurable page sizes to limit data transfer
3. **Selective Loading**: Only load required user fields
4. **Batch Operations**: Bulk actions reduce database round trips
5. **Caching**: Automatic cache invalidation with `revalidatePath`
6. **Optimistic Updates**: UI updates before server confirmation

## Email Integration

The module integrates with email services for:

1. **Welcome Emails**: Sent on user creation
2. **Password Resets**: Secure reset links
3. **Email Verification**: Verification tokens
4. **2FA Setup**: Instructions and QR codes

### Email Templates

- Welcome email with temporary password
- Password reset instructions
- Email verification link
- 2FA setup guide

## Role-Based Access Control (RBAC)

### Role Hierarchy

1. **Admin**: Full system access
   - Manage all users
   - Access all features
   - System configuration

2. **Vendor**: Business operations
   - Manage inventory
   - Handle bookings
   - View reports

3. **Driver**: Service delivery
   - View assignments
   - Update trip status
   - Communication tools

4. **Customer**: End users
   - Make bookings
   - View history
   - Manage profile

## Future Enhancements

1. **Batch Import**: Import users from CSV/Excel
2. **Advanced Permissions**: Granular permission system
3. **User Groups**: Organize users into groups
4. **Login History**: Detailed login tracking
5. **Security Alerts**: Suspicious activity notifications
6. **API Keys**: Per-user API key management
7. **SSO Integration**: SAML/OAuth providers
8. **User Preferences**: Customizable settings
9. **Audit Reports**: Compliance reporting
10. **Session Management**: Active session control

## Troubleshooting

### Common Issues

1. **Cannot create user**
   - Check if email already exists
   - Verify email format is valid
   - Ensure password meets requirements

2. **Bulk actions not working**
   - Verify admin permissions
   - Check if users are selected
   - Look for console errors

3. **Filters not persisting**
   - Ensure URL parameters are encoded
   - Check browser navigation

4. **Photo upload failing**
   - Verify file size limits
   - Check file format (JPG, PNG)
   - Ensure storage bucket permissions

5. **Email not sending**
   - Verify SMTP configuration
   - Check email service quotas
   - Review spam folders

## Related Documentation

- [Authentication and Roles](./authentication-and-roles.md)
- [Database Schema](./database-schema.md)
- [Email Configuration](./email-configuration.md)
- [Security Best Practices](./security.md)