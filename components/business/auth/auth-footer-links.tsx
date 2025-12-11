/**
 * Auth Footer Links Component
 * Common navigation links for authentication pages
 *
 * SCOPE: Business module ONLY
 */

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useDomainInfo } from '@/lib/business/hooks/use-domain-info';

type AuthPageVariant = 'login' | 'signup' | 'forgot-password' | 'reset-password';

interface AuthFooterLinksProps {
  /** Which auth page variant to show links for */
  variant: AuthPageVariant;
  /** Additional class names */
  className?: string;
}

const linkConfig: Record<AuthPageVariant, {
  text: string;
  linkText: string;
  href: string;
} | {
  text: string;
  linkText: string;
  href: string;
}[]> = {
  login: {
    text: "Don't have an account?",
    linkText: 'Sign up',
    href: '/business/signup',
  },
  signup: {
    text: 'Already have an account?',
    linkText: 'Sign in',
    href: '/business/login',
  },
  'forgot-password': {
    text: 'Remember your password?',
    linkText: 'Back to login',
    href: '/business/login',
  },
  'reset-password': {
    text: '',
    linkText: 'Back to login',
    href: '/business/login',
  },
};

export function AuthFooterLinks({ variant, className }: AuthFooterLinksProps) {
  const config = linkConfig[variant];
  const { isMainDomain, isLoading } = useDomainInfo();

  // Hide signup link on custom domains and subdomains
  // Signup should only be visible on main platform domain (and localhost for dev)
  // This prevents users from trying to sign up on tenant portals
  if (variant === 'login' && !isMainDomain && !isLoading) {
    return null;
  }

  // Handle single link config
  if (!Array.isArray(config)) {
    return (
      <p className={cn('text-sm text-[var(--luxury-light-gray)]', className)}>
        {config.text && <span>{config.text} </span>}
        <Link
          href={config.href}
          className="auth-link font-medium"
        >
          {config.linkText}
        </Link>
      </p>
    );
  }

  // Handle multiple links (if needed in future)
  return (
    <div className={cn('space-y-2', className)}>
      {config.map((item, index) => (
        <p key={index} className="text-sm text-[var(--luxury-light-gray)]">
          {item.text && <span>{item.text} </span>}
          <Link
            href={item.href}
            className="auth-link font-medium"
          >
            {item.linkText}
          </Link>
        </p>
      ))}
    </div>
  );
}

/**
 * Forgot password link - commonly used in login forms
 */
interface ForgotPasswordLinkProps {
  className?: string;
}

export function ForgotPasswordLink({ className }: ForgotPasswordLinkProps) {
  return (
    <div className={cn('text-right', className)}>
      <Link
        href="/business/forgot-password"
        className="text-sm text-[var(--luxury-light-gray)] hover:text-[var(--luxury-gold)] transition-colors"
      >
        Forgot your password?
      </Link>
    </div>
  );
}
