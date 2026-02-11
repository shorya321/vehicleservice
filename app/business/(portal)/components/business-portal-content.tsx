'use client';

/**
 * Business Portal Content Wrapper
 * Handles dynamic margin based on sidebar collapse state
 */

import { type ReactNode } from 'react';
import { motion } from 'motion/react';
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
  const expandedWidth = 256;
  const collapsedWidth = 72;
  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;

  return (
    <motion.div
      initial={false}
      animate={{ marginLeft: currentWidth }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 300, damping: 30 }
      }
      className={cn(
        'min-h-screen flex flex-col',
        'bg-background',
        !prefersReducedMotion && 'will-change-[margin-left]',
        'max-md:!ml-0'
      )}
      style={{ marginLeft: prefersReducedMotion ? currentWidth : undefined }}
    >
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

      <main id="main-content" className="flex-1 pt-14" tabIndex={-1}>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </motion.div>
  );
}
