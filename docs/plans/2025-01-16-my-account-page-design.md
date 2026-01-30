# My Account Page Design

**Date:** 2025-01-16
**Status:** Approved
**Location:** `/app/customer/account/` (full rebuild)

---

## Overview

A simplified My Account page for the customer portal using the luxury "Midnight Opulence" frontend design system. Replaces the existing account page with a cleaner, more focused interface.

## Structure

```
┌─────────────────────────────────────────────────────┐
│  PROFILE OVERVIEW CARD                              │
│  Avatar + Name + Email + Profile Completion %       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  [Personal Info]    [Security]    [Preferences]     │
├─────────────────────────────────────────────────────┤
│  Tab content...                                     │
└─────────────────────────────────────────────────────┘
```

## Tabs

### 1. Personal Info
- Full name (editable)
- Phone number (editable)
- Date of birth (new field)
- Address: Street, City, Country (3 fields - new)

### 2. Security
- Password change form (existing functionality)
- Account deletion request (new)

### 3. Preferences
- Email notification toggles (existing 4 switches):
  - Booking Confirmations
  - Payment Receipts
  - Security Alerts
  - Promotional Offers

## Profile Completion Logic

| Field | Percentage |
|-------|------------|
| Name filled | +25% |
| Phone filled | +25% |
| DOB filled | +25% |
| All 3 address fields | +25% |

---

## Database Changes

### Add to `profiles` table:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_country TEXT;
```

### New table:
```sql
CREATE TABLE account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, cancelled
  requested_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);
```

---

## Visual Style

**Design System:** Midnight Opulence (luxury frontend)

### Colors
```css
--black-void: #050506;      /* Page background */
--black-rich: #0a0a0b;      /* Card backgrounds */
--charcoal: #161514;        /* Secondary backgrounds */
--gold: #c6aa88;            /* Accent color */
--text-primary: #f8f6f3;    /* Main text */
--text-secondary: #b8b4ae;  /* Muted text */
```

### Typography
- Display: Cormorant Garamond
- Body: Outfit

### Components
- Glassmorphism cards with gold borders
- Gold gradient buttons
- Inputs with gold focus states
- Noise texture overlay
- Subtle animations

---

## File Structure

```
/app/customer/account/
├── page.tsx              # Server Component (auth + data fetching)
├── account-tabs.tsx      # Client Component (tabs + all forms)
├── actions.ts            # Server Actions
└── schemas.ts            # Zod validation schemas
```

---

## Server Actions

1. `updateProfile(userId, data)` - Update name, phone, DOB, address
2. `uploadAvatar(userId, formData)` - Upload profile picture
3. `updatePassword(currentPassword, newPassword)` - Change password
4. `requestAccountDeletion(userId, reason)` - Submit deletion request
5. `getNotificationPreferences(userId)` - Fetch preferences
6. `updateNotificationPreferences(userId, prefs)` - Update preferences

---

## Constraints

- Keep files under 200 lines
- Use luxury frontend styling (not Shadcn default)
- Validate user ownership in all Server Actions
- Match existing patterns from `/app/customer/`
- Mobile responsive
- No TypeScript `any` types
