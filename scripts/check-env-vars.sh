#!/bin/bash

# Stripe Connect Environment Variables Verification Script
# Checks if all required environment variables are configured

echo "=== Stripe Connect Environment Verification ==="
echo ""

# Platform Stripe Keys
echo "Platform Stripe Keys:"
[ -n "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ] && echo "  ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" || echo "  ❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
[ -n "$STRIPE_SECRET_KEY" ] && echo "  ✅ STRIPE_SECRET_KEY" || echo "  ❌ STRIPE_SECRET_KEY"
[ -n "$STRIPE_WEBHOOK_SECRET" ] && echo "  ✅ STRIPE_WEBHOOK_SECRET" || echo "  ⚠️  STRIPE_WEBHOOK_SECRET (use Stripe CLI for local dev)"
echo ""

# Stripe Connect
echo "Stripe Connect (Multi-Tenant):"
[ -n "$STRIPE_CONNECT_CLIENT_ID" ] && echo "  ✅ STRIPE_CONNECT_CLIENT_ID" || echo "  ❌ STRIPE_CONNECT_CLIENT_ID (CRITICAL)"
[ -n "$STRIPE_CONNECT_STATE_SECRET" ] && echo "  ✅ STRIPE_CONNECT_STATE_SECRET" || echo "  ⚠️  STRIPE_CONNECT_STATE_SECRET (Optional - has fallback)"
echo ""

# Encryption
echo "Encryption:"
if [ -n "$ENCRYPTION_KEY" ]; then
  echo "  ✅ ENCRYPTION_KEY"
  # Note: Base64 validation would require additional tools
  echo "     Length check: Use node script for detailed validation"
else
  echo "  ❌ ENCRYPTION_KEY (CRITICAL)"
fi
echo ""

# Email
echo "Email Service:"
[ -n "$RESEND_API_KEY" ] && echo "  ✅ RESEND_API_KEY" || echo "  ❌ RESEND_API_KEY"
[ -n "$RESEND_FROM_EMAIL" ] && echo "  ✅ RESEND_FROM_EMAIL" || echo "  ❌ RESEND_FROM_EMAIL"
echo ""

# Application URLs
echo "Application URLs:"
[ -n "$NEXT_PUBLIC_APP_URL" ] && echo "  ✅ NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL" || echo "  ⚠️  NEXT_PUBLIC_APP_URL (will use default)"
[ -n "$NEXT_PUBLIC_SITE_URL" ] && echo "  ✅ NEXT_PUBLIC_SITE_URL: $NEXT_PUBLIC_SITE_URL" || echo "  ⚠️  NEXT_PUBLIC_SITE_URL (will use default)"
echo ""

# Critical Check
echo "=== Status Summary ==="
MISSING_CRITICAL=0

if [ -z "$STRIPE_CONNECT_CLIENT_ID" ]; then
  echo "❌ CRITICAL: STRIPE_CONNECT_CLIENT_ID missing"
  echo "   Get from: Stripe Dashboard → Connect → Settings → OAuth Settings"
  MISSING_CRITICAL=1
fi

if [ -z "$ENCRYPTION_KEY" ]; then
  echo "❌ CRITICAL: ENCRYPTION_KEY missing"
  echo "   Generate with: openssl rand -base64 32"
  MISSING_CRITICAL=1
fi

if [ -z "$RESEND_API_KEY" ]; then
  echo "⚠️  WARNING: RESEND_API_KEY missing (email notifications won't work)"
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
  echo "⚠️  WARNING: STRIPE_WEBHOOK_SECRET missing (webhooks won't verify)"
  echo "   For local dev: stripe listen --forward-to localhost:3001/api/business/wallet/webhook"
fi

echo ""

if [ $MISSING_CRITICAL -eq 0 ]; then
  echo "✅ All critical variables configured"
  echo "   You can proceed with Stripe Connect OAuth testing"
  exit 0
else
  echo "❌ CRITICAL VARIABLES MISSING - OAuth flow will not work"
  echo ""
  echo "Next steps:"
  echo "1. Add missing variables to .env.local"
  echo "2. Restart development server: npm run dev"
  echo "3. Run this script again to verify"
  exit 1
fi
