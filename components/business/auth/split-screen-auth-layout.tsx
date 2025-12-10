/**
 * Split Screen Auth Layout Component
 * Main wrapper for authentication pages with brand panel and form panel
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AuthBrandPanel, AuthBrandHeader } from './auth-brand-panel';
import { AuthFormPanel } from './auth-form-panel';

interface BrandConfig {
  /** Custom logo element */
  logo?: ReactNode;
  /** Main tagline (supports \n for line breaks) */
  tagline: string;
  /** Description below tagline */
  description?: string;
  /** Show floating particles */
  showParticles?: boolean;
}

interface SplitScreenAuthLayoutProps {
  /** Form panel content */
  children: ReactNode;
  /** Brand panel configuration */
  brandConfig?: BrandConfig;
  /** Hide brand panel (full-width form) */
  hideBrandPanel?: boolean;
  /** Max width for form container */
  formMaxWidth?: 'sm' | 'md' | 'lg';
  /** Additional class names for the wrapper */
  className?: string;
}

// Default brand config
const defaultBrandConfig: BrandConfig = {
  tagline: 'Premium\nTransfer Services',
  description: 'Manage your bookings, track performance, and grow your business.',
  showParticles: true,
};

export function SplitScreenAuthLayout({
  children,
  brandConfig = defaultBrandConfig,
  hideBrandPanel = false,
  formMaxWidth = 'md',
  className,
}: SplitScreenAuthLayoutProps) {
  const config = { ...defaultBrandConfig, ...brandConfig };

  if (hideBrandPanel) {
    // Full-width form layout (no brand panel)
    return (
      <div className={cn('min-h-screen min-h-dvh bg-[var(--luxury-black)]', className)}>
        <div className="flex flex-col justify-center items-center min-h-screen p-4">
          <div className={cn(
            'w-full',
            formMaxWidth === 'sm' && 'max-w-sm',
            formMaxWidth === 'md' && 'max-w-md',
            formMaxWidth === 'lg' && 'max-w-lg',
          )}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('auth-split-screen', className)}>
      {/* Mobile header (visible only on small screens) */}
      <div className="md:hidden">
        <AuthBrandHeader logo={config.logo} />
      </div>

      {/* Brand Panel (left side - hidden on mobile) */}
      <div className="hidden md:block h-full">
        <AuthBrandPanel
          logo={config.logo}
          tagline={config.tagline}
          description={config.description}
          showParticles={config.showParticles}
        />
      </div>

      {/* Form Panel (right side) */}
      <AuthFormPanel maxWidth={formMaxWidth} className="h-full">
        {children}
      </AuthFormPanel>
    </div>
  );
}

/**
 * Pre-configured layouts for common auth pages
 */

export function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <SplitScreenAuthLayout
      brandConfig={{
        tagline: 'Welcome\nBack',
        description: 'Sign in to access your business portal and manage your operations.',
      }}
    >
      {children}
    </SplitScreenAuthLayout>
  );
}

export function SignupLayout({ children }: { children: ReactNode }) {
  return (
    <SplitScreenAuthLayout
      brandConfig={{
        tagline: 'Start Your\nJourney',
        description: 'Create your business account and unlock premium transfer services.',
      }}
      formMaxWidth="lg"
    >
      {children}
    </SplitScreenAuthLayout>
  );
}

export function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return (
    <SplitScreenAuthLayout
      brandConfig={{
        tagline: 'Reset Your\nPassword',
        description: "Don't worry, we'll send you instructions to recover your account.",
      }}
    >
      {children}
    </SplitScreenAuthLayout>
  );
}

export function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return (
    <SplitScreenAuthLayout
      brandConfig={{
        tagline: 'Create New\nPassword',
        description: 'Choose a strong password to secure your business account.',
      }}
    >
      {children}
    </SplitScreenAuthLayout>
  );
}
