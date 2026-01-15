'use client';

/**
 * Settings Page Content Component
 * Client component with luxury styling and animations
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader, PageContainer } from '@/components/business/layout';
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

// Settings links with accent colors
const settingsLinks = [
  {
    href: '/business/settings/payment',
    icon: CreditCard,
    title: 'Payment Settings',
    description: 'Manage payment methods, currency, and auto-save preferences',
    colorClass: 'border-l-emerald-500',
    iconColorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    href: '/business/settings/branding',
    icon: Palette,
    title: 'Branding',
    description: 'Customize your business logo and brand colors',
    colorClass: 'border-l-violet-500',
    iconColorClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    href: '/business/settings/notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Configure email and wallet notification preferences',
    colorClass: 'border-l-primary',
    iconColorClass: 'bg-primary/10 text-primary',
  },
  {
    href: '/business/domain',
    icon: Globe,
    title: 'Custom Domain',
    description: 'Configure your custom domain and DNS settings',
    colorClass: 'border-l-sky-500',
    iconColorClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
];

export function SettingsPageContent({
  businessAccountId,
  businessAccount,
  userRole,
}: SettingsPageContentProps) {
  const prefersReducedMotion = useReducedMotion();

  // Status badges with semantic colors
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      active: { className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30', label: 'Active' },
      pending: { className: 'bg-primary/10 text-primary border border-primary/30', label: 'Pending' },
      suspended: { className: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30', label: 'Suspended' },
    };
    const config = variants[status.toLowerCase()] || { className: 'bg-muted text-muted-foreground border border-border', label: status };
    return (
      <Badge className={cn('capitalize', config.className)}>
        {config.label}
      </Badge>
    );
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Settings"
        description="Manage your business account settings"
      />

      {/* Settings Navigation Grid */}
      <motion.div
        variants={prefersReducedMotion ? undefined : staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2"
      >
        {settingsLinks.map((link) => {
          const Icon = link.icon;
          return (
            <motion.div
              key={link.href}
              variants={prefersReducedMotion ? undefined : staggerItem}
            >
              <Link href={link.href} className="block h-full">
                <Card
                  className={cn(
                    'h-full group cursor-pointer rounded-xl',
                    'bg-card border border-border',
                    'shadow-sm hover:shadow-md',
                    'transition-all duration-300'
                  )}
                >
                  <CardContent className="flex items-center gap-4 p-6">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
                        link.iconColorClass
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-foreground transition-colors duration-200">
                        {link.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {link.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-foreground" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Account Information */}
      <FadeIn delay={0.2}>
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Account Information
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your business account details
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Account Status
                </p>
                <div className="flex items-center gap-2">
                  {getStatusBadge(businessAccount.status)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Your Role
                </p>
                <p className="text-foreground font-medium capitalize flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  {userRole}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Subdomain
                </p>
                <p className="font-medium text-sm truncate">
                  <span className="text-primary">{businessAccount.subdomain}</span>
                  <span className="text-muted-foreground">
                    .{process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '').replace('http://', '')}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
    </PageContainer>
  );
}
