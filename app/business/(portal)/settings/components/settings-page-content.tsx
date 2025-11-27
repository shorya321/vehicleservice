'use client';

/**
 * Settings Page Content Component
 * Client component with luxury styling and animations
 *
 * Design System: Premium B2B experience with refined luxury aesthetic
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Palette,
  Bell,
  Globe,
  ChevronRight,
  Settings,
  Shield,
  User,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LuxuryCard,
  LuxuryCardHeader,
  LuxuryCardTitle,
  LuxuryCardDescription,
  LuxuryCardContent,
  StatusBadge,
} from '@/components/business/ui';
import { FadeIn } from '@/components/business/motion';
import { staggerContainer, staggerItem } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { ProfileSettings } from './profile-settings';

interface BusinessAccount {
  id: string;
  business_name: string;
  business_email: string;
  business_phone: string | null;
  contact_person_name: string | null;
  address: string | null;
  city: string | null;
  country_code: string | null;
  subdomain: string;
  status: string;
}

interface SettingsPageContentProps {
  businessAccountId: string;
  businessAccount: BusinessAccount;
  userRole: string;
}

const settingsLinks = [
  {
    href: '/business/settings/payment',
    icon: CreditCard,
    title: 'Payment Settings',
    description: 'Manage payment methods, currency, and auto-save preferences',
    color: '#60a5fa', // Blue
  },
  {
    href: '/business/settings/branding',
    icon: Palette,
    title: 'Branding',
    description: 'Customize your business logo and brand colors',
    color: '#818CF8', // Indigo-400
  },
  {
    href: '/business/settings/notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Configure email and wallet notification preferences',
    color: '#f472b6', // Pink
  },
  {
    href: '/business/domain',
    icon: Globe,
    title: 'Custom Domain',
    description: 'Configure your custom domain and DNS settings',
    color: '#34d399', // Green
  },
];

export function SettingsPageContent({
  businessAccountId,
  businessAccount,
  userRole,
}: SettingsPageContentProps) {
  const prefersReducedMotion = useReducedMotion();

  const getStatusVariant = (status: string): 'success' | 'warning' | 'info' | 'default' => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'suspended':
        return 'destructive' as 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <FadeIn>
        <div>
          <h1 className="font-[family-name:var(--business-font-display)] text-3xl sm:text-4xl font-semibold text-[var(--business-text-primary)] tracking-tight">
            Settings
          </h1>
          <p className="mt-1 text-[var(--business-text-muted)] font-[family-name:var(--business-font-body)]">
            Manage your business account settings
          </p>
        </div>
      </FadeIn>

      {/* Settings Navigation Grid */}
      <motion.div
        variants={prefersReducedMotion ? undefined : staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2"
      >
        {settingsLinks.map((link, index) => {
          const Icon = link.icon;
          return (
            <motion.div
              key={link.href}
              variants={prefersReducedMotion ? undefined : staggerItem}
            >
              <Link href={link.href} className="block h-full">
                <LuxuryCard
                  variant="interactive"
                  className={cn(
                    'h-full group cursor-pointer',
                    'hover:border-[var(--business-primary-500)]/40',
                    'transition-all duration-300'
                  )}
                >
                  <LuxuryCardContent className="flex items-center gap-4 p-6">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: `${link.color}1A`,
                        color: link.color,
                      }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--business-text-primary)] font-[family-name:var(--business-font-body)]">
                        {link.title}
                      </h3>
                      <p className="text-sm text-[var(--business-text-muted)] line-clamp-2">
                        {link.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[var(--business-text-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--business-primary-400)]" />
                  </LuxuryCardContent>
                </LuxuryCard>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Account Information */}
      <FadeIn delay={0.2}>
        <LuxuryCard>
          <LuxuryCardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--business-primary-500)]/10">
                <Building2 className="h-5 w-5 text-[var(--business-primary-400)]" />
              </div>
              <div>
                <LuxuryCardTitle>Account Information</LuxuryCardTitle>
                <LuxuryCardDescription>Your business account details</LuxuryCardDescription>
              </div>
            </div>
          </LuxuryCardHeader>
          <LuxuryCardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-[var(--business-text-muted)] font-[family-name:var(--business-font-body)]">
                  Account Status
                </p>
                <div className="flex items-center gap-2">
                  <StatusBadge variant={getStatusVariant(businessAccount.status)}>
                    {businessAccount.status}
                  </StatusBadge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-[var(--business-text-muted)] font-[family-name:var(--business-font-body)]">
                  Your Role
                </p>
                <p className="text-[var(--business-text-primary)] font-medium capitalize flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[var(--business-primary-400)]" />
                  {userRole}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-[var(--business-text-muted)] font-[family-name:var(--business-font-body)]">
                  Subdomain
                </p>
                <p className="text-[var(--business-text-secondary)] font-medium text-sm truncate">
                  <span className="text-[var(--business-primary-400)]">{businessAccount.subdomain}</span>
                  <span className="text-[var(--business-text-muted)]">
                    .{process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '').replace('http://', '')}
                  </span>
                </p>
              </div>
            </div>
          </LuxuryCardContent>
        </LuxuryCard>
      </FadeIn>

      {/* Profile Settings */}
      <FadeIn delay={0.3}>
        <ProfileSettings
          businessAccountId={businessAccountId}
          currentData={{
            business_name: businessAccount.business_name,
            business_phone: businessAccount.business_phone,
            contact_person_name: businessAccount.contact_person_name,
            address: businessAccount.address || '',
            city: businessAccount.city || '',
            country_code: businessAccount.country_code || '',
          }}
        />
      </FadeIn>
    </div>
  );
}
