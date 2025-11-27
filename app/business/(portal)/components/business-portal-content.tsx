'use client';

/**
 * Business Portal Content Wrapper
 * Handles dynamic margin based on sidebar collapse state
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * SCOPE: Business module ONLY
 */

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/business/sidebar-context';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { BusinessHeader } from './business-header';

interface BusinessPortalContentProps {
  children: ReactNode;
  userEmail: string;
  contactPersonName: string | null;
  businessName: string;
  brandName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
}

export function BusinessPortalContent({
  children,
  userEmail,
  contactPersonName,
  businessName,
  brandName,
  logoUrl,
  primaryColor,
  secondaryColor,
  accentColor,
}: BusinessPortalContentProps) {
  const { isCollapsed } = useSidebar();
  const prefersReducedMotion = useReducedMotion();

  // Sidebar widths - match sidebar component
  const expandedWidth = 240;
  const collapsedWidth = 64;
  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;

  return (
    <motion.div
      initial={false}
      animate={{
        marginLeft: currentWidth,
      }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : {
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }
      }
      className={cn(
        'min-h-screen flex flex-col',
        'bg-[var(--business-surface-0)]',
        'transition-[margin-left] duration-300 ease-out',
        !prefersReducedMotion && 'will-change-[margin-left]'
      )}
      style={{
        marginLeft: prefersReducedMotion ? currentWidth : undefined,
      }}
    >
      {/* Header */}
      <BusinessHeader
        userEmail={userEmail}
        contactPersonName={contactPersonName}
        businessName={businessName}
        brandName={brandName}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
      />

      {/* Main Content - with top padding for fixed header */}
      <main className="flex-1 pt-16">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </motion.div>
  );
}
