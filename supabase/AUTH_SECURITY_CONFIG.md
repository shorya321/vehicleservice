# Supabase Auth Security Configuration

This document outlines the additional security configurations needed in Supabase Auth to resolve the remaining security warnings.

## 🔐 Security Warnings to Address

### 1. Leaked Password Protection
**Warning**: `auth_leaked_password_protection`
**Status**: Currently disabled

**What it does**: Prevents users from using passwords that have been compromised in known data breaches by checking against HaveIBeenPwned.org database.

**How to enable**:

#### Option A: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Settings**
3. Scroll to **Password Security** section
4. Enable **"Check against known password breaches"**
5. Save changes

#### Option B: Via Supabase CLI
```bash
supabase settings update auth --password-require-confirmed-breach=true
```

### 2. Multi-Factor Authentication (MFA)
**Warning**: `auth_insufficient_mfa_options`
**Status**: Insufficient MFA options enabled

**What it does**: Provides additional security layers for user authentication beyond passwords.

**How to enable**:

#### Option A: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Settings**
3. Scroll to **Multi-Factor Authentication** section
4. Enable the following MFA methods:
   - **TOTP (Time-based One-Time Password)** - Recommended
   - **SMS** - If phone number collection is available
   - **WebAuthn** - For hardware security keys

#### Option B: Via Supabase CLI
```bash
# Enable TOTP
supabase settings update auth --mfa-enroll-totp=true

# Enable SMS (requires SMS provider configuration)
supabase settings update auth --mfa-enroll-sms=true

# Enable WebAuthn
supabase settings update auth --mfa-enroll-webauthn=true
```

## 🎯 Recommended Security Configuration

For optimal security, enable:
1. ✅ **Leaked Password Protection** - Essential for preventing known compromised passwords
2. ✅ **TOTP MFA** - Most accessible and secure MFA method
3. ✅ **WebAuthn MFA** - For users with hardware security keys
4. ⚠️ **SMS MFA** - Only if you have SMS provider configured

## 📋 Verification Steps

After applying these configurations:

1. Check the Supabase project dashboard for any remaining security warnings
2. Test user registration with a known compromised password (should be rejected)
3. Test MFA enrollment flow for new users
4. Verify that the security warnings are resolved in the project's advisor dashboard

## 🔗 References

- [Supabase Password Security Documentation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [Supabase MFA Documentation](https://supabase.com/docs/guides/auth/auth-mfa)
- [Database Linter Documentation](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)